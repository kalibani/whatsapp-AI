"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  Database,
  Clock,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
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

interface AdvancedTabProps {
  agent: Agent;
  onUpdate: (agent: Agent) => void;
}

const DATA_TYPES = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
];

export default function AdvancedTab({ agent, onUpdate }: AdvancedTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  const settings = agent.advanced_settings;
  const disableAI = settings?.disable_ai_after_manual_response ?? false;
  const resetMinutes = settings?.manual_takeover_auto_reset_minutes ?? 30;
  const dataFields = settings?.data_collection_fields ?? [];

  return (
    <div className="space-y-6">
      {/* AI Behavior Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI Behavior Settings
          </CardTitle>
          <CardDescription>
            Configure how the AI responds and behaves during conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Disable AI After Manual Response */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {disableAI ? (
                  <ToggleRight className="h-6 w-6 text-green-600" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">
                    Disable AI After Manual Response
                  </div>
                  <div className="text-sm text-gray-600">
                    When enabled, AI stops responding after a human agent takes
                    over
                  </div>
                </div>
              </div>
            </div>
            <Badge variant={disableAI ? "default" : "secondary"}>
              {disableAI ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {/* Auto Reset Timer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Manual Takeover Auto Reset</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{resetMinutes} minutes</div>
                  <div className="text-sm text-gray-600">
                    Time before AI automatically resumes after manual takeover
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Collection Fields */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Collection Fields
              </CardTitle>
              <CardDescription>
                Configure what customer data the AI should collect during
                conversations
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dataFields && dataFields.length > 0 ? (
            <div className="space-y-3">
              {dataFields.map((field, index) => (
                <div
                  key={field.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{field.identifier}</span>
                      <Badge variant="outline">
                        {DATA_TYPES.find(
                          (type) => type.value === field.dataType
                        )?.label || field.dataType}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {field.description}
                    </div>
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
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No data collection fields configured</p>
              <p className="text-sm">
                Add fields to automatically collect customer information
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Data handling and security configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium">Data Encryption</span>
              </div>
              <div className="text-sm text-gray-600">
                All conversation data is encrypted in transit and at rest
              </div>
              <Badge variant="default" className="mt-2 bg-green-600">
                Active
              </Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Data Retention</span>
              </div>
              <div className="text-sm text-gray-600">
                Conversation history retained for 90 days
              </div>
              <Badge variant="outline" className="mt-2">
                Configurable
              </Badge>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Advanced Security Settings
          </Button>
        </CardContent>
      </Card>

      {/* Advanced Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Configuration
          </CardTitle>
          <CardDescription>Expert settings and configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Response Timeout</div>
                  <div className="text-sm text-gray-600">
                    Configure AI response timing
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Message Templates</div>
                  <div className="text-sm text-gray-600">
                    Manage automated responses
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Webhook Events</div>
                  <div className="text-sm text-gray-600">
                    Configure event notifications
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">API Access</div>
                  <div className="text-sm text-gray-600">
                    Manage API keys and access
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>
            Overview of current advanced settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  disableAI ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              <span>AI auto-disable: {disableAI ? "Enabled" : "Disabled"}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Auto-reset timer: {resetMinutes} minutes</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Data collection fields: {dataFields.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Security: Encryption enabled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
