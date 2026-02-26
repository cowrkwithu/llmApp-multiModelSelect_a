# Local RAG LLM Application

로컬 환경에서 동작하는 **RAG(Retrieval-Augmented Generation) 기반 Q&A 시스템**이다.
사용자가 로컬 LLM 모델을 선택하고, 문서(PDF/DOCX/TXT)를 업로드하여 임베딩한 뒤,
해당 문서 내용에 기반한 질의응답을 수행한다. 모든 처리가 로컬에서 이루어지며 외부 API 호출이 없다.

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js UI    │────▶│  FastAPI Backend  │────▶│ Ollama (native) │
│   :3020         │     │  :8020            │     │  :11434         │
└─────────────────┘     │                  │     │  GPU: RTX 3090  │
                        │  sentence-trans.  │     └─────────────────┘
                        │  (CPU embedding)  │
                        │                  │     ┌─────────────────┐
                        │  LangChain RAG   │────▶│ Qdrant (Docker) │
                        └──────────────────┘     │  :6333          │
                                                 └─────────────────┘
```

| Service | Role | Port |
|---------|------|------|
| **Next.js** | 웹 UI (채팅, 문서관리, 모델선택) | 3020 |
| **FastAPI** | REST API, RAG 파이프라인, 임베딩 | 8020 |
| **Ollama** | LLM 추론 서버 (OpenAI API 호환) | 11434 |
| **Qdrant** | 벡터 데이터베이스 | 6333 |

### Key Design Decisions

| 항목 | 선택 | 이유 |
|------|------|------|
| LLM Engine | Ollama (네이티브 설치) | 즉시 모델 전환, Docker 불필요, 온디맨드 로딩 |
| Embedding | `intfloat/multilingual-e5-base` (CPU) | GPU VRAM 전부 Ollama에 할당, 임베딩은 CPU로 분리 |
| Vector DB | Qdrant (collection: `{model_id}__{label}`) | 모델별 독립 벡터 저장소 |
| Streaming | SSE (Server-Sent Events) | Ollama OpenAI API 호환, 실시간 응답 |

### RAG Pipeline Flow

```
사용자 질의
    ↓
[1] sentence-transformers로 쿼리 임베딩 (CPU)
    ↓
[2] Qdrant에서 top-k 유사 청크 검색
    ↓
[3] 검색된 청크로 컨텍스트 구성
    ↓
[4] LangChain → Ollama /v1/chat/completions (SSE 스트리밍)
    ↓
[5] 스트리밍 응답 + 소스 인용 반환
```

## Supported Models

Ollama에 설치된 모든 모델이 자동으로 사용 가능하다. 현재 설치된 모델:

| Model | Size |
|-------|------|
| exaone3.5:7.8b | ~4.7GB |
| qwen3:14b | ~9.0GB |
| gemma3:27b | ~17GB |

모델 목록은 Ollama API (`/api/tags`)에서 실시간으로 조회하며, 정적 설정 파일이 없다.
UI에서 모델을 선택하면 즉시 전환된다 (Ollama가 온디맨드로 로딩).

새 모델 추가:
```bash
ollama pull <model-name>
```

## Prerequisites

- **OS**: Linux (WSL2 포함)
- **GPU**: NVIDIA GPU (RTX 3090 24GB 사용 중)
- **Ollama**: v0.15+ 설치 및 실행 중 ([설치 가이드](https://ollama.com/download))
- **Docker**: Docker Engine + Docker Compose v2 (Qdrant 컨테이너용)
- **Python**: 3.11+
- **Node.js**: 18+

## Installation

### 1. Clone & Configure

```bash
git clone https://github.com/cowrkwithu/llmApp-multiModelSelect_a.git
cd llmApp-multiModelSelect_a

# 환경변수 설정
cp .env.example .env
# 필요시 .env 파일을 편집하여 포트 등을 변경
```

### 2. Install Ollama & Pull Models

```bash
# Ollama 설치 (이미 설치되어 있으면 스킵)
curl -fsSL https://ollama.com/install.sh | sh

# 모델 다운로드
ollama pull exaone3.5:7.8b
ollama pull qwen3:14b
ollama pull gemma3:27b
```

### 3. Start Docker Services (Qdrant)

```bash
docker compose up -d
```

### 4. Install & Start Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload
```

API 문서: http://localhost:8020/docs (Swagger UI)

### 5. Install & Start Frontend

```bash
cd frontend
npm install
npm run dev
```

UI 접속: http://localhost:3020

### 6. Quick Start / Stop (전체 서비스 일괄 관리)

```bash
# 전체 서비스 시작 (Ollama 확인 + Qdrant + Backend + Frontend)
./scripts/start.sh

# 전체 서비스 정지 (Ollama 제외)
./scripts/stop.sh

# Frontend 없이 시작
./scripts/start.sh --no-frontend

# Docker는 유지하고 Backend/Frontend만 정지
./scripts/stop.sh --keep-docker
```

## Usage

### Quick Start

1. http://localhost:3020 접속
2. **Dashboard**에서 Ollama 상태 확인 (healthy 표시)
3. 모델 선택 (설치된 Ollama 모델 목록에서)
4. **Collections** 페이지에서 새 컬렉션 생성
5. **Documents** 페이지에서 PDF/DOCX/TXT 파일 업로드
6. **Chat** 페이지에서 문서 기반 질의응답

### Model Switching

