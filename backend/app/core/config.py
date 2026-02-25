import json
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # vLLM
    vllm_host: str = "localhost"
    vllm_port: int = 8030
    vllm_gpu_memory_utilization: float = 0.85
    vllm_max_model_len: int = 4096

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # Backend
    backend_port: int = 8020
    cors_origins: list[str] = ["http://localhost:3020"]

    # Embedding
    embedding_model: str = "intfloat/multilingual-e5-base"
    embedding_device: str = "cpu"

    # Default model
    default_model_id: str = "Qwen/Qwen2.5-7B-Instruct-GPTQ-Int4"

    # Upload
    max_upload_size_mb: int = 50
    upload_dir: str = "./data/uploads"

    # RAG
    rag_top_k: int = 5
    rag_chunk_size: int = 512
    rag_chunk_overlap: int = 50

    # Model registry
    models_json_path: str = str(
        Path(__file__).resolve().parents[3] / "docker" / "vllm" / "models.json"
    )

    @property
    def vllm_base_url(self) -> str:
        return f"http://{self.vllm_host}:{self.vllm_port}/v1"

    @property
    def qdrant_url(self) -> str:
        return f"http://{self.qdrant_host}:{self.qdrant_port}"

    def load_model_registry(self) -> list[dict]:
        path = Path(self.models_json_path)
        if path.exists():
            with open(path) as f:
                return json.load(f)["models"]
        return []

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
