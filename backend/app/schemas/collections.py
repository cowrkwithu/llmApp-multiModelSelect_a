from pydantic import BaseModel


class CollectionCreateRequest(BaseModel):
    model_id: str
    label: str


class CollectionResponse(BaseModel):
    name: str
    points_count: int


class CollectionListResponse(BaseModel):
    collections: list[CollectionResponse]
