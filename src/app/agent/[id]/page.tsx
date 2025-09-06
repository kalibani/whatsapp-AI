"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Loader2,
  Settings,
  Calendar,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { agentApi } from "@/lib/api";
import { Agent } from "@/types/agent";

// Tab Components
import AgentTab from "@/components/agent-tabs/agent-tab";
import WhatsAppTab from "@/components/agent-tabs/whatsapp-tab";
import SchedulingTab from "@/components/agent-tabs/scheduling-tab";
import AdvancedTab from "@/components/agent-tabs/advanced-tab";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await agentApi.getAgent(agentId);

      if (response.success) {
        setAgent(response.data);
      } else {
        setError("Failed to fetch agent details");
      }
    } catch (err: any) {
      console.error("Error fetching agent:", err);
      setError(
        err.response?.data?.error?.message || "Failed to fetch agent details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchAgent();
    }
  }, [agentId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Disconnected</Badge>;

    switch (status.toLowerCase()) {
      case "connected":
        return (
          <Badge variant="default" className="bg-green-600">
            Connected
          </Badge>
        );
      case "disconnected":
        return <Badge variant="secondary">Disconnected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading agent details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                Error: {error || "Agent not found"}
              </div>
              <div className="space-x-4">
                <Button onClick={() => router.push("/")} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Agents
                </Button>
                <Button onClick={fetchAgent}>Try Again</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6" />
                <h1 className="text-2xl font-bold">{agent.name}</h1>
              </div>
              {getStatusBadge(agent.whatsapp_connection?.status)}
            </div>

            {agent.description && (
              <p className="text-gray-600 mb-4">{agent.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>
                Language:{" "}
                <Badge variant="outline" className="uppercase">
                  {agent.language}
                </Badge>
              </span>
              <span>Created: {formatDate(agent.created_at)}</span>
              <span>Updated: {formatDate(agent.updated_at)}</span>
              <span>Tools: {agent.tools.length}</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="agent" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="agent" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Agent
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                WhatsApp Connection
              </TabsTrigger>
              <TabsTrigger
                value="scheduling"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Scheduling
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agent">
              <AgentTab agent={agent} onUpdate={setAgent} />
            </TabsContent>

            <TabsContent value="whatsapp">
              <WhatsAppTab agent={agent} onUpdate={setAgent} />
            </TabsContent>

            <TabsContent value="scheduling">
              <SchedulingTab agent={agent} onUpdate={setAgent} />
            </TabsContent>

            <TabsContent value="advanced">
              <AdvancedTab agent={agent} onUpdate={setAgent} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
