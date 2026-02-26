#!/bin/bash

# Local RAG LLM Application - Stop All Services
# Usage: ./scripts/stop.sh [--keep-docker]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

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
        # Kill child processes first (npm spawns next.js as child)
        pkill -P "$PID" 2>/dev/null
        kill "$PID" 2>/dev/null
        sleep 1
        echo "  Frontend stopped (PID: $PID)"
    else
        echo "  Frontend not running"
    fi
    rm -f "$PROJECT_DIR/logs/frontend.pid"
fi
# Also clean up by port (catches orphaned processes)
PIDS=$(lsof -ti:3020 2>/dev/null || true)
if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill 2>/dev/null
    echo "  Cleaned up remaining processes on port 3020"
fi

# 2. Backend
echo ""
echo "[2/3] Stopping Backend..."
if [ -f "$PROJECT_DIR/logs/backend.pid" ]; then
    PID=$(cat "$PROJECT_DIR/logs/backend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null
        sleep 1
        echo "  Backend stopped (PID: $PID)"
    else
        echo "  Backend not running"
    fi
    rm -f "$PROJECT_DIR/logs/backend.pid"
fi
# Also clean up by port
PIDS=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill 2>/dev/null
    echo "  Cleaned up remaining processes on port $BACKEND_PORT"
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
