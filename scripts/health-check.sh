#!/bin/bash

OLLAMA_PORT="${OLLAMA_PORT:-11434}"
QDRANT_PORT="${QDRANT_PORT:-6333}"
BACKEND_PORT="${BACKEND_PORT:-8020}"

echo "=== Health Check ==="

# Ollama
printf "Ollama (:%s): " "$OLLAMA_PORT"
if curl -sf "http://localhost:$OLLAMA_PORT/" > /dev/null 2>&1; then
    MODELS=$(curl -sf "http://localhost:$OLLAMA_PORT/api/tags" | python3 -c "import sys,json; d=json.load(sys.stdin); print(', '.join(m['name'] for m in d.get('models',[])))" 2>/dev/null || echo "unknown")
    echo "OK (models: $MODELS)"
else
    echo "UNREACHABLE"
fi

# Qdrant
printf "Qdrant (:%s): " "$QDRANT_PORT"
if curl -sf "http://localhost:$QDRANT_PORT/healthz" > /dev/null 2>&1; then
    echo "OK"
else
    echo "UNREACHABLE"
fi

# Backend
printf "Backend (:%s): " "$BACKEND_PORT"
if curl -sf "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
    echo "OK"
else
    echo "UNREACHABLE"
fi

echo "==================="
