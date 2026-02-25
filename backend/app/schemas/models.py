from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str
    name: str
    quantization: str
    size_gb: float
    context_length: int
    languages: list[str]
    description: str


class ModelListResponse(BaseModel):
    models: list[ModelInfo]


class ActiveModelResponse(BaseModel):
    model_id: str | None
    vllm_status: str
    error: str | None = None


class SwitchModelRequest(BaseModel):
    model_id: str


class SwitchModelResponse(BaseModel):
    message: str
    model_id: str
