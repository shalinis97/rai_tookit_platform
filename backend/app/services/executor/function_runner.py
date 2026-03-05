import asyncio
import ast
import json
import logging
from app.core.exceptions import ExecutionError

logger = logging.getLogger(__name__)

_SAFE_BUILTINS = {
    "abs","all","any","bool","dict","divmod","enumerate","filter","float",
    "format","frozenset","getattr","hasattr","hash","int","isinstance",
    "issubclass","iter","len","list","map","max","min","next","print",
    "range","repr","reversed","round","set","slice","sorted","str","sum",
    "tuple","type","zip",
}


def _make_restricted_globals():
    import builtins
    safe = {k: getattr(builtins, k) for k in _SAFE_BUILTINS if hasattr(builtins, k)}
    return {"__builtins__": safe}


class FunctionRunner:
    async def run(self, config: dict, input_data: dict) -> dict:
        code            = config.get("code", "")
        timeout_ms      = int(config.get("timeout", 5000))
        timeout_seconds = timeout_ms / 1000

        logger.info(f"[FUNCTION] Running code (timeout={timeout_seconds}s)")
        logger.info(f"[FUNCTION] input={json.dumps(input_data, default=str)[:200]}")

        if not code.strip():
            logger.info("[FUNCTION] No code — passing input through")
            return input_data

        try:
            result = await asyncio.wait_for(
                _execute_code(code, input_data),
                timeout=timeout_seconds,
            )
        except asyncio.TimeoutError:
            raise ExecutionError(f"Function timed out after {timeout_seconds}s")
        except Exception as e:
            raise ExecutionError(f"Function execution error: {e}")

        if not isinstance(result, dict):
            result = {"result": result, "output": str(result)}

        logger.info(f"[FUNCTION] result={json.dumps(result, default=str)[:200]}")
        return result


async def _execute_code(code: str, input_data: dict) -> dict:
    namespace = _make_restricted_globals()
    namespace["input"] = input_data
    namespace["json"]  = json

    try:
        ast.parse(code)
    except SyntaxError as e:
        raise ExecutionError(f"Syntax error: {e}")

    exec(compile(code, "<function_node>", "exec"), namespace)  # noqa: S102

    fn = None
    for key, val in namespace.items():
        if callable(val) and asyncio.iscoroutinefunction(val) and not key.startswith("_"):
            fn = val
            break

    if fn is None:
        raise ExecutionError("No async function found. Define: `async def run(input): ...`")

    return await fn(input_data)
