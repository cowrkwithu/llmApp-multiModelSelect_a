import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.dependencies import get_embedding_model

QUERY_PREFIX = "query: "
PASSAGE_PREFIX = "passage: "


def embed_texts(texts: list[str], is_query: bool = False) -> list[list[float]]:
    model: SentenceTransformer = get_embedding_model()
    prefix = QUERY_PREFIX if is_query else PASSAGE_PREFIX
    prefixed = [prefix + t for t in texts]
    embeddings: np.ndarray = model.encode(prefixed, normalize_embeddings=True)
    return embeddings.tolist()


def embed_query(text: str) -> list[float]:
    return embed_texts([text], is_query=True)[0]


def get_embedding_dimension() -> int:
    model: SentenceTransformer = get_embedding_model()
    return model.get_sentence_embedding_dimension()
