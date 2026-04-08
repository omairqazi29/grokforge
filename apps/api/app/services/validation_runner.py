import asyncio
import time
from dataclasses import dataclass


ALLOWED_COMMANDS = {"npm", "npx", "pnpm", "yarn", "pytest", "python", "node", "make", "ruff"}
TIMEOUT_SECONDS = 120


@dataclass
class ValidationResult:
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: int


class ValidationRunner:
    async def run(self, command: str, cwd: str) -> ValidationResult:
        parts = command.split()
        if not parts:
            return ValidationResult(exit_code=1, stdout="", stderr="Empty command", duration_ms=0)

        base_cmd = parts[0]
        if base_cmd not in ALLOWED_COMMANDS:
            return ValidationResult(
                exit_code=1,
                stdout="",
                stderr=f"Command '{base_cmd}' is not in the allowed list: {ALLOWED_COMMANDS}",
                duration_ms=0,
            )

        start = time.monotonic()
        try:
            proc = await asyncio.create_subprocess_exec(
                *parts,
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
                stdout=stdout.decode(errors="replace")[:10000],
                stderr=stderr.decode(errors="replace")[:10000],
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
        except FileNotFoundError:
            return ValidationResult(
                exit_code=127,
                stdout="",
                stderr=f"Command not found: {base_cmd}",
                duration_ms=0,
            )
