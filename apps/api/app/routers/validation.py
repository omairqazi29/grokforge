import asyncio
import json
import logging
import time
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.models.session import Session
from app.models.repository import Repository
from app.models.validation_run import ValidationRun
from app.schemas import ValidationRunCreate, ValidationRunResponse
from app.ai import get_ai_provider

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{session_id}/validations", response_model=List[ValidationRunResponse])
async def list_validations(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ValidationRun)
        .where(ValidationRun.session_id == session_id)
        .order_by(ValidationRun.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/{session_id}/validate-stream",
)
async def run_validation_stream(
    session_id: int, body: ValidationRunCreate, db: AsyncSession = Depends(get_db)
):
    """Stream terminal output in realtime via SSE, then append Grok analysis."""
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    repo = await db.get(Repository, session.repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    session.status = "validating"
    await db.commit()

    async def event_stream():
        start = time.monotonic()
        stdout_buf = []
        stderr_buf = []
        exit_code = -1

        try:
            proc = await asyncio.create_subprocess_shell(
                body.command,
                cwd=repo.path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            async def read_stream(stream, name, buf):
                async for line in stream:
                    text = line.decode(errors="replace")
                    buf.append(text)
                    yield f"data: {json.dumps({'type': name, 'text': text})}\n\n"

            # Read stdout and stderr concurrently
            async def merged():
                tasks = [
                    asyncio.create_task(collect(proc.stdout, "stdout", stdout_buf)),
                    asyncio.create_task(collect(proc.stderr, "stderr", stderr_buf)),
                ]
                await asyncio.gather(*tasks)

            async def collect(stream, name, buf):
                async for line in stream:
                    text = line.decode(errors="replace")
                    buf.append(text)

            # Stream stdout
            if proc.stdout:
                async for line in proc.stdout:
                    text = line.decode(errors="replace")
                    stdout_buf.append(text)
                    yield f"data: {json.dumps({'type': 'stdout', 'text': text})}\n\n"

            # Stream stderr
            if proc.stderr:
                async for line in proc.stderr:
                    text = line.decode(errors="replace")
                    stderr_buf.append(text)
                    yield f"data: {json.dumps({'type': 'stderr', 'text': text})}\n\n"

            await proc.wait()
            exit_code = proc.returncode or 0

        except asyncio.TimeoutError:
            exit_code = 124
            msg = "Command timed out\n"
            logger.warning("Validation command timed out: %s", body.command)
            stderr_buf.append(msg)
            evt = json.dumps({"type": "stderr", "text": msg})
            yield f"data: {evt}\n\n"
        except OSError as e:
            exit_code = 1
            msg = str(e) + "\n"
            logger.error("OS error running validation command: %s", e)
            stderr_buf.append(msg)
            evt = json.dumps({"type": "stderr", "text": msg})
            yield f"data: {evt}\n\n"
        except RuntimeError as e:
            exit_code = 1
            msg = str(e) + "\n"
            logger.error("Runtime error running validation command: %s", e)
            stderr_buf.append(msg)
            evt = json.dumps({"type": "stderr", "text": msg})
            yield f"data: {evt}\n\n"

        elapsed = int((time.monotonic() - start) * 1000)

        # Send exit info
        yield f"data: {json.dumps({'type': 'exit', 'exit_code': exit_code, 'duration_ms': elapsed})}\n\n"

        # Now run Grok analysis (user sees output already)
        yield f"data: {json.dumps({'type': 'analyzing', 'text': 'Analyzing output with Grok...'})}\n\n"

        from app.ai.provider import ValidationResult as VR
        provider = get_ai_provider()
        vr = VR(
            exit_code=exit_code,
            stdout="".join(stdout_buf)[:10000],
            stderr="".join(stderr_buf)[:10000],
            duration_ms=elapsed,
        )
        analysis = await provider.analyze_validation(vr)

        yield f"data: {json.dumps({'type': 'analysis', 'text': analysis.summary})}\n\n"

        # Save to DB
        async with async_session() as save_db:
            run = ValidationRun(
                session_id=session_id,
                patch_artifact_id=body.patch_artifact_id,
                command=body.command,
                exit_code=exit_code,
                stdout="".join(stdout_buf)[:50000],
                stderr="".join(stderr_buf)[:50000],
                analysis=analysis.summary,
                duration_ms=elapsed,
            )
            save_db.add(run)
            s = await save_db.get(Session, session_id)
            if s:
                s.status = "reviewing"
            await save_db.commit()
            await save_db.refresh(run)
            yield f"data: {json.dumps({'type': 'done', 'run_id': run.id})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post(
    "/{session_id}/validate", response_model=ValidationRunResponse, status_code=201
)
async def run_validation(
    session_id: int, body: ValidationRunCreate, db: AsyncSession = Depends(get_db)
):
    """Non-streaming fallback."""
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    repo = await db.get(Repository, session.repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    session.status = "validating"
    await db.commit()

    from app.services.validation_runner import ValidationRunner
    runner = ValidationRunner()
    result = await runner.run(body.command, repo.path)

    provider = get_ai_provider()
    analysis = await provider.analyze_validation(result)

    run = ValidationRun(
        session_id=session_id,
        patch_artifact_id=body.patch_artifact_id,
        command=body.command,
        exit_code=result.exit_code,
        stdout=result.stdout,
        stderr=result.stderr,
        analysis=analysis.summary,
        duration_ms=result.duration_ms,
    )
    db.add(run)
    session.status = "reviewing"
    await db.commit()
    await db.refresh(run)
    return run
