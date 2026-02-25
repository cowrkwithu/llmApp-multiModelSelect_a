from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    chunks_count: int
    collection: str


class UploadResult(BaseModel):
    results: list[DocumentUploadResponse]
    errors: list[dict]


class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    chunk_index: int


class DocumentListResponse(BaseModel):
    documents: list[dict]
    collection: str
