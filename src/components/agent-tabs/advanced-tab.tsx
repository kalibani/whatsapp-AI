"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  Database,
  Clock,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Agent } from "@/types/agent";
import { DataCollectionField } from "@/schemas/agent-schema";

interface AdvancedTabProps {
  formData: any;
  onFormDataChange: (field: string, value: any) => void;
}

const DATA_TYPES = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
];

export default function AdvancedTab({
  formData,
  onFormDataChange,
}: AdvancedTabProps) {
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<DataCollectionField | null>(
    null
  );
  const [fieldForm, setFieldForm] = useState<DataCollectionField>({
    identifier: "",
    dataType: "string",
    description: "",
  });

  const settings = formData.advanced_settings || {
    disable_ai_after_manual_response: false,
    manual_takeover_auto_reset_minutes: 30,
    data_collection_fields: [],
  };

  const updateAdvancedSetting = (field: string, value: any) => {
    const updatedSettings = {
      ...settings,
      [field]: value,
    };
    onFormDataChange("advanced_settings", updatedSettings);
  };

  const updateDataFields = (fields: DataCollectionField[]) => {
    updateAdvancedSetting("data_collection_fields", fields);
  };

  const handleAddField = () => {
    setFieldForm({
      identifier: "",
      dataType: "string",
      description: "",
    });
    setEditingField(null);
    setShowAddFieldDialog(true);
  };

  const handleEditField = (field: DataCollectionField) => {
    setFieldForm(field);
    setEditingField(field);
    setShowAddFieldDialog(true);
  };

  const handleSaveField = () => {
    const currentFields = settings.data_collection_fields || [];

    if (editingField) {
      // Edit existing field
      const updatedFields = currentFields.map((field: DataCollectionField) =>
        field.id === editingField.id ? fieldForm : field
      );
      updateDataFields(updatedFields);
    } else {
      // Add new field
      const newField = {
        ...fieldForm,
        id: Date.now().toString(), // Simple ID generation
      };
      updateDataFields([...currentFields, newField]);
    }

    setShowAddFieldDialog(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldToDelete: DataCollectionField) => {
    const currentFields = settings.data_collection_fields || [];
    const updatedFields = currentFields.filter(
      (field: DataCollectionField) => field.id !== fieldToDelete.id
    );
    updateDataFields(updatedFields);
  };

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
          <div className="space-y-3">
            <div className="text-base font-medium">
              Disable AI After Manual Response
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium mb-1">
                  Automatic AI Deactivation
                </div>
                <div className="text-sm text-gray-600">
                  When enabled, AI stops responding after a human agent takes
                  over the conversation
                </div>
              </div>
              <Switch
                checked={settings.disable_ai_after_manual_response}
                onCheckedChange={(checked) =>
                  updateAdvancedSetting(
                    "disable_ai_after_manual_response",
                    checked
                  )
                }
              />
            </div>
          </div>

          {/* Auto Reset Timer */}
          <div className="space-y-3">
            <div className="text-base font-medium">
              Manual Takeover Auto Reset
            </div>
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Reset Timer (minutes)</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.manual_takeover_auto_reset_minutes}
                  onChange={(e) =>
                    updateAdvancedSetting(
                      "manual_takeover_auto_reset_minutes",
                      parseInt(e.target.value) || 30
                    )
                  }
                  className="w-24"
                />
                <span className="text-sm text-gray-600">
                  Time before AI automatically resumes after manual takeover
                </span>
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
            <Button variant="outline" size="sm" onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {settings.data_collection_fields &&
          settings.data_collection_fields.length > 0 ? (
            <div className="space-y-3">
              {settings.data_collection_fields.map(
                (field: DataCollectionField, index: number) => (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditField(field)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteField(field)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">
                No data collection fields configured
              </p>
              <p className="text-sm mt-1">
                Add fields to automatically collect customer information during
                conversations
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Field Dialog */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {editingField
                ? "Edit Data Collection Field"
                : "Add Data Collection Field"}
            </DialogTitle>
            <DialogDescription>
              Configure a field for the AI to automatically collect from
              customers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-medium">
                Field Identifier
              </label>
              <Input
                id="identifier"
                placeholder="e.g., customer_name, phone_number"
                value={fieldForm.identifier}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, identifier: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                Unique identifier for this field (use lowercase with
                underscores)
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="dataType" className="text-sm font-medium">
                Data Type
              </label>
              <Select
                value={fieldForm.dataType}
                onValueChange={(value) =>
                  setFieldForm({ ...fieldForm, dataType: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                AI Instruction
              </label>
              <Textarea
                id="description"
                placeholder="Tell the AI how to collect this data..."
                value={fieldForm.description}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, description: e.target.value })
                }
                className="h-24 resize-none"
              />
              <p className="text-xs text-gray-500">
                Describe how the AI should collect this information from
                customers
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddFieldDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveField}
                disabled={
                  !fieldForm.identifier.trim() || !fieldForm.description.trim()
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {editingField ? "Update Field" : "Add Field"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
