#!/bin/bash

# Local RAG LLM Application - Stop All Services
# Usage: ./scripts/stop.sh [--keep-docker]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

BACKEND_PORT="${BACKEND_PORT:-8020}"

KEEP_DOCKER=false
for arg in "$@"; do
    case "$arg" in
        --keep-docker) KEEP_DOCKER=true ;;
    esac
done

echo "=== Stopping Local RAG LLM Application ==="

# 1. Frontend
echo ""
echo "[1/3] Stopping Frontend..."
if [ -f "$PROJECT_DIR/logs/frontend.pid" ]; then
    PID=$(cat "$PROJECT_DIR/logs/frontend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null
        wait "$PID" 2>/dev/null
        echo "  Frontend stopped (PID: $PID)"
    else
        echo "  Frontend not running"
    fi
    rm -f "$PROJECT_DIR/logs/frontend.pid"
else
    # Fallback: find by port
    PIDS=$(lsof -ti:3020 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "$PIDS" | xargs kill 2>/dev/null
        echo "  Frontend stopped (port 3020)"
    else
        echo "  Frontend not running"
    fi
fi

# 2. Backend
echo ""
echo "[2/3] Stopping Backend..."
if [ -f "$PROJECT_DIR/logs/backend.pid" ]; then
    PID=$(cat "$PROJECT_DIR/logs/backend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null
        wait "$PID" 2>/dev/null
        echo "  Backend stopped (PID: $PID)"
    else
        echo "  Backend not running"
    fi
    rm -f "$PROJECT_DIR/logs/backend.pid"
else
    # Fallback: find by port
    PIDS=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "$PIDS" | xargs kill 2>/dev/null
        echo "  Backend stopped (port $BACKEND_PORT)"
    else
        echo "  Backend not running"
    fi
fi

# 3. Docker services
echo ""
if [ "$KEEP_DOCKER" = false ]; then
    echo "[3/3] Stopping Docker services (vLLM + Qdrant)..."
    cd "$PROJECT_DIR"
    docker compose down
    echo "  Docker services stopped"
else
    echo "[3/3] Docker services: kept running (--keep-docker)"
fi

echo ""
echo "=== All Services Stopped ==="
