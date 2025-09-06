import axios from "axios";
import {
  AgentsResponse,
  CreateAgentRequest,
  CreateAgentResponse,
  GetAgentResponse,
} from "@/types/agent";

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
    console.error("API Error:", error.response?.data || error.message);
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
  updateAgent: async (id: string, agentData: any) => {
    const response = await api.put(`/v1/wa/agents/${id}`, agentData);
    return response.data;
  },

  // Delete agent
  deleteAgent: async (id: string) => {
    const response = await api.delete(`/v1/wa/agents/${id}`);
    return response.data;
  },
};

export const accountApi = {
  requestQrCode: async () => {
    const response = await api.post("/v1/wa/request-qr");
    return response.data;
  },

  reconnectAccount: async (id: string) => {
    const response = await api.post(`/v1/wa/reconnect/${id}`);
    return response.data;
  },

  deleteAccount: async (id: string) => {
    const response = await api.delete(`/v1/wa/delete/${id}`);
    return response.data;
  },

  getAccount: async (id: string) => {
    const response = await api.get(`/v1/wa/get/${id}`);
    return response.data;
  },
};
