"use client";

import { useState } from "react";
import {
  Smartphone,
  QrCode,
  Phone,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/types/agent";

interface WhatsAppTabProps {
  agent: Agent;
  onUpdate: (agent: Agent) => void;
}

export default function WhatsAppTab({ agent, onUpdate }: WhatsAppTabProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const getConnectionStatus = () => {
    const status = agent.whatsapp_connection?.status;

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

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp Connection Status
          </CardTitle>
          <CardDescription>
            Current status of your WhatsApp Business integration
          </CardDescription>
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
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {agent.whatsapp_connection?.account_id || "Not connected"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {agent.whatsapp_connection?.phone_number || "Not connected"}
              </div>
            </div>
          </div>
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
          {agent.whatsapp_connection?.status === "connected" ? (
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Disconnect WhatsApp
                </Button>
                <Button variant="outline">Refresh Connection</Button>
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

              <div className="flex gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              <p>Connection status updates may take a few minutes to reflect</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
