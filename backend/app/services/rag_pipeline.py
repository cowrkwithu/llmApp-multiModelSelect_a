import json
from collections.abc import AsyncGenerator

from app.services import qdrant_service
from app.services.vllm_client import get_openai_client

SYSTEM_PROMPT = """You are a helpful assistant. Answer the user's question based on the provided context.
If the context doesn't contain relevant information, say so honestly.
Always cite which source documents you used in your answer.

Context:
{context}"""

NO_RAG_SYSTEM_PROMPT = "You are a helpful assistant. Answer the user's question directly."


async def query_with_rag(
    question: str,
    collection: str,
    model_id: str,
    top_k: int = 5,
) -> AsyncGenerator[str, None]:
    search_results = qdrant_service.search_similar(collection, question, top_k=top_k)

    context_parts = []
    sources = []
    for i, result in enumerate(search_results):
        context_parts.append(f"[{i + 1}] {result['text']}")
        sources.append(
            {
                "index": i + 1,
                "filename": result["metadata"].get("filename", "unknown"),
                "score": round(result["score"], 4),
                "chunk_index": result["metadata"].get("chunk_index", 0),
            }
        )

    context = "\n\n".join(context_parts)
    system_msg = SYSTEM_PROMPT.format(context=context)

    client = get_openai_client()
    stream = await client.chat.completions.create(
        model=model_id,
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": question},
        ],
        stream=True,
        max_tokens=2048,
        temperature=0.7,
    )

    # First event: sources
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

    # Stream tokens
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield f"data: {json.dumps({'type': 'token', 'content': delta.content})}\n\n"

    yield "data: {\"type\": \"done\"}\n\n"


async def query_no_rag(
    question: str,
    model_id: str,
) -> AsyncGenerator[str, None]:
    client = get_openai_client()
    stream = await client.chat.completions.create(
        model=model_id,
        messages=[
            {"role": "system", "content": NO_RAG_SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        stream=True,
        max_tokens=2048,
        temperature=0.7,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield f"data: {json.dumps({'type': 'token', 'content': delta.content})}\n\n"

    yield "data: {\"type\": \"done\"}\n\n"
