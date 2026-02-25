# Local RAG LLM Application

로컬 환경에서 동작하는 **RAG(Retrieval-Augmented Generation) 기반 Q&A 시스템**이다.
사용자가 로컬 LLM 모델을 선택하고, 문서(PDF/DOCX/TXT)를 업로드하여 임베딩한 뒤,
해당 문서 내용에 기반한 질의응답을 수행한다. 모든 처리가 로컬에서 이루어지며 외부 API 호출이 없다.

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js UI    │────▶│  FastAPI Backend  │────▶│  vLLM (Docker)  │
│   :3020         │     │  :8020            │     │  :8030          │
└─────────────────┘     │                  │     │  GPU: RTX 2070  │
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
| **vLLM** | LLM 추론 서버 (OpenAI API 호환) | 8030 |
| **Qdrant** | 벡터 데이터베이스 | 6333 |

### Key Design Decisions

| 항목 | 선택 | 이유 |
|------|------|------|
| Embedding | `intfloat/multilingual-e5-base` (CPU) | 8GB VRAM 전부 vLLM에 할당, 임베딩은 CPU로 분리 |
| Vector DB | Qdrant (collection: `{model_id}__{label}`) | 모델별 독립 벡터 저장소 |
| LLM 모델 | 7B GPTQ/AWQ Int4 양자화 (~4-5GB) | 8GB VRAM 제약 내 동작 |
| Streaming | SSE (Server-Sent Events) | vLLM OpenAI API 호환, 실시간 응답 |

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
[4] LangChain → vLLM /v1/chat/completions (SSE 스트리밍)
    ↓
[5] 스트리밍 응답 + 소스 인용 반환
```

## Supported Models

| Model | Quantization | Size | Languages |
|-------|-------------|------|-----------|
| Qwen/Qwen2.5-7B-Instruct-GPTQ-Int4 | GPTQ 4bit | ~4.5GB | en, zh, ko, ja |
| TheBloke/Mistral-7B-Instruct-v0.3-GPTQ | GPTQ 4bit | ~4.2GB | en, fr, de, es |
| hugging-quants/Meta-Llama-3.1-8B-Instruct-AWQ-INT4 | AWQ 4bit | ~4.8GB | en, de, fr, it, pt, hi, es, th |

모델 목록은 `docker/vllm/models.json`에서 관리하며, UI에서 실시간 전환이 가능하다.

## Prerequisites

- **OS**: Linux (WSL2 포함)
- **GPU**: NVIDIA GPU (8GB+ VRAM 권장, CUDA 12.x 지원 드라이버)
  - 현재 vLLM 이미지(`v0.6.6.post1`)는 CUDA 12.4 기반. Driver 545+ 필요
  - `latest` 이미지는 CUDA 12.9 요구하므로 최신 드라이버 필요
- **Docker**: Docker Engine + Docker Compose v2 + [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
- **Python**: 3.11+
- **Node.js**: 18+

## Installation

### 1. Clone & Configure

```bash
git clone https://github.com/cowrkwithu/llmApp-multiModelSelect_a.git
cd llmApp-multiModelSelect_a

# 환경변수 설정
cp .env.example .env
# 필요시 .env 파일을 편집하여 포트, 모델 등을 변경
```

### 2. Download Model (Optional - vLLM이 자동 다운로드하지만 사전 다운로드 가능)

```bash
# HuggingFace CLI 필요: pip install huggingface_hub[cli]
./scripts/download-model.sh Qwen/Qwen2.5-7B-Instruct-GPTQ-Int4
```

### 3. Start Docker Services (vLLM + Qdrant)

```bash
docker compose up -d
```

vLLM은 첫 기동 시 모델을 다운로드하므로 시간이 걸릴 수 있다.
로그로 진행 상황을 확인한다:

```bash
docker compose logs -f vllm
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

## Usage

### Quick Start

1. http://localhost:3020 접속
2. **Dashboard**에서 vLLM 상태 확인 (healthy 표시)
3. 모델 선택 (기본: Qwen2.5-7B)
4. **Collections** 페이지에서 새 컬렉션 생성
5. **Documents** 페이지에서 PDF/DOCX/TXT 파일 업로드
6. **Chat** 페이지에서 문서 기반 질의응답

### Model Switching

UI의 모델 선택 드롭다운에서 다른 모델을 선택하면 vLLM 컨테이너가 재시작되며 새 모델이 로드된다.
모델 전환에는 수 분이 소요될 수 있다.

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
# vLLM
curl http://localhost:8030/health

# Qdrant
curl http://localhost:6333/healthz

# Backend
curl http://localhost:8020/health
```

## API Endpoints

### Models `/api/v1/models`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | 등록된 모델 목록 |
| GET | `/active` | 현재 활성 모델 + vLLM 상태 |
| POST | `/switch` | 모델 전환 (vLLM 재시작) |
| GET | `/status` | vLLM 헬스체크 |

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
├── docker-compose.yml              # vLLM + Qdrant + Backend(profile:full)
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
│       │   ├── vllm_client.py      # vLLM OpenAI API 클라이언트
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
├── docker/vllm/models.json        # 모델 레지스트리
├── data/                           # models/, qdrant_storage/ (gitignored)
└── scripts/                        # download-model.sh, health-check.sh
```

## Configuration

`.env` 파일에서 설정 가능한 주요 항목:

| Variable | Default | Description |
|----------|---------|-------------|
| `VLLM_PORT` | 8030 | vLLM 서버 포트 |
| `QDRANT_PORT` | 6333 | Qdrant 포트 |
| `BACKEND_PORT` | 8020 | Backend API 포트 |
| `DEFAULT_MODEL_ID` | Qwen/Qwen2.5-7B-Instruct-GPTQ-Int4 | 기본 로드 모델 |
| `VLLM_GPU_MEMORY_UTILIZATION` | 0.92 | GPU 메모리 사용률 (RTX 2070 8GB 기준) |
| `VLLM_MAX_MODEL_LEN` | 2048 | 최대 컨텍스트 길이 (VRAM 제약으로 축소) |
| `EMBEDDING_MODEL` | intfloat/multilingual-e5-base | 임베딩 모델 |
| `RAG_TOP_K` | 5 | 검색 결과 수 |
| `RAG_CHUNK_SIZE` | 512 | 문서 청크 크기 |
| `RAG_CHUNK_OVERLAP` | 50 | 청크 간 겹침 |
| `HF_TOKEN` | (empty) | HuggingFace 토큰 (gated 모델용) |

## Docker Compose Commands

> **Note**: vLLM 이미지는 `vllm/vllm-openai:v0.6.6.post1` (CUDA 12.4 기반)을 사용한다.
> `latest` 이미지는 CUDA 12.9를 요구하므로, CUDA 12.3 이하 환경에서는 반드시 고정 버전을 사용해야 한다.

```bash
# 기본 서비스 시작 (vLLM + Qdrant)
docker compose up -d

# 전체 서비스 시작 (vLLM + Qdrant + Backend)
docker compose --profile full up -d

# 로그 확인
docker compose logs -f vllm
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
- vLLM (OpenAI-compatible inference server)
- Qdrant (vector database)
- Docker Compose, NVIDIA Container Toolkit
