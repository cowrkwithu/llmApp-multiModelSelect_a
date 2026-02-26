#!/bin/bash
set -e

MODEL_NAME="${1:-exaone3.5:7.8b}"

echo "Pulling model via Ollama: $MODEL_NAME"

if command -v ollama &> /dev/null; then
    ollama pull "$MODEL_NAME"
else
    echo "ollama not found. Install from: https://ollama.com/download"
    exit 1
fi

echo "Pull complete: $MODEL_NAME"
