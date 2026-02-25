import httpx
from openai import AsyncOpenAI

from app.core.config import settings

_openai_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(
            base_url=settings.vllm_base_url,
            api_key="not-needed",
        )
    return _openai_client


def reset_openai_client():
    global _openai_client
    _openai_client = None


async def check_vllm_health() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"http://{settings.vllm_host}:{settings.vllm_port}/health"
            )
            return {"status": "healthy" if resp.status_code == 200 else "unhealthy"}
    except Exception as e:
        return {"status": "unreachable", "error": str(e)}


async def get_loaded_model() -> str | None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"http://{settings.vllm_host}:{settings.vllm_port}/v1/models"
            )
            if resp.status_code == 200:
                data = resp.json()
                models = data.get("data", [])
                if models:
                    return models[0]["id"]
    except Exception:
        pass
    return None
