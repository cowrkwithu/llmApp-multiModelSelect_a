#!/bin/bash

VLLM_PORT="${VLLM_PORT:-8030}"
QDRANT_PORT="${QDRANT_PORT:-6333}"
BACKEND_PORT="${BACKEND_PORT:-8020}"

echo "=== Health Check ==="

# vLLM
printf "vLLM (:%s): " "$VLLM_PORT"
if curl -sf "http://localhost:$VLLM_PORT/health" > /dev/null 2>&1; then
    MODEL=$(curl -sf "http://localhost:$VLLM_PORT/v1/models" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])" 2>/dev/null || echo "unknown")
    echo "OK (model: $MODEL)"
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
