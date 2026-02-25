from fastapi import APIRouter, HTTPException

from app.schemas.collections import (
    CollectionCreateRequest,
    CollectionListResponse,
    CollectionResponse,
)
from app.services.qdrant_service import (
    collection_name,
    delete_collection,
    ensure_collection,
    list_collections,
)

router = APIRouter()


@router.get("/", response_model=CollectionListResponse)
async def get_collections(model_id: str | None = None):
    cols = list_collections(model_id)
    return CollectionListResponse(
        collections=[CollectionResponse(**c) for c in cols]
    )


@router.post("/", response_model=CollectionResponse)
async def create_collection(req: CollectionCreateRequest):
    name = collection_name(req.model_id, req.label)
    ensure_collection(name)
    return CollectionResponse(name=name, points_count=0)


@router.delete("/{name}")
async def remove_collection(name: str):
    try:
        delete_collection(name)
        return {"message": f"Collection '{name}' deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
