"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Smartphone,
  QrCode,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  Trash2,
  Copy,
  Lock,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Agent } from "@/types/agent";
import { WhatsAppAccount, StatusUpdate } from "@/types/whatsapp-account";
import { whatsappAccountApi } from "@/lib/api";
import QuotaExhaustedModal from "@/components/quota-exhausted-modal";

interface WhatsAppTabProps {
  agent: Agent;
  formData: any;
  onFormDataChange: (field: string, value: any) => void;
  onUpdate: (agent: Agent) => void;
}

export default function WhatsAppTab({
  agent,
  formData,
  onFormDataChange,
  onUpdate,
}: WhatsAppTabProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<WhatsAppAccount | null>(
    null
  );
  const [connectedAccounts, setConnectedAccounts] = useState<WhatsAppAccount[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string>("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] =
    useState<WhatsAppAccount | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaErrorMessage, setQuotaErrorMessage] = useState("");

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const qrExpiryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConnectedAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await whatsappAccountApi.listAccounts();

      if (response.success) {
        // Filter for only connected and disconnected accounts as requested
        const relevantAccounts = response.data.filter(
          (account) =>
            account.status === "connected" || account.status === "disconnected"
        );
        setConnectedAccounts(relevantAccounts);

        // If we have a connected account, set it as the current account status
        const connectedAccount = relevantAccounts.find(
          (account) => account.status === "connected"
        );
        if (connectedAccount) {
          setAccountStatus(connectedAccount);
        }

        setError(null);
      }
    } catch (error: any) {
      console.error("Error fetching connected accounts:", error);
      setError(
        error.response?.data?.error?.message ||
          "Failed to fetch WhatsApp accounts"
      );
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPolling();
      cleanupWebSocket();
      cleanupQRExpiry();
    };
  }, []);

  // Initialize WebSocket connection for real-time status updates
  useEffect(() => {
    if (agent.whatsapp_connection?.account_id) {
      connectWebSocket();
    }
    return () => cleanupWebSocket();
  }, [agent.whatsapp_connection?.account_id]);

  // Fetch connected accounts on mount
  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const cleanupPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const cleanupQRExpiry = () => {
    if (qrExpiryTimeoutRef.current) {
      clearTimeout(qrExpiryTimeoutRef.current);
      qrExpiryTimeoutRef.current = null;
    }
  };

  // Association helper functions
  const isAccountAssociated = (accountId: string) => {
    return formData.whatsapp_connection?.account_id === accountId;
  };

  const getConnectedAccounts = () => {
    return connectedAccounts.filter(
      (account) => account.status === "connected"
    );
  };

  // Helper functions for account association logic
  const getAccountById = (accountId: string) => {
    return connectedAccounts.find((acc) => acc.account_id === accountId);
  };

  const isAccountAssociatedWithOtherAgent = (accountId: string) => {
    const account = getAccountById(accountId);
    return (
      account?.associated_agent &&
      account.associated_agent.agent_id !== agent.id
    );
  };

  const isAccountAvailable = (accountId: string) => {
    const account = getAccountById(accountId);
    return (
      !account?.associated_agent ||
      account.associated_agent.agent_id === agent.id
    );
  };

  const handleAssociationChange = (
    checked: boolean,
    account: WhatsAppAccount
  ) => {
    if (checked) {
      // Check if account is already associated with another agent
      if (isAccountAssociatedWithOtherAgent(account.account_id)) {
        const associatedAgentName =
          account.associated_agent?.agent_name || "another agent";
        toast.error("Association Failed", {
          description: `Account ${
            account.phone_number || account.account_id
          } is already associated with "${associatedAgentName}". Each WhatsApp account can only be connected to one agent at a time.`,
        });
        return;
      }

      // Check if this agent already has an associated account
      if (
        formData.whatsapp_connection?.account_id &&
        formData.whatsapp_connection.account_id !== account.account_id
      ) {
        toast.error("Association Failed", {
          description:
            "This agent already has an associated WhatsApp account. Please disconnect the current account first.",
        });
        return;
      }

      // Associate the account with this agent
      onFormDataChange("whatsapp_connection", {
        account_id: account.account_id,
        phone_number: account.phone_number ?? null,
        status: account.status,
      });
    } else {
      // Disassociate account from agent
      onFormDataChange("whatsapp_connection", {
        account_id: null,
        phone_number: null,
        status: "disconnected",
      });
    }
  };

  const connectWebSocket = () => {
    try {
      // see https://docs.berrylabs.io/docs/api/wa-agent/websockets/status-websocket for more details
      const wsUrl = `wss://api.berrylabs.io/wa/ws/status`;
      const apiKey = process.env.NEXT_PUBLIC_BERRYLABS_API_KEY;

      if (!apiKey) {
        console.error("API key not found for WebSocket connection");
        return;
      }

      wsRef.current = new WebSocket(wsUrl, [apiKey]);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected for status updates");
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: StatusUpdate = JSON.parse(event.data);

          if (data.type === "status_update") {
            setConnectionMessage(data.message || "");

            // Update local status if it's for our account
            if (data.account_id === agent.whatsapp_connection?.account_id) {
              if (data.status === "connected") {
                setIsConnecting(false);
                setIsReconnecting(false);
                cleanupPolling();
                fetchConnectedAccounts(); // Refresh the list of connected accounts
              } else if (data.status === "disconnected") {
                // Handle disconnection
                setIsConnecting(false);
                setIsReconnecting(false);
                cleanupPolling();

                // Refresh connected accounts list
                fetchConnectedAccounts();

                // Update agent with disconnected status if this was the associated account
                if (data.account_id === agent.whatsapp_connection?.account_id) {
                  const updatedAgent = {
                    ...agent,
                    whatsapp_connection: {
                      ...agent.whatsapp_connection!,
                      status: "disconnected",
                    },
                  };
                  onUpdate(updatedAgent);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket connection closed");
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (agent.whatsapp_connection?.account_id) {
            connectWebSocket();
          }
        }, 5000);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  };

  const startPolling = (accountId: string) => {
    cleanupPolling();
    setIsPolling(true);

    const poll = async () => {
      try {
        const response = await whatsappAccountApi.getAccount(accountId);

        if (response.success) {
          setAccountStatus(response.data);

          if (response.data.status === "connected") {
            cleanupPolling();
            setIsConnecting(false);
            setIsReconnecting(false);
            setShowQRModal(false);
            // Refresh accounts list on successful connection
            fetchConnectedAccounts();
          }
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error("Polling error:", error);
        }
      }
    };

    // Poll every 4 seconds
    pollingIntervalRef.current = setInterval(poll, 4000);

    // Stop polling after 3 minutes
    setTimeout(() => {
      cleanupPolling();
    }, 180000);
  };

  const handleRequestQR = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const response = await whatsappAccountApi.requestQrCode();

      if (response.success) {
        setQrCodeData(response.data.qr_code);
        setExpiresAt(response.data.expires_at);

        // Generate QR code image
        const qrImage = await QRCode.toDataURL(response.data.qr_code);
        setQrCodeImage(qrImage);

        setShowQRModal(true);

        // Set up QR expiry timer
        const expiryTime = new Date(response.data.expires_at).getTime();
        const now = new Date().getTime();
        const timeUntilExpiry = expiryTime - now;

        if (timeUntilExpiry > 0) {
          qrExpiryTimeoutRef.current = setTimeout(() => {
            setShowQRModal(false);
            setQrCodeData(null);
            setQrCodeImage(null);
            setIsConnecting(false);
            setError("QR code expired. Please try again.");
          }, timeUntilExpiry);
        }

        // Start polling for connection status
        startPolling(response.data.account_id);
      }
    } catch (error: any) {
      console.error("Error requesting QR code:", error);

      // Check if it's a 429 quota exhausted error
      if (error.response?.status === 429) {
        const errorMsg =
          error.response?.data?.error?.message ||
          "QR code generation quota exhausted. Please upgrade your plan or wait for quota reset.";
        setQuotaErrorMessage(errorMsg);
        setShowQuotaModal(true);
      } else {
        setError(
          error.response?.data?.error?.message || "Failed to generate QR code"
        );
      }
      setIsConnecting(false);
    }
  };

  const handleReconnect = async () => {
    if (!agent.whatsapp_connection?.account_id) return;

    try {
      setIsReconnecting(true);
      setError(null);

      const response = await whatsappAccountApi.reconnectAccount(
        agent.whatsapp_connection.account_id
      );

      if (response.success) {
        if (response.data.reconnection.type === "automatic") {
          // Automatic reconnection successful
          setIsReconnecting(false);
          setAccountStatus(response.data as any);

          const updatedAgent = {
            ...agent,
            whatsapp_connection: {
              account_id: response.data.account_id,
              phone_number: response.data.phone_number ?? null,
              status: response.data.status,
            },
          };
          onUpdate(updatedAgent);
        } else if (response.data.reconnection.type === "qr_scan_required") {
          // QR scanning required
          setQrCodeData(response.data.reconnection.qr_code!);
          setExpiresAt(response.data.reconnection.expires_at!);

          const qrImage = await QRCode.toDataURL(
            response.data.reconnection.qr_code!
          );
          setQrCodeImage(qrImage);

          setShowQRModal(true);
          startPolling(response.data.account_id);
        }
      }
    } catch (error: any) {
      console.error("Error reconnecting account:", error);

      // Check if it's a 429 quota exhausted error
      if (error.response?.status === 429) {
        const errorMsg =
          error.response?.data?.error?.message ||
          "Reconnection quota exhausted. Please upgrade your plan or wait for quota reset.";
        setQuotaErrorMessage(errorMsg);
        setShowQuotaModal(true);
      } else {
        setError(
          error.response?.data?.error?.message || "Failed to reconnect account"
        );
      }
      setIsReconnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!agent.whatsapp_connection?.account_id) return;

    try {
      setIsDeleting(true);
      setError(null);

      const response = await whatsappAccountApi.deleteAccount(
        agent.whatsapp_connection.account_id
      );

      if (response.success) {
        // Update agent to remove WhatsApp connection
        const updatedAgent = {
          ...agent,
          whatsapp_connection: {
            account_id: null,
            phone_number: null,
            status: "disconnected",
          },
        };
        onUpdate(updatedAgent);
        setAccountStatus(null);
      }
    } catch (error: any) {
      console.error("Error disconnecting account:", error);
      setError(
        error.response?.data?.error?.message || "Failed to disconnect account"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefreshStatus = () => {
    fetchConnectedAccounts();
  };

  const handleShowDeleteConfirm = (account: WhatsAppAccount) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      setDeletingAccountId(accountToDelete.account_id);
      setError(null);

      const response = await whatsappAccountApi.deleteAccount(
        accountToDelete.account_id
      );

      if (response.success) {
        // If the deleted account was associated with this agent, clear the association
        if (
          formData.whatsapp_connection?.account_id ===
          accountToDelete.account_id
        ) {
          onFormDataChange("whatsapp_connection", {
            account_id: null,
            phone_number: null,
            status: "disconnected",
          });
        }

        // Refresh the accounts list
        fetchConnectedAccounts();

        toast.success("Account Removed", {
          description:
            "WhatsApp account has been successfully removed from the platform.",
        });
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setError(
        error.response?.data?.error?.message || "Failed to remove account"
      );

      toast.error("Remove Failed", {
        description:
          error.response?.data?.error?.message ||
          "Failed to remove WhatsApp account. Please try again.",
      });
    } finally {
      setDeletingAccountId(null);
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
    }
  };

  const handleCopyAccountId = async () => {
    const accountId =
      formData.whatsapp_connection?.account_id ||
      agent.whatsapp_connection?.account_id;
    if (accountId) {
      await navigator.clipboard.writeText(accountId);
    }
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setQrCodeData(null);
    setQrCodeImage(null);
    setIsConnecting(false);
    setIsReconnecting(false);
    setDeletingAccountId(null);
    setShowDeleteConfirm(false);
    setAccountToDelete(null);
    cleanupPolling();
    cleanupQRExpiry();
  };

  const getConnectionStatus = () => {
    const status = accountStatus?.status || agent.whatsapp_connection?.status;

    switch (status?.toLowerCase()) {
      case "connected":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          badge: (
            <Badge variant="default" className="bg-green-600">
              Connected
            </Badge>
          ),
          title: "WhatsApp Connected",
          description: "Your agent is successfully connected to WhatsApp",
        };
      case "disconnected":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          badge: <Badge variant="secondary">Disconnected</Badge>,
          title: "WhatsApp Disconnected",
          description: "Your agent is not connected to WhatsApp",
        };
      case "pending_qr_scan":
        return {
          icon: QrCode,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          badge: (
            <Badge variant="outline" className="border-blue-600 text-blue-600">
              Pending QR Scan
            </Badge>
          ),
          title: "Waiting for QR Scan",
          description: "QR code is ready for scanning with WhatsApp app",
        };
      case "error":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          badge: <Badge variant="destructive">Error</Badge>,
          title: "Connection Error",
          description: "There was an error with the WhatsApp connection",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          badge: <Badge variant="outline">Unknown</Badge>,
          title: "Connection Status Unknown",
          description: "Unable to determine WhatsApp connection status",
        };
    }
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;
  const isConnected =
    accountStatus?.status === "connected" ||
    agent.whatsapp_connection?.status === "connected";

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Account Association */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp Account Association
          </CardTitle>
          <CardDescription>
            Associate a connected WhatsApp account with this agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900">
                    WhatsApp Account Association Rules
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    • Each WhatsApp account can only be associated with one
                    agent at a time
                    <br />
                    • Each agent can only have one WhatsApp account associated
                    <br />• You must save changes to complete the association
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Status and Actions */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">
                    WhatsApp Account Association
                  </div>
                  <div className="text-sm text-gray-600">
                    Connect a new account or associate an existing one with this
                    agent
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshStatus}
                  disabled={isPolling || loadingAccounts}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isPolling || loadingAccounts ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={handleRequestQR}
                  disabled={isConnecting || isPolling}
                  size="sm"
                  className="cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Connect New Account
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loadingAccounts && (
              <div className="flex items-center justify-center p-8 text-gray-500">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <span>Loading WhatsApp accounts...</span>
              </div>
            )}

            {/* All Accounts List */}
            {!loadingAccounts && connectedAccounts.length > 0 && (
              <div className="space-y-3">
                {connectedAccounts.map((account) => {
                  const isAssociated = isAccountAssociated(account.account_id);
                  const isAssociatedWithOtherAgent =
                    isAccountAssociatedWithOtherAgent(account.account_id);
                  const isAvailable = isAccountAvailable(account.account_id);
                  const isConnected = account.status === "connected";
                  const isDisconnected = account.status === "disconnected";

                  // Determine card styling based on status
                  let cardStyling = "";
                  let statusIcon = null;
                  let statusBadge = null;

                  if (isAssociatedWithOtherAgent) {
                    cardStyling = "bg-gray-50 border-gray-300 opacity-75";
                    statusIcon = <Lock className="h-5 w-5 text-gray-500" />;
                    statusBadge = (
                      <Badge variant="secondary" className="text-gray-600">
                        Associated with {account.associated_agent?.agent_name}
                      </Badge>
                    );
                  } else if (isAssociated) {
                    cardStyling = "bg-blue-50 border-blue-300";
                    statusIcon = <Link className="h-5 w-5 text-blue-600" />;
                    statusBadge = (
                      <Badge variant="default">
                        Associated with this agent
                      </Badge>
                    );
                  } else if (isAvailable) {
                    cardStyling = isConnected
                      ? "bg-green-50 border-green-300 hover:border-green-400"
                      : "bg-white border-gray-200 hover:border-gray-300";
                    statusIcon = isConnected ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-orange-500" />
                    );
                    statusBadge = null;
                  }

                  return (
                    <div
                      key={account.account_id}
                      className={`p-4 border-2 rounded-lg transition-all ${cardStyling}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {statusIcon}
                          <div>
                            <div className="font-medium">
                              {account.phone_number || account.account_id}
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>Account ID: {account.account_id}</div>
                              <div className="flex items-center gap-4 mt-1">
                                <span
                                  className={`inline-flex items-center gap-1 ${
                                    isConnected
                                      ? "text-green-600"
                                      : "text-orange-500"
                                  }`}
                                >
                                  Status: {account.status}
                                </span>
                                {account.last_active && (
                                  <span>
                                    Last active:{" "}
                                    {new Date(
                                      account.last_active
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {statusBadge}
                          {isDisconnected && isAssociated && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleReconnect}
                              disabled={isReconnecting}
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                              {isReconnecting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Reconnecting...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reconnect
                                </>
                              )}
                            </Button>
                          )}
                          <Switch
                            checked={isAssociated}
                            disabled={!!isAssociatedWithOtherAgent}
                            onCheckedChange={(checked) =>
                              handleAssociationChange(checked, account)
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowDeleteConfirm(account)}
                            disabled={deletingAccountId === account.account_id}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {deletingAccountId === account.account_id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {isAssociated && (
                        <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded">
                          <div className="flex items-center gap-2 text-blue-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Click "Save Changes" to complete the association
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!loadingAccounts && connectedAccounts.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <Smartphone className="h-12 w-12 mb-3 text-gray-400" />
                <div className="text-center">
                  <div className="font-medium">No WhatsApp Accounts Found</div>
                  <div className="text-sm mt-1">
                    Connect a new WhatsApp account using the "Connect New
                    Account" button above
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Connection Details
          </CardTitle>
          <CardDescription>
            WhatsApp account and phone number information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Account ID
              </label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center justify-between">
                <span className="font-mono text-sm">
                  {formData.whatsapp_connection?.account_id ||
                    agent.whatsapp_connection?.account_id ||
                    "Not connected"}
                </span>
                {(formData.whatsapp_connection?.account_id ||
                  agent.whatsapp_connection?.account_id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAccountId}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {formData.whatsapp_connection?.phone_number ||
                  agent.whatsapp_connection?.phone_number ||
                  "Not connected"}
              </div>
            </div>
          </div>

          {accountStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Last Active
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  {accountStatus.last_active
                    ? new Date(accountStatus.last_active).toLocaleString()
                    : "Never"}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Connected Since
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  {accountStatus.created_at
                    ? new Date(accountStatus.created_at).toLocaleString()
                    : "Unknown"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={handleCloseQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </DialogTitle>
            <DialogDescription>
              Scan this QR code with your WhatsApp Business app to connect your
              account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {qrCodeImage && (
              <div className="flex justify-center">
                <div className="p-4 bg-white border rounded-lg">
                  <img
                    src={qrCodeImage}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64"
                  />
                </div>
              </div>
            )}

            {expiresAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Expires at: {new Date(expiresAt).toLocaleTimeString()}
                </span>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                1. Open WhatsApp Business on your phone
                <br />
                2. Go to Settings → Linked Devices
                <br />
                3. Tap "Link a Device" and scan this code
              </p>
            </div>

            {isPolling && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Waiting for QR code scan...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Remove WhatsApp Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this WhatsApp account? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {accountToDelete && (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <div className="font-medium">
                  {accountToDelete.phone_number || accountToDelete.account_id}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Account ID: {accountToDelete.account_id}
                </div>
                {accountToDelete.associated_agent && (
                  <div className="text-sm text-orange-600 mt-1">
                    ⚠️ This account is currently associated with "
                    {accountToDelete.associated_agent.agent_name}"
                  </div>
                )}
              </div>
            )}

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> Removing this account will:
                <br />
                • Permanently disconnect it from the platform
                <br />
                • Remove all associated data and configurations
                <br />• Clear any agent associations
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={!!deletingAccountId}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={!!deletingAccountId}
              >
                {deletingAccountId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quota Exhausted Modal */}
      <QuotaExhaustedModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        errorMessage={quotaErrorMessage}
      />
    </div>
  );
}
