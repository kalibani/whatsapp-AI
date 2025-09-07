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
    </div>
  );
}
