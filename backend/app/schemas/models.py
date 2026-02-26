from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str
    name: str
    parameter_size: str
    family: str
    quantization: str
    size_gb: float


class ModelListResponse(BaseModel):
    models: list[ModelInfo]


class ActiveModelResponse(BaseModel):
    model_id: str | None
    status: str
    error: str | None = None


class SwitchModelRequest(BaseModel):
    model_id: str


class SwitchModelResponse(BaseModel):
    message: str
    model_id: str
