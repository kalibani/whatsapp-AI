import axios from "axios";
import {
  AgentsResponse,
  CreateAgentRequest,
  CreateAgentResponse,
  GetAgentResponse,
  UpdateAgentRequest,
  UpdateAgentResponse,
} from "@/types/agent";
import {
  KnowledgeBaseDocumentsResponse,
  UploadDocumentResponse,
  UploadDocumentRequest,
  UploadTextRequest,
  UploadTextResponse,
  DeleteDocumentResponse,
} from "@/types/knowledge-base";
import {
  RequestQRResponse,
  GetAccountResponse,
  ReconnectResponse,
  ReconnectRequest,
  DeleteAccountResponse,
  ListAccountsResponse,
} from "@/types/whatsapp-account";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BERRYLABS_API_URL,
  headers: {
    "Content-Type": "application/json",
    "xi-api-key": process.env.NEXT_PUBLIC_BERRYLABS_API_KEY,
  },
});

// Add request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log("API Request:", config.method?.toUpperCase(), config.url);
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// Agent API endpoints
export const agentApi = {
  // Get paginated list of agents
  getAgents: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<AgentsResponse> => {
    const response = await api.get("/v1/wa/agents", { params });
    return response.data;
  },

  // Get single agent by ID
  getAgent: async (id: string): Promise<GetAgentResponse> => {
    const response = await api.get(`/v1/wa/agents/${id}`);
    return response.data;
  },

  // Create new agent
  createAgent: async (
    agentData: CreateAgentRequest
  ): Promise<CreateAgentResponse> => {
    const response = await api.post("/v1/wa/agents", agentData);
    return response.data;
  },

  // Update agent
  updateAgent: async (
    id: string,
    agentData: UpdateAgentRequest
  ): Promise<UpdateAgentResponse> => {
    const response = await api.patch(`/v1/wa/agents/${id}`, agentData);
    return response.data;
  },

  // Delete agent
  deleteAgent: async (id: string) => {
    const response = await api.delete(`/v1/wa/agents/${id}`);
    return response.data;
  },
};

// Knowledge Base API endpoints
export const knowledgeBaseApi = {
  // Get list of knowledge base documents
  getDocuments: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    document_type?: string;
  }): Promise<KnowledgeBaseDocumentsResponse> => {
    const response = await api.get("/v1/wa/knowledge/documents", { params });
    return response.data;
  },

  // Upload document to knowledge base
  uploadDocument: async (
    data: UploadDocumentRequest
  ): Promise<UploadDocumentResponse> => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("title", data.title);

    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.category) {
      formData.append("category", data.category);
    }
    if (data.agent_id) {
      formData.append("agent_id", data.agent_id);
    }

    const response = await api.post("/v1/wa/knowledge/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Upload text content to knowledge base
  uploadText: async (data: UploadTextRequest): Promise<UploadTextResponse> => {
    const params = data.agent_id ? { agent_id: data.agent_id } : {};
    const response = await api.post(
      "/v1/wa/knowledge/upload/text",
      {
        title: data.title,
        content: data.content,
        description: data.description,
        category: data.category,
      },
      { params }
    );
    return response.data;
  },

  // Delete document from knowledge base
  deleteDocument: async (
    documentId: string
  ): Promise<DeleteDocumentResponse> => {
    const response = await api.delete(
      `/v1/wa/knowledge/documents/${documentId}`
    );
    return response.data;
  },
};

// WhatsApp Account API endpoints
export const whatsappAccountApi = {
  // List all WhatsApp accounts
  listAccounts: async (): Promise<ListAccountsResponse> => {
    const response = await api.get("/v1/wa/accounts");
    return response.data;
  },

  // Request QR Code for new WhatsApp connection
  requestQrCode: async (): Promise<RequestQRResponse> => {
    const response = await api.post("/v1/wa/request-qr");
    return response.data;
  },

  // Get account status by account ID
  getAccount: async (accountId: string): Promise<GetAccountResponse> => {
    const response = await api.get(`/v1/wa/accounts/${accountId}`);
    return response.data;
  },

  // Reconnect a previously connected WhatsApp account
  reconnectAccount: async (
    accountId: string,
    data?: ReconnectRequest
  ): Promise<ReconnectResponse> => {
    const response = await api.post(
      `/v1/wa/reconnect/${accountId}`,
      data || {}
    );
    return response.data;
  },

  // Delete (unlink) a WhatsApp account
  deleteAccount: async (accountId: string): Promise<DeleteAccountResponse> => {
    const response = await api.delete(`/v1/wa/account/${accountId}`);
    return response.data;
  },
};
