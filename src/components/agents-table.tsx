"use client";

import { useState, useEffect } from "react";
import { Plus, Bot, Phone, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agentApi } from "@/lib/api";
import { Agent, AgentsResponse } from "@/types/agent";
import { defaultAgentValues } from "@/schemas/agent-schema";
import { useRouter } from "next/navigation";

export default function AgentsTable() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    has_next: false,
    has_prev: false,
  });

  const fetchAgents = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response: AgentsResponse = await agentApi.getAgents({
        page,
        limit,
      });

      if (response.success) {
        setAgents(response.data);
        setPagination(response.pagination);
      } else {
        setError("Failed to fetch agents");
      }
    } catch (err: any) {
      console.error("Error fetching agents:", err);
      setError(err.response?.data?.error?.message || "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchAgents(newPage, pagination.limit);
  };

  const handleCreateAgent = async () => {
    alert("Create agent button clicked!"); // Debug alert
    console.log("Create agent clicked");
    console.log("Environment check:", {
      apiUrl: process.env.NEXT_PUBLIC_BERRYLABS_API_URL,
      hasApiKey: !!process.env.NEXT_PUBLIC_BERRYLABS_API_KEY,
    });

    try {
      setCreating(true);
      setError(null);

      // Use default values from schema for creating agent
      const createData = {
        name: defaultAgentValues.name,
        language: defaultAgentValues.language,
        system_prompt: defaultAgentValues.system_prompt,
        availability_schedule: defaultAgentValues.availability_schedule,
        advanced_settings: defaultAgentValues.advanced_settings,
      };

      console.log("Creating agent with data:", createData);
      const response = await agentApi.createAgent(createData);
      console.log("API response:", response);

      if (response.success) {
        // Redirect to agent detail page
        console.log("Redirecting to agent:", response.data.id);
        router.push(`/agent/${response.data.id}`);
      } else {
        console.error("Create agent failed:", response);
        setError("Failed to create agent");
      }
    } catch (err: any) {
      console.error("Error creating agent:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.error?.message || "Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Chatbot Agents
              </CardTitle>
              <CardDescription>
                Manage your WhatsApp AI agents and chatbots
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading agents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Chatbot Agents
              </CardTitle>
              <CardDescription>
                Manage your WhatsApp AI agents and chatbots
              </CardDescription>
            </div>
            <Button
              onClick={handleCreateAgent}
              disabled={creating}
              className={`${
                !creating
                  ? "cursor-pointer hover:bg-primary/90"
                  : "cursor-not-allowed"
              }`}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <Button onClick={() => fetchAgents()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Chatbot Agents
            </CardTitle>
            <CardDescription>
              Manage your WhatsApp AI agents and chatbots
            </CardDescription>
          </div>
          <Button
            onClick={handleCreateAgent}
            disabled={creating}
            className={`${
              !creating
                ? "cursor-pointer hover:bg-primary/90"
                : "cursor-not-allowed"
            }`}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents found</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first AI chatbot agent
            </p>
            <Button
              onClick={handleCreateAgent}
              disabled={creating}
              className={`${
                !creating
                  ? "cursor-pointer hover:bg-primary/90"
                  : "cursor-not-allowed"
              }`}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Agent
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>WhatsApp Status</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Tools</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        {agent.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {agent.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {agent.language}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(agent.whatsapp_connection?.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {agent.whatsapp_connection?.phone_number ||
                          "Not connected"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(agent.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {agent.tools.length} tool
                        {agent.tools.length !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/agent/${agent.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Showing {agents.length} of {pagination.total} agents
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.has_prev}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 px-3 py-1 text-sm">
                    Page {pagination.page}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.has_next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
