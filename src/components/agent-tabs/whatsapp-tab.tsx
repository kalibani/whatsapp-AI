"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Smartphone,
  QrCode,
  Phone,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  Trash2,
  Copy,
  ExternalLink,
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
import { Agent } from "@/types/agent";
import { WhatsAppAccount, StatusUpdate } from "@/types/whatsapp-account";
import { whatsappAccountApi } from "@/lib/api";

interface WhatsAppTabProps {
  agent: Agent;
  onUpdate: (agent: Agent) => void;
}

export default function WhatsAppTab({ agent, onUpdate }: WhatsAppTabProps) {
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
  const [error, setError] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string>("");

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const qrExpiryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const connectWebSocket = () => {
    try {
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
              console.log(`Account ${data.account_id} status: ${data.status}`);

              if (data.status === "connected") {
                setIsConnecting(false);
                setIsReconnecting(false);
                cleanupPolling();
                fetchAccountStatus();
              } else if (data.status === "disconnected") {
                // Handle disconnection
                setIsConnecting(false);
                setIsReconnecting(false);
                cleanupPolling();

                // Update local account status
                setAccountStatus((prev) =>
                  prev ? { ...prev, status: "disconnected" } : null
                );

                // Update agent with disconnected status
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

  const fetchAccountStatus = async () => {
    if (!agent.whatsapp_connection?.account_id) return;

    try {
      const response = await whatsappAccountApi.getAccount(
        agent.whatsapp_connection.account_id
      );

      if (response.success) {
        setAccountStatus(response.data);
        setError(null);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Expected when QR not scanned yet
        setAccountStatus(null);
      } else {
        console.error("Error fetching account status:", error);
        setError(
          error.response?.data?.error?.message ||
            "Failed to fetch account status"
        );
      }
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

            // Update agent with connected account info
            const updatedAgent = {
              ...agent,
              whatsapp_connection: {
                account_id: response.data.account_id,
                phone_number: response.data.phone_number ?? null,
                status: response.data.status,
              },
            };
            onUpdate(updatedAgent);
          }
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error("Polling error:", error);
        }
      }
    };

    // Poll every 3 seconds
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
      setError(
        error.response?.data?.error?.message || "Failed to generate QR code"
      );
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
      setError(
        error.response?.data?.error?.message || "Failed to reconnect account"
      );
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
    fetchAccountStatus();
  };

  const handleCopyAccountId = async () => {
    if (agent.whatsapp_connection?.account_id) {
      await navigator.clipboard.writeText(agent.whatsapp_connection.account_id);
    }
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setQrCodeData(null);
    setQrCodeImage(null);
    setIsConnecting(false);
    setIsReconnecting(false);
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

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                WhatsApp Connection Status
              </CardTitle>
              <CardDescription>
                Current status of your WhatsApp Business integration
              </CardDescription>
            </div>
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStatus}
                disabled={isPolling}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isPolling ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-6 rounded-lg ${connectionStatus.bgColor}`}>
            <div className="flex items-center gap-4">
              <StatusIcon className={`h-8 w-8 ${connectionStatus.color}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">
                    {connectionStatus.title}
                  </h3>
                  {connectionStatus.badge}
                </div>
                <p className="text-gray-600">{connectionStatus.description}</p>
                {connectionMessage && (
                  <p className="text-sm text-gray-500 mt-1">
                    {connectionMessage}
                  </p>
                )}
                {isPolling && (
                  <div className="flex items-center gap-2 mt-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      Monitoring connection status...
                    </span>
                  </div>
                )}
              </div>
            </div>
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
                  {accountStatus?.account_id ||
                    agent.whatsapp_connection?.account_id ||
                    "Not connected"}
                </span>
                {(accountStatus?.account_id ||
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
                {accountStatus?.phone_number ||
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

      {/* Connection Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Connection Management
          </CardTitle>
          <CardDescription>
            Manage your WhatsApp connection and account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Connected Successfully
                  </span>
                </div>
                <p className="text-green-700 text-sm">
                  Your agent is actively connected to WhatsApp and ready to
                  receive messages.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleReconnect}
                  disabled={isReconnecting}
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
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDisconnect}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Connect WhatsApp Account
                  </span>
                </div>
                <p className="text-blue-700 text-sm mb-3">
                  Scan the QR code with your WhatsApp Business app to connect
                  your account.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleRequestQR}
                  disabled={isConnecting || isReconnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating QR...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
                {agent.whatsapp_connection?.account_id && (
                  <Button
                    variant="outline"
                    onClick={handleReconnect}
                    disabled={isReconnecting || isConnecting}
                  >
                    {isReconnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reconnecting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reconnect Existing
                      </>
                    )}
                  </Button>
                )}
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

      {/* WhatsApp Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>You need a WhatsApp Business account to connect your agent</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>
                Each phone number can only be connected to one agent at a time
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>
                Make sure your WhatsApp Business app is up to date before
                connecting
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>QR codes expire after 5 minutes for security</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>
                Connection status updates are provided in real-time via
                WebSocket
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
