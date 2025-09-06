"use client";

import { useState } from "react";
import { FileText, Globe, Wrench, Plus, Trash2, Edit } from "lucide-react";
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

interface AgentTabProps {
  agent: Agent;
  onUpdate: (agent: Agent) => void;
}

export default function AgentTab({ agent, onUpdate }: AgentTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Agent name, language, and system prompt configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Agent Name</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">{agent.name}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <div className="mt-1">
                <Badge variant="outline" className="uppercase">
                  {agent.language}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">System Prompt</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md h-32 overflow-y-auto whitespace-pre-wrap text-sm">
              {agent.system_prompt}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Knowledge Base
              </CardTitle>
              <CardDescription>
                Documents and knowledge sources for the agent
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Knowledge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {agent.knowledge_base && agent.knowledge_base.length > 0 ? (
            <div className="space-y-3">
              {agent.knowledge_base.map((kb, index) => (
                <div
                  key={kb.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{kb.name}</div>
                    <div className="text-sm text-gray-500">ID: {kb.id}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No knowledge base items configured</p>
              <p className="text-sm">
                Add documents to enhance your agent's knowledge
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Files
              </CardTitle>
              <CardDescription>Uploaded files and documents</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {agent.files && agent.files.length > 0 ? (
            <div className="space-y-3">
              {agent.files.map((file, index) => (
                <div
                  key={file.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{file.name}</span>
                      <Badge variant="secondary">{file.file_type}</Badge>
                    </div>
                    {file.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {file.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Size:{" "}
                      {file.file_size
                        ? `${Math.round(file.file_size / 1024)} KB`
                        : "Unknown"}{" "}
                      | Reference: {file.file_reference}
                    </div>
                    {file.usage_context && (
                      <div className="text-xs text-blue-600 mt-1">
                        Context: {file.usage_context}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No files uploaded</p>
              <p className="text-sm">
                Upload files to provide context to your agent
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Tools & Webhooks
              </CardTitle>
              <CardDescription>
                External tools and webhook integrations
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Tool
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {agent.tools && agent.tools.length > 0 ? (
            <div className="space-y-3">
              {agent.tools.map((tool, index) => (
                <div
                  key={tool.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      <span className="font-medium">{tool.name}</span>
                      <Badge variant="outline">{tool.api_schema.method}</Badge>
                      {tool.is_global && (
                        <Badge variant="secondary">Global</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {tool.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      URL: {tool.api_schema.url}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No tools configured</p>
              <p className="text-sm">
                Add webhooks and external tools to extend functionality
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
