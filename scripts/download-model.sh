#!/bin/bash
set -e

MODEL_ID="${1:-Qwen/Qwen2.5-7B-Instruct-GPTQ-Int4}"
CACHE_DIR="./data/models"

echo "Downloading model: $MODEL_ID"
echo "Cache directory: $CACHE_DIR"

mkdir -p "$CACHE_DIR"

if command -v huggingface-cli &> /dev/null; then
    huggingface-cli download "$MODEL_ID" --cache-dir "$CACHE_DIR"
else
    echo "huggingface-cli not found. Install with: pip install huggingface_hub[cli]"
    echo "Or use Python:"
    echo "  from huggingface_hub import snapshot_download"
    echo "  snapshot_download('$MODEL_ID', cache_dir='$CACHE_DIR')"
    exit 1
fi

echo "Download complete: $MODEL_ID"
