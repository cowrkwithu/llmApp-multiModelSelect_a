from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Ollama
    ollama_host: str = "localhost"
    ollama_port: int = 11434

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # Backend
    backend_port: int = 8020
    cors_origins: list[str] = ["http://localhost:3020"]

    # Embedding
    embedding_model: str = "intfloat/multilingual-e5-base"
    embedding_device: str = "cpu"

    # Upload
    max_upload_size_mb: int = 50
    upload_dir: str = "./data/uploads"

    # RAG
    rag_top_k: int = 5
    rag_chunk_size: int = 512
    rag_chunk_overlap: int = 50

    @property
    def ollama_base_url(self) -> str:
        return f"http://{self.ollama_host}:{self.ollama_port}/v1"

    @property
    def ollama_api_url(self) -> str:
        return f"http://{self.ollama_host}:{self.ollama_port}"

    @property
    def qdrant_url(self) -> str:
        return f"http://{self.qdrant_host}:{self.qdrant_port}"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
