from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.schemas.chat import ChatNoRagRequest, ChatQueryRequest
from app.services.rag_pipeline import query_no_rag, query_with_rag
from app.services.vllm_client import get_loaded_model

router = APIRouter()


@router.post("/query")
async def chat_query(req: ChatQueryRequest):
    model_id = req.model_id or await get_loaded_model()
    if not model_id:
        return {"error": "No model loaded in vLLM"}

    return EventSourceResponse(
        query_with_rag(
            question=req.question,
            collection=req.collection,
            model_id=model_id,
            top_k=req.top_k,
        )
    )


@router.post("/query-no-rag")
async def chat_no_rag(req: ChatNoRagRequest):
    model_id = req.model_id or await get_loaded_model()
    if not model_id:
        return {"error": "No model loaded in vLLM"}

    return EventSourceResponse(
        query_no_rag(question=req.question, model_id=model_id)
    )
