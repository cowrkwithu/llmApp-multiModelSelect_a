# Local RAG LLM Application

## Project Overview
vLLM-based local RAG application with multi-model selection.
Users select local LLM models, upload documents (txt/docx/PDF), and perform Q&A based on document content.

## Architecture
- **Frontend**: Next.js (port 3020) - TypeScript, Tailwind CSS, Tanstack Query
- **Backend**: FastAPI (port 8020) - Python, LangChain, sentence-transformers
- **vLLM**: Docker container (port 8030) - GPU inference with RTX 3090 (24GB VRAM)
- **Qdrant**: Docker container (port 6333) - Vector database

## Key Decisions
- Embedding runs on CPU (`intfloat/multilingual-e5-base`, 768dim) to keep GPU VRAM free for vLLM
- Models: 7B GPTQ/AWQ Int4 quantized (~4-5GB), RTX 3090 24GB allows generous context length
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
- `docs/` - Work memos and documentation

## Work Memo Rules
코드 수정 작업이 완료될 때마다 `docs/` 디렉토리에 작업 메모를 작성하거나 업데이트한다.

- **파일명**: `YYYYMMDD_work-memo.md` (당일 날짜 기준)
- **같은 날짜 파일이 이미 존재하면** 기존 파일에 새 섹션을 추가한다 (덮어쓰지 않음)
- **포함 내용**:
  - 사용자 프롬프트
  - 수정한 파일 목록과 변경 유형 (수정/신규/삭제)
  - 각 변경의 원인과 해결 내용
  - 빌드/테스트 검증 결과 (실행한 경우)
  - 추후 필요한 작업 (있을 경우)
