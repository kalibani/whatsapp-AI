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
  AlertCircle,
  Save,
  RotateCcw,
  ExternalLink,
  Cherry,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { agentApi } from "@/lib/api";
import { Agent } from "@/types/agent";
import { toast } from "sonner";

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
  const [isSaving, setIsSaving] = useState(false);

  // Form data for all tabs
  const [formData, setFormData] = useState({
    // Agent tab
    name: "",
    language: "",
    system_prompt: "",
    description: "",
    knowledge_base: [] as any[],
    files: [] as any[],
    tools: [] as any[],
    // WhatsApp tab
    whatsapp_connection: {
      account_id: null as string | null,
      phone_number: null as string | null,
    },
    // Scheduling tab
    availability_schedule: null as any,
    // Advanced tab
    advanced_settings: null as any,
  });

  const fetchAgent = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const response = await agentApi.getAgent(agentId);

      if (response.success) {
        setAgent(response.data);
        updateFormDataFromAgent(response.data);
      } else {
        if (showLoading) {
          setError("Failed to fetch agent details");
        }
      }
    } catch (err: any) {
      console.error("Error fetching agent:", err);
      if (showLoading) {
        setError(
          err.response?.data?.error?.message || "Failed to fetch agent details"
        );
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchAgent();
    }
  }, [agentId]);

  const handleAgentUpdate = (updatedAgent: Agent) => {
    setAgent(updatedAgent);
    // Update form data when agent is updated
    updateFormDataFromAgent(updatedAgent);
  };

  // Update form data from agent
  const updateFormDataFromAgent = (agentData: Agent) => {
    setFormData({
      name: agentData.name,
      language: agentData.language,
      system_prompt: agentData.system_prompt,
      description: agentData.description || "",
      knowledge_base: agentData.knowledge_base || [],
      files: agentData.files || [],
      tools: agentData.tools || [],
      whatsapp_connection: {
        account_id: agentData.whatsapp_connection?.account_id || null,
        phone_number: agentData.whatsapp_connection?.phone_number || null,
      },
      availability_schedule: agentData.availability_schedule,
      advanced_settings: agentData.advanced_settings,
    });
  };

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!agent) return false;

    return (
      formData.name !== agent.name ||
      formData.language !== agent.language ||
      formData.system_prompt !== agent.system_prompt ||
      formData.description !== (agent.description || "") ||
      JSON.stringify(formData.knowledge_base) !==
        JSON.stringify(agent.knowledge_base || []) ||
      JSON.stringify(formData.files) !== JSON.stringify(agent.files || []) ||
      JSON.stringify(formData.tools) !== JSON.stringify(agent.tools || []) ||
      formData.whatsapp_connection.account_id !==
        (agent.whatsapp_connection?.account_id || null) ||
      formData.whatsapp_connection.phone_number !==
        (agent.whatsapp_connection?.phone_number || null) ||
      JSON.stringify(formData.availability_schedule) !==
        JSON.stringify(agent.availability_schedule) ||
      JSON.stringify(formData.advanced_settings) !==
        JSON.stringify(agent.advanced_settings)
    );
  };

  // Handle form data changes
  const handleFormDataChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle nested form data changes
  const handleNestedFormDataChange = (
    parentField: string,
    childField: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof typeof prev] as any),
        [childField]: value,
      },
    }));
  };

  // Reset form data
  const handleReset = () => {
    if (agent) {
      updateFormDataFromAgent(agent);
    }
  };

  // Save all changes
  const handleSave = async () => {
    if (!agent) return;

    try {
      setIsSaving(true);

      const updateData = {
        name: formData.name,
        language: formData.language,
        system_prompt: formData.system_prompt,
        description: formData.description || undefined,
        knowledge_base: formData.knowledge_base,
        files: formData.files,
        tools: formData.tools,
        whatsapp_connection: formData.whatsapp_connection,
        availability_schedule: formData.availability_schedule,
        advanced_settings: formData.advanced_settings,
      };

      const response = await agentApi.updateAgent(agent.id, updateData);

      if (response.success) {
        // Refetch the agent to get the most up-to-date data
        await fetchAgent(false);

        toast.success("Agent Updated", {
          description: "All changes have been saved successfully.",
        });
      } else {
        console.error("Failed to update agent:", response);
        toast.error("Update Failed", {
          description: "Failed to update agent. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Error updating agent:", error);
      toast.error("Update Failed", {
        description:
          error.response?.data?.error?.message ||
          "Failed to update agent. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
                <Button onClick={() => fetchAgent()}>Try Again</Button>
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
            <TabsList className="grid w-full grid-cols-4 h-10 border border-gray-300">
              <TabsTrigger
                value="agent"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Bot className="h-4 w-4" />
                Agent
              </TabsTrigger>
              <TabsTrigger
                value="whatsapp"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                WhatsApp Connection
              </TabsTrigger>
              <TabsTrigger
                value="scheduling"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                Scheduling
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                Advanced Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agent">
              <AgentTab
                agent={agent}
                formData={{
                  name: formData.name,
                  language: formData.language,
                  system_prompt: formData.system_prompt,
                  description: formData.description,
                  knowledge_base: formData.knowledge_base,
                  files: formData.files,
                  tools: formData.tools,
                }}
                onFormDataChange={handleFormDataChange}
                onUpdate={handleAgentUpdate}
              />
            </TabsContent>

            <TabsContent value="whatsapp">
              <WhatsAppTab
                agent={agent}
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onUpdate={handleAgentUpdate}
              />
            </TabsContent>

            <TabsContent value="scheduling">
              <SchedulingTab
                formData={formData}
                onFormDataChange={handleFormDataChange}
              />
            </TabsContent>

            <TabsContent value="advanced">
              <AdvancedTab
                formData={formData}
                onFormDataChange={handleFormDataChange}
              />
            </TabsContent>
          </Tabs>

          {/* Floating Save Button */}
          {hasChanges() && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-lg border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-x-2">
                  <div className="flex items-center gap-x-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Unsaved changes
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      type="button"
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button
                      disabled={isSaving}
                      type="button"
                      onClick={handleSave}
                      className="min-h-[44px] min-w-[88px]"
                    >
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Powered by BerryLabs - Fixed Bottom Right */}
      <div className="fixed bottom-4 right-4 z-10">
        <a
          href="https://berrylabs.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm text-xs text-gray-500 hover:text-gray-700 hover:shadow-md transition-all group"
        >
          <Cherry className="h-6 w-6 text-[#FF6B81]" />
          <span>Powered by BerryLabs</span>
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>
  );
}