UI의 모델 선택 드롭다운에서 다른 모델을 선택하면 즉시 전환된다.
Ollama가 온디맨드로 모델을 로드하므로 별도의 재시작이 필요 없다.

### RAG vs Direct Chat

Chat 페이지에서 "Use RAG" 체크박스를 통해 전환:
- **RAG 모드**: 업로드된 문서에서 관련 내용을 검색하여 컨텍스트로 제공 (소스 인용 포함)
- **Direct 모드**: 문서 검색 없이 LLM에 직접 질의

## Health Check

```bash
./scripts/health-check.sh
```

또는 개별 서비스 확인:

```bash
# Ollama
curl http://localhost:11434/

# Qdrant
curl http://localhost:6333/healthz

# Backend
curl http://localhost:8020/health
```

## API Endpoints

### Models `/api/v1/models`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | 설치된 Ollama 모델 목록 (실시간 조회) |
| GET | `/active` | 현재 선택된 모델 + Ollama 상태 |
| POST | `/switch` | 모델 선택 (즉시 전환) |
| GET | `/status` | Ollama 헬스체크 |

### Documents `/api/v1/documents`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload?collection={name}` | 파일 업로드 (multipart, 다중 파일) |
| POST | `/upload-folder?collection={name}` | 폴더 단위 업로드 (multipart, 다중 파일) |
| GET | `/?collection={name}` | 문서 목록 |
| DELETE | `/{document_id}?collection={name}` | 문서 + 벡터 삭제 |

### Chat `/api/v1/chat`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/query` | RAG 질의 (SSE 스트리밍 + 소스 인용) |
| POST | `/query-no-rag` | LLM 직접 질의 (SSE 스트리밍) |

### Collections `/api/v1/collections`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/?model_id={id}` | 컬렉션 목록 (모델별 필터) |
| POST | `/` | 새 컬렉션 생성 |
| DELETE | `/{name}` | 컬렉션 삭제 |

## Project Structure

```
llmApp-multiModelSelect_a/
├── docker-compose.yml              # Qdrant + Backend(profile:full)
├── .env.example                    # 환경변수 템플릿
├── CLAUDE.md                       # 프로젝트 컨텍스트
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                 # FastAPI app (CORS, lifespan, routers)
│       ├── core/
│       │   ├── config.py           # Pydantic Settings
│       │   └── dependencies.py     # Qdrant client, embedding singleton
│       ├── api/
│       │   ├── models.py           # 모델 목록/전환/상태
│       │   ├── documents.py        # 문서 업로드/조회/삭제
│       │   ├── chat.py             # RAG 질의 + SSE 스트리밍
│       │   └── collections.py      # 컬렉션 CRUD
│       ├── schemas/                # Pydantic request/response
│       ├── services/
│       │   ├── ollama_client.py    # Ollama OpenAI API 클라이언트
│       │   ├── embedding_service.py # CPU 임베딩 (sentence-transformers)
│       │   ├── qdrant_service.py   # 벡터 CRUD + 유사도 검색
│       │   ├── document_processor.py # 파싱 → 청킹 → 임베딩 → 저장
│       │   └── rag_pipeline.py     # RAG 체인 + SSE 스트리밍
│       ├── parsers/                # PDF, DOCX, TXT 파서
│       └── utils/                  # text_splitter, file_utils
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx            # 대시보드
│       │   ├── chat/page.tsx       # 채팅 인터페이스
│       │   ├── documents/page.tsx  # 문서 관리
│       │   └── collections/page.tsx # 컬렉션 관리
│       ├── components/             # UI 컴포넌트
│       ├── hooks/                  # React Query 훅
│       └── lib/                    # API 클라이언트, 타입 정의
│
├── data/                           # qdrant_storage/, uploads/ (gitignored)
└── scripts/                        # start.sh, stop.sh, health-check.sh, download-model.sh
```

## Configuration

`.env` 파일에서 설정 가능한 주요 항목:

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_HOST` | localhost | Ollama 서버 호스트 |
| `OLLAMA_PORT` | 11434 | Ollama 서버 포트 |
| `QDRANT_PORT` | 6333 | Qdrant 포트 |
| `BACKEND_PORT` | 8020 | Backend API 포트 |
| `EMBEDDING_MODEL` | intfloat/multilingual-e5-base | 임베딩 모델 |
| `RAG_TOP_K` | 5 | 검색 결과 수 |
| `RAG_CHUNK_SIZE` | 512 | 문서 청크 크기 |
| `RAG_CHUNK_OVERLAP` | 50 | 청크 간 겹침 |

## Docker Compose Commands

```bash
# Qdrant 시작
docker compose up -d

# 전체 서비스 시작 (Qdrant + Backend)
docker compose --profile full up -d

# 로그 확인
docker compose logs -f qdrant

# 서비스 중지
docker compose down

# 데이터 포함 완전 삭제
docker compose down -v
```

## Tech Stack

**Backend**
- FastAPI, Uvicorn, Pydantic Settings
- LangChain, LangChain-OpenAI
- sentence-transformers (`intfloat/multilingual-e5-base`)
- qdrant-client
- PyMuPDF, python-docx
- SSE-Starlette, HTTPX

**Frontend**
- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- TanStack React Query

**Infrastructure**
- Ollama (OpenAI-compatible inference server, native)
- Qdrant (vector database, Docker)
- Docker Compose
