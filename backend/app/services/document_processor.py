import uuid
from pathlib import Path

from app.services import embedding_service, qdrant_service
from app.utils.file_utils import parse_file
from app.utils.text_splitter import split_text


def process_document(
    file_path: str,
    filename: str,
    collection: str,
) -> dict:
    document_id = str(uuid.uuid4())
    text = parse_file(file_path)
    chunks = split_text(text)
    if not chunks:
        return {
            "document_id": document_id,
            "filename": filename,
            "chunks_count": 0,
            "collection": collection,
        }

    qdrant_service.ensure_collection(collection)
    embeddings = embedding_service.embed_texts(chunks)
    metadata_list = [
        {
            "document_id": document_id,
            "filename": filename,
            "chunk_index": i,
        }
        for i in range(len(chunks))
    ]
    qdrant_service.upsert_chunks(collection, chunks, embeddings, metadata_list)

    return {
        "document_id": document_id,
        "filename": filename,
        "chunks_count": len(chunks),
        "collection": collection,
    }


def delete_document(document_id: str, collection: str):
    qdrant_service.delete_by_document_id(collection, document_id)
