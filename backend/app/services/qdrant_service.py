import uuid

from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.core.dependencies import get_qdrant_client
from app.services.embedding_service import embed_query, get_embedding_dimension


def _client() -> QdrantClient:
    return get_qdrant_client()


def collection_name(model_id: str, label: str) -> str:
    safe_model = model_id.replace("/", "__")
    return f"{safe_model}__{label}"


def ensure_collection(name: str) -> bool:
    client = _client()
    try:
        client.get_collection(name)
        return False
    except (UnexpectedResponse, Exception):
        dim = get_embedding_dimension()
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
        )
        return True


def list_collections(model_id: str | None = None) -> list[dict]:
    client = _client()
    all_cols = client.get_collections().collections
    results = []
    for col in all_cols:
        info = client.get_collection(col.name)
        entry = {
            "name": col.name,
            "points_count": info.points_count,
        }
        if model_id:
            safe = model_id.replace("/", "__")
            if not col.name.startswith(safe + "__"):
                continue
        results.append(entry)
    return results


def delete_collection(name: str):
    _client().delete_collection(name)


def upsert_chunks(
    col_name: str,
    texts: list[str],
    embeddings: list[list[float]],
    metadata_list: list[dict],
) -> list[str]:
    client = _client()
    ids = []
    points = []
    for text, emb, meta in zip(texts, embeddings, metadata_list):
        point_id = str(uuid.uuid4())
        ids.append(point_id)
        payload = {**meta, "text": text}
        points.append(PointStruct(id=point_id, vector=emb, payload=payload))
    client.upsert(collection_name=col_name, points=points)
    return ids


def search_similar(
    col_name: str, query: str, top_k: int = 5
) -> list[dict]:
    client = _client()
    query_vec = embed_query(query)
    results = client.query_points(
        collection_name=col_name,
        query=query_vec,
        limit=top_k,
        with_payload=True,
    )
    return [
        {
            "id": str(pt.id),
            "score": pt.score,
            "text": pt.payload.get("text", ""),
            "metadata": {
                k: v for k, v in pt.payload.items() if k != "text"
            },
        }
        for pt in results.points
    ]


def delete_by_document_id(col_name: str, document_id: str):
    client = _client()
    client.delete(
        collection_name=col_name,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="document_id", match=MatchValue(value=document_id)
                )
            ]
        ),
    )


def get_collection_info(name: str) -> dict | None:
    try:
        info = _client().get_collection(name)
        return {
            "name": name,
            "points_count": info.points_count,
            "vectors_count": info.vectors_count,
        }
    except Exception:
        return None
