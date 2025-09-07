// WhatsApp Account API Types based on BerryLabs API documentation

export interface AssociatedAgent {
  agent_id: string;
  agent_name: string;
}

export interface WhatsAppAccount {
  account_id: string;
  phone_number?: string;
  status:
    | "pending_qr_scan"
    | "connected"
    | "disconnected"
    | "error"
    | "idle"
    | "unknown";
  created_at: string;
  updated_at: string;
  last_active?: string;
  associated_agent?: AssociatedAgent | null;
}

export interface ExistingAccount {
  account_id: string;
  phone_number: string;
}

export interface ExistingAccounts {
  count: number;
  accounts: ExistingAccount[];
}

export interface QRCodeData {
  qr_code: string;
  account_id: string;
  expires_at: string;
  existing_accounts?: ExistingAccounts;
}

export interface RequestQRResponse {
  success: boolean;
  data: QRCodeData;
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}

export interface GetAccountResponse {
  success: boolean;
  data: WhatsAppAccount;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}

export interface ReconnectData {
  account_id: string;
  status: string;
  phone_number?: string;
  reconnection: {
    type: "qr_scan_required" | "automatic";
    qr_code?: string;
    expires_at?: string;
    completed_at?: string;
  };
}

export interface ReconnectResponse {
  success: boolean;
  data: ReconnectData;
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}

export interface DeleteAccountResponse {
  success: boolean;
  data: {
    account_id: string;
    deleted_at: string;
  };
  message: string;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}

// List Accounts API Types
export interface ListAccountsResponse {
  success: boolean;
  data: WhatsAppAccount[];
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

export interface ReconnectRequest {
  force_reconnect?: boolean;
}

// WebSocket Status Update Types
export interface StatusUpdate {
  type: "status_update";
  account_id?: string;
  status:
    | "connected"
    | "disconnected"
    | "pending_qr_scan"
    | "idle"
    | "error"
    | "unknown";
  message?: string;
  initial_connection?: boolean;
}

// Error response types
export interface APIError {
  code: string;
  message: string;
  details?: string;
}

export interface APIErrorResponse {
  success: false;
  error: APIError;
  meta: {
    timestamp: string;
    request_id: string;
    api_version: string;
  };
}
