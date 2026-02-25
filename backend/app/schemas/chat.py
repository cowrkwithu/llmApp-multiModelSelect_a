from pydantic import BaseModel


class ChatQueryRequest(BaseModel):
    question: str
    collection: str
    model_id: str | None = None
    top_k: int = 5


class ChatNoRagRequest(BaseModel):
    question: str
    model_id: str | None = None
