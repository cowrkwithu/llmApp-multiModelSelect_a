import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from app.core.config import settings
from app.schemas.documents import DocumentUploadResponse, UploadResult
from app.services import document_processor, qdrant_service
from app.utils.file_utils import is_supported

router = APIRouter()


@router.post("/upload", response_model=UploadResult)
async def upload_documents(
    files: list[UploadFile],
    collection: str,
):
    results = []
    errors = []

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    for file in files:
        if not file.filename or not is_supported(file.filename):
            errors.append({
                "filename": file.filename or "unknown",
                "error": "Unsupported file type",
            })
            continue

        file_path = upload_dir / file.filename
        try:
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)

            result = document_processor.process_document(
                file_path=str(file_path),
                filename=file.filename,
                collection=collection,
            )
            results.append(DocumentUploadResponse(**result))
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
        finally:
            if file_path.exists():
                file_path.unlink()

    return UploadResult(results=results, errors=errors)


@router.get("/")
async def list_documents(collection: str):
    try:
        info = qdrant_service.get_collection_info(collection)
        if info is None:
            raise HTTPException(status_code=404, detail="Collection not found")

        client = qdrant_service._client()
        points, _ = client.scroll(
            collection_name=collection,
            limit=1000,
            with_payload=True,
            with_vectors=False,
        )

        docs: dict[str, dict] = {}
        for pt in points:
            doc_id = pt.payload.get("document_id", "")
            if doc_id not in docs:
                docs[doc_id] = {
                    "document_id": doc_id,
                    "filename": pt.payload.get("filename", "unknown"),
                    "chunks_count": 0,
                }
            docs[doc_id]["chunks_count"] += 1

        return {"documents": list(docs.values()), "collection": collection}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document(document_id: str, collection: str):
    try:
        document_processor.delete_document(document_id, collection)
        return {"message": "Document deleted", "document_id": document_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
