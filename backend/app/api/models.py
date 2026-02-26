import subprocess

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.schemas.models import (
    ActiveModelResponse,
    ModelInfo,
    ModelListResponse,
    SwitchModelRequest,
    SwitchModelResponse,
)
from app.services.vllm_client import check_vllm_health, get_loaded_model, reset_openai_client

router = APIRouter()


@router.get("/", response_model=ModelListResponse)
async def list_models():
    models_data = settings.load_model_registry()
    models = [ModelInfo(**m) for m in models_data]
    return ModelListResponse(models=models)


@router.get("/active", response_model=ActiveModelResponse)
async def get_active_model():
    health = await check_vllm_health()
    model_id = await get_loaded_model()
    return ActiveModelResponse(
        model_id=model_id,
        vllm_status=health["status"],
        error=health.get("error"),
    )


@router.post("/switch", response_model=SwitchModelResponse)
async def switch_model(req: SwitchModelRequest):
    registry = settings.load_model_registry()
    valid_ids = {m["id"] for m in registry}
    if req.model_id not in valid_ids:
        raise HTTPException(status_code=400, detail=f"Unknown model: {req.model_id}")

    project_dir = str(settings.models_json_path).rsplit("/docker", 1)[0]
    try:
        subprocess.run(
            ["docker", "compose", "stop", "vllm"],
            cwd=project_dir,
            check=True,
            capture_output=True,
            timeout=30,
        )
        subprocess.run(
            ["docker", "compose", "rm", "-f", "vllm"],
            cwd=project_dir,
            capture_output=True,
            timeout=10,
        )
        subprocess.run(
            [
                "docker", "compose", "run", "-d",
                "--name", "vllm-server",
                "-e", f"DEFAULT_MODEL_ID={req.model_id}",
                "--service-ports", "vllm",
            ],
            cwd=project_dir,
            check=True,
            capture_output=True,
            timeout=30,
        )
    except subprocess.SubprocessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to switch model: {e}")

    reset_openai_client()
    return SwitchModelResponse(message="Model switch initiated", model_id=req.model_id)


@router.get("/status")
async def model_status():
    return await check_vllm_health()
