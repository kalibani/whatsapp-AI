export interface ClientFile {
  id: string;
  file_id?: string; // Optional because list files API doesn't return this field
  file_reference: string;
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  real_name: string;
  usage_context: string;
  status?: string; // Optional because list files API doesn't return this field
  created_at: string;
  updated_at: string;
}

export interface AgentFile {
  id: string;
  file_id: string;
  file_reference: string;
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  real_name: string;
  usage_context: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// API Request/Response Types
export interface ListFilesResponse {
  success: boolean;
  data: ClientFile[];
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

export interface UploadFileRequest {
  file: File;
  name: string;
  description?: string;
  usage_context?: string;
}

export interface UploadFileResponse {
  success: boolean;
  data: ClientFile;
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}

export interface AssociateFileRequest {
  file_id: string;
}

export interface AssociateFileResponse {
  success: boolean;
  data: {
    agent_id: string;
    file_id: string;
    file_reference: string;
    association_status: string;
    created: boolean;
  };
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}

export interface RemoveFileAssociationResponse {
  success: boolean;
  data: {
    agent_id: string;
    file_id: string;
    file_reference: string;
    removed: boolean;
    associations_removed: number;
  };
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}

export interface DeleteFileResponse {
  success: boolean;
  data: {
    file_id: string;
    file_reference: string;
    deleted: boolean;
  };
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}
