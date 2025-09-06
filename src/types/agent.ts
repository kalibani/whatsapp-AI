export interface WhatsAppConnection {
  account_id: string | null;
  phone_number: string | null;
  status: string | null;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  type?: string;
}

export interface AgentFile {
  id: string;
  file_reference: string;
  name: string;
  description: string;
  file_type: string;
  usage_context: string;
  file_size: number;
}

export interface ToolApiSchema {
  url: string;
  method: string;
  path_params_schema: Record<string, any>;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  api_schema: ToolApiSchema;
  created_at: string;
  updated_at: string;
  is_global: boolean;
}

export interface AvailabilityScheduleDays {
  monday: {
    active: boolean;
    open_time: string;
    close_time: string;
  };
  tuesday: {
    active: boolean;
    open_time: string;
    close_time: string;
  };
  // Add other days as needed
}

export interface AvailabilitySchedule {
  days: AvailabilityScheduleDays;
  timezone: string;
  always_active: boolean;
}

export interface AdvancedSettings {
  data_collection_fields: any[];
  disable_ai_after_manual_response: boolean;
  manual_takeover_auto_reset_minutes: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  system_prompt: string;
  language: string;
  availability_schedule: AvailabilitySchedule;
  follow_up_messages: any[];
  advanced_settings: AdvancedSettings;
  whatsapp_connection: WhatsAppConnection;
  knowledge_base: KnowledgeBase[];
  files: AgentFile[];
  tools: AgentTool[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiMeta {
  timestamp: string;
  request_id: string;
  api_version: string;
}

export interface AgentsResponse {
  success: boolean;
  data: Agent[];
  message: string;
  meta: ApiMeta;
  pagination: Pagination;
}

export interface CreateAgentRequest {
  name: string;
  language: string;
  system_prompt: string;
  availability_schedule: AvailabilitySchedule;
  advanced_settings: AdvancedSettings;
}

export interface CreateAgentResponse {
  success: boolean;
  data: Agent;
  message: string;
  meta: ApiMeta;
}

export interface GetAgentResponse {
  success: boolean;
  data: Agent;
  message: string;
  meta: ApiMeta;
}

export interface UpdateAgentRequest {
  name?: string;
  language?: string;
  system_prompt?: string;
  description?: string;
  availability_schedule?: AvailabilitySchedule;
  advanced_settings?: AdvancedSettings;
  knowledge_base?: KnowledgeBase[];
}

export interface UpdateAgentResponse {
  success: boolean;
  data: Agent;
  message: string;
  meta: ApiMeta;
}
