export interface KnowledgeBaseDocument {
  id: string;
  title: string;
  description?: string;
  category?: string;
  document_type: string;
  filename?: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
  updated_at?: string;
  file_size?: number;
}

export interface KnowledgeBaseDocumentsResponse {
  success: boolean;
  data: KnowledgeBaseDocument[];
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface UploadDocumentResponse {
  success: boolean;
  data: {
    document_id: string;
    status: "processing" | "completed" | "failed";
    filename: string;
    title: string;
    description?: string;
    category?: string;
  };
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}

export interface DeleteDocumentResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    deleted_at: string;
  };
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}

export interface UploadDocumentRequest {
  id: string;
  file: File;
  title: string;
  description?: string;
  category?: string;
  agent_id?: string;
}

export interface UploadTextRequest {
  id: string;
  title: string;
  content: string;
  description?: string;
  category?: string;
  agent_id?: string;
}

export interface UploadTextResponse {
  success: boolean;
  data: {
    document_id: string;
    status: "processing" | "completed" | "failed";
    title: string;
    description?: string;
    category?: string;
  };
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}
