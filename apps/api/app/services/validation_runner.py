import asyncio
import time
from dataclasses import dataclass

TIMEOUT_SECONDS = 120


@dataclass
class ValidationResult:
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: int


class ValidationRunner:
    async def run(self, command: str, cwd: str) -> ValidationResult:
        if not command.strip():
            return ValidationResult(exit_code=1, stdout="", stderr="Empty command", duration_ms=0)

        start = time.monotonic()
        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=TIMEOUT_SECONDS
            )
            elapsed = int((time.monotonic() - start) * 1000)
            return ValidationResult(
                exit_code=proc.returncode or 0,
                stdout=stdout.decode(errors="replace")[:50000],
                stderr=stderr.decode(errors="replace")[:50000],
                duration_ms=elapsed,
            )
        except asyncio.TimeoutError:
            elapsed = int((time.monotonic() - start) * 1000)
            return ValidationResult(
                exit_code=124,
                stdout="",
                stderr=f"Command timed out after {TIMEOUT_SECONDS}s",
                duration_ms=elapsed,
            )
        except Exception as e:
            return ValidationResult(
                exit_code=1,
                stdout="",
                stderr=str(e),
                duration_ms=int((time.monotonic() - start) * 1000),
            )
