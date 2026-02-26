from fastapi import APIRouter, HTTPException

from app.schemas.models import (
    ActiveModelResponse,
    ModelInfo,
    ModelListResponse,
    SwitchModelRequest,
    SwitchModelResponse,
)
from app.services.ollama_client import (
    check_ollama_health,
    list_installed_models,
)

router = APIRouter()

_selected_model_id: str | None = None


@router.get("/", response_model=ModelListResponse)
async def list_models():
    ollama_models = await list_installed_models()
    models = []
    for m in ollama_models:
        details = m.get("details", {})
        size_bytes = m.get("size", 0)
        size_gb = round(size_bytes / (1024**3), 1)
        models.append(
            ModelInfo(
                id=m["name"],
                name=m["name"],
                parameter_size=details.get("parameter_size", ""),
                family=details.get("family", ""),
                quantization=details.get("quantization_level", ""),
                size_gb=size_gb,
            )
        )
    return ModelListResponse(models=models)


@router.get("/active", response_model=ActiveModelResponse)
async def get_active_model():
    global _selected_model_id
    health = await check_ollama_health()

    # Auto-select first installed model if none selected
    if _selected_model_id is None and health["status"] == "healthy":
        ollama_models = await list_installed_models()
        if ollama_models:
            _selected_model_id = ollama_models[0]["name"]

    return ActiveModelResponse(
        model_id=_selected_model_id,
        status=health["status"],
        error=health.get("error"),
    )


@router.post("/switch", response_model=SwitchModelResponse)
async def switch_model(req: SwitchModelRequest):
    global _selected_model_id
    ollama_models = await list_installed_models()
    valid_ids = {m["name"] for m in ollama_models}
    if req.model_id not in valid_ids:
        raise HTTPException(status_code=400, detail=f"Unknown model: {req.model_id}")

    _selected_model_id = req.model_id
    return SwitchModelResponse(message="Model selected", model_id=req.model_id)


@router.get("/status")
async def model_status():
    return await check_ollama_health()
