from functools import lru_cache

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

from app.core.config import settings


@lru_cache()
def get_qdrant_client() -> QdrantClient:
    return QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)


@lru_cache()
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(
        settings.embedding_model, device=settings.embedding_device
    )
