#!/bin/bash

# Local RAG LLM Application - Start All Services
# Usage: ./scripts/start.sh [--no-frontend]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

BACKEND_PORT="${BACKEND_PORT:-8020}"
VLLM_PORT="${VLLM_PORT:-8030}"
QDRANT_PORT="${QDRANT_PORT:-6333}"

NO_FRONTEND=false
for arg in "$@"; do
    case "$arg" in
        --no-frontend) NO_FRONTEND=true ;;
    esac
done

echo "=== Starting Local RAG LLM Application ==="

mkdir -p "$PROJECT_DIR/logs"

# 1. Docker services (vLLM + Qdrant)
echo ""
echo "[1/3] Starting Docker services (vLLM + Qdrant)..."
cd "$PROJECT_DIR"
docker compose up -d

echo "  Waiting for Qdrant..."
for i in $(seq 1 30); do
    if curl -sf "http://localhost:$QDRANT_PORT/healthz" > /dev/null 2>&1; then
        echo "  Qdrant: OK"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "  Qdrant: TIMEOUT (check: docker compose logs qdrant)"
        exit 1
    fi
    sleep 2
done

echo "  Waiting for vLLM (model loading may take a few minutes)..."
for i in $(seq 1 120); do
    if curl -sf "http://localhost:$VLLM_PORT/health" > /dev/null 2>&1; then
        MODEL=$(curl -sf "http://localhost:$VLLM_PORT/v1/models" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])" 2>/dev/null || echo "unknown")
        echo "  vLLM: OK (model: $MODEL)"
        break
    fi
    if [ "$i" -eq 120 ]; then
        echo "  vLLM: TIMEOUT (check: docker compose logs vllm)"
        exit 1
    fi
    printf "."
    sleep 5
done

# 2. Backend (FastAPI)
echo ""
echo "[2/3] Starting Backend (FastAPI :$BACKEND_PORT)..."
cd "$PROJECT_DIR/backend"

if [ ! -d ".venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -q -r requirements.txt
else
    source .venv/bin/activate
fi

if lsof -ti:$BACKEND_PORT > /dev/null 2>&1; then
    echo "  Backend already running on port $BACKEND_PORT"
else
    nohup uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" > "$PROJECT_DIR/logs/backend.log" 2>&1 &
    echo $! > "$PROJECT_DIR/logs/backend.pid"
    sleep 2
    if curl -sf "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        echo "  Backend: OK (PID: $(cat "$PROJECT_DIR/logs/backend.pid"))"
    else
        echo "  Backend: starting... (log: logs/backend.log)"
    fi
fi

# 3. Frontend (Next.js)
if [ "$NO_FRONTEND" = false ]; then
    echo ""
    echo "[3/3] Starting Frontend (Next.js :3020)..."
    cd "$PROJECT_DIR/frontend"

    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        npm install --silent
    fi

    if lsof -ti:3020 > /dev/null 2>&1; then
        echo "  Frontend already running on port 3020"
    else
        nohup npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
        echo $! > "$PROJECT_DIR/logs/frontend.pid"
        sleep 3
        echo "  Frontend: started (PID: $(cat "$PROJECT_DIR/logs/frontend.pid"))"
    fi
else
    echo ""
    echo "[3/3] Frontend: skipped (--no-frontend)"
fi

# Summary
echo ""
echo "=== All Services Started ==="
echo "  vLLM:     http://localhost:$VLLM_PORT"
echo "  Qdrant:   http://localhost:$QDRANT_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT  (Swagger: http://localhost:$BACKEND_PORT/docs)"
if [ "$NO_FRONTEND" = false ]; then
    echo "  Frontend: http://localhost:3020"
fi
echo ""
echo "  Health check:  ./scripts/health-check.sh"
echo "  Stop all:      ./scripts/stop.sh"
echo "============================="
