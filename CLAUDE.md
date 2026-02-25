# Local RAG LLM Application

## Project Overview
vLLM-based local RAG application with multi-model selection.
Users select local LLM models, upload documents (txt/docx/PDF), and perform Q&A based on document content.

## Architecture
- **Frontend**: Next.js (port 3020) - TypeScript, Tailwind CSS, Tanstack Query
- **Backend**: FastAPI (port 8020) - Python, LangChain, sentence-transformers
- **vLLM**: Docker container (port 8030) - GPU inference with RTX 2070 (8GB VRAM)
- **Qdrant**: Docker container (port 6333) - Vector database

## Key Decisions
- Embedding runs on CPU (`intfloat/multilingual-e5-base`, 768dim) to keep GPU VRAM free for vLLM
- Models must be 7B GPTQ/AWQ Int4 quantized (~4-5GB) to fit in 8GB VRAM
- Per-model vector storage: Qdrant collection naming `{model_id}__{collection_label}`
- SSE streaming for chat responses

## Development Commands
```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload

# Frontend
cd frontend && npm install && npm run dev

# Docker (vLLM + Qdrant)
docker compose up -d

# Full stack (including backend container)
docker compose --profile full up -d
```

## Project Structure
- `backend/app/` - FastAPI application
- `frontend/src/` - Next.js application
- `docker/vllm/models.json` - Model registry
- `scripts/` - Utility scripts
