export interface ModelInfo {
  id: string;
  name: string;
  parameter_size: string;
  family: string;
  quantization: string;
  size_gb: number;
}

export interface ActiveModel {
  model_id: string | null;
  status: string;
  error?: string | null;
}

export interface CollectionInfo {
  name: string;
  points_count: number;
}

export interface DocumentInfo {
  document_id: string;
  filename: string;
  chunks_count: number;
}

export interface UploadResult {
  results: {
    document_id: string;
    filename: string;
    chunks_count: number;
    collection: string;
  }[];
  errors: { filename: string; error: string }[];
}

export interface Source {
  index: number;
  filename: string;
  score: number;
  chunk_index: number;
}

export interface ChatSSEEvent {
  type: "sources" | "token" | "done" | "error";
  content?: string;
  sources?: Source[];
}
