"use client";

import { useState } from "react";
import { Check, X, ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

interface Tool {
  id?: string;
  type: "webhook";
  name: string;
  description: string;
  api_schema: {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    request_headers?: Record<string, string>;
    path_params_schema?: Record<string, any>;
    query_params_schema?: {
      properties: Record<string, any>;
      required: string[];
    };
    request_body_schema?: {
      type: "object";
      description: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
}

interface ToolConfigFormProps {
  editingToolId: string | null;
  onSave: (tool: Tool) => void;
  onCancel: () => void;
  initialData?: Tool;
}

export default function ToolConfigForm({
  editingToolId,
  onSave,
  onCancel,
  initialData,
}: ToolConfigFormProps) {
  const [activeToolTab, setActiveToolTab] = useState("info");

  // Tool form state
  const [toolName, setToolName] = useState(initialData?.name || "");
  const [toolDescription, setToolDescription] = useState(
    initialData?.description || ""
  );
  const [toolMethod, setToolMethod] = useState<
    "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  >(initialData?.api_schema.method || "GET");
  const [toolUrl, setToolUrl] = useState(initialData?.api_schema.url || "");

  // Tool configuration state
  const [toolHeaders, setToolHeaders] = useState<Record<string, string>>(
    initialData?.api_schema.request_headers || {}
  );
  const [toolPathParams, setToolPathParams] = useState<Record<string, any>>(
    initialData?.api_schema.path_params_schema || {}
  );
  const [toolQueryParams, setToolQueryParams] = useState<Record<string, any>>(
    () => {
      if (initialData?.api_schema.query_params_schema?.properties) {
        const queryParams: Record<string, any> = {};
        Object.entries(
          initialData.api_schema.query_params_schema.properties
        ).forEach(([key, value]) => {
          queryParams[key] = {
            type: (value as any).type || "string",
            description: (value as any).description || "",
            required:
              initialData.api_schema.query_params_schema?.required?.includes(
                key
              ) || false,
          };
        });
        return queryParams;
      }
      return {};
    }
  );
  const [toolBodyParams, setToolBodyParams] = useState<Record<string, any>>(
    () => {
      if (initialData?.api_schema.request_body_schema?.properties) {
        const bodyParams: Record<string, any> = {};
        Object.entries(
          initialData.api_schema.request_body_schema.properties
        ).forEach(([key, value]) => {
          bodyParams[key] = {
            type: (value as any).type || "string",
            description: (value as any).description || "",
            required:
              initialData.api_schema.request_body_schema?.required?.includes(
                key
              ) || false,
          };
        });
        return bodyParams;
      }
      return {};
    }
  );

  // Form input state for adding new parameters
  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");
  const [newParamKey, setNewParamKey] = useState("");
  const [newParamType, setNewParamType] = useState("string");
  const [newParamDescription, setNewParamDescription] = useState("");
  const [newParamRequired, setNewParamRequired] = useState(false);

  // Test state
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [testResponse, setTestResponse] = useState<any>(null);

  const generateToolId = () =>
    `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addHeader = () => {
    if (newHeaderKey.trim() && newHeaderValue.trim()) {
      setToolHeaders((prev) => ({
        ...prev,
        [newHeaderKey]: newHeaderValue,
      }));
      setNewHeaderKey("");
      setNewHeaderValue("");
    }
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...toolHeaders };
    delete newHeaders[key];
    setToolHeaders(newHeaders);
  };

  const addParameter = (type: "path" | "query" | "body") => {
    if (!newParamKey.trim()) return;

    const paramData = {
      type: newParamType,
      description: newParamDescription || `Parameter ${newParamKey}`,
      required: newParamRequired,
    };

    switch (type) {
      case "path":
        setToolPathParams((prev) => ({ ...prev, [newParamKey]: paramData }));
        break;
      case "query":
        setToolQueryParams((prev) => ({ ...prev, [newParamKey]: paramData }));
        break;
      case "body":
        setToolBodyParams((prev) => ({ ...prev, [newParamKey]: paramData }));
        break;
    }

    setNewParamKey("");
    setNewParamType("string");
    setNewParamDescription("");
    setNewParamRequired(false);
  };

  const removeParameter = (type: "path" | "query" | "body", key: string) => {
    switch (type) {
      case "path":
        const newPathParams = { ...toolPathParams };
        delete newPathParams[key];
        setToolPathParams(newPathParams);
        break;
      case "query":
        const newQueryParams = { ...toolQueryParams };
        delete newQueryParams[key];
        setToolQueryParams(newQueryParams);
        break;
      case "body":
        const newBodyParams = { ...toolBodyParams };
        delete newBodyParams[key];
        setToolBodyParams(newBodyParams);
        break;
    }
  };

  const testTool = async () => {
    try {
      if (!toolUrl.trim()) {
        throw new Error("URL is required");
      }

      let urlToTest = toolUrl;

      // Replace path parameters
      Object.keys(toolPathParams).forEach((paramKey) => {
        const placeholder = `{${paramKey}}`;
        const value = `sample_${paramKey}`;
        urlToTest = urlToTest.replace(placeholder, value);
      });

      const urlObj = new URL(urlToTest);

      // Add query parameters
      Object.keys(toolQueryParams).forEach((paramKey) => {
        const value = `sample_${paramKey}`;
        urlObj.searchParams.append(paramKey, value);
      });

      const requestHeaders = {
        "Content-Type": "application/json",
        ...toolHeaders,
      };

      const options: RequestInit = {
        method: toolMethod,
        headers: requestHeaders,
      };

      let requestBody: any = null;
      if (
        ["POST", "PUT", "PATCH"].includes(toolMethod) &&
        Object.keys(toolBodyParams).length > 0
      ) {
        const body: Record<string, any> = {};
        Object.keys(toolBodyParams).forEach((paramKey) => {
          const value = `sample_${paramKey}`;
          body[paramKey] = value;
        });
        requestBody = body;
        options.body = JSON.stringify(body);
      }

      const testResponseObj = {
        url: urlObj.toString(),
        method: toolMethod,
        headers: requestHeaders,
        body: requestBody,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      options.signal = controller.signal;

      try {
        const response = await fetch(urlObj.toString(), options);
        clearTimeout(timeoutId);

        if (response.ok) {
          setTestSuccess(true);
          try {
            const data = await response.json();
            setTestResponse({
              ...testResponseObj,
              response: {
                status: response.status,
                statusText: response.statusText,
                data,
              },
            });
          } catch (e) {
            setTestResponse({
              ...testResponseObj,
              response: {
                status: response.status,
                statusText: response.statusText,
              },
            });
          }
        } else {
          setTestSuccess(false);
          setTestResponse({
            ...testResponseObj,
            response: {
              status: response.status,
              statusText: response.statusText,
            },
            error: `HTTP Error ${response.status}: ${response.statusText}`,
          });
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        setTestSuccess(false);
        let errorMessage = "Unknown error";
        if (error.name === "AbortError") {
          errorMessage = "Request timeout";
        } else if (error.message?.includes("CORS")) {
          errorMessage =
            "CORS error: Server may not allow requests from browser";
        } else {
          errorMessage = error.message || "Unknown error";
        }

        setTestResponse({
          ...testResponseObj,
          error: errorMessage,
        });
      }
    } catch (error: any) {
      setTestSuccess(false);
      setTestResponse({
        url: toolUrl,
        method: toolMethod,
        headers: { "Content-Type": "application/json", ...toolHeaders },
        error: `Validation error: ${error.message}`,
      });
    }
  };

  const handleSave = () => {
    if (!toolName.trim() || !toolUrl.trim() || !toolDescription.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate tool name format
    const toolNameRegex = /^[a-zA-Z0-9_-]{1,64}$/;
    if (!toolNameRegex.test(toolName)) {
      alert(
        "Tool name must be 1-64 characters and can only contain letters, numbers, underscores and hyphens"
      );
      return;
    }

    // Validate URL
    try {
      new URL(toolUrl);
    } catch (e) {
      alert("Please enter a valid URL");
      return;
    }

    // Build query params schema
    let queryParamsSchema;
    if (Object.keys(toolQueryParams).length > 0) {
      const properties = Object.entries(toolQueryParams).reduce(
        (acc, [key, value]) => {
          return {
            ...acc,
            [key]: {
              type: (value as any).type || "string",
              description: (value as any).description || "",
            },
          };
        },
        {}
      );

      const required = Object.entries(toolQueryParams)
        .filter(([_, value]) => (value as any).required)
        .map(([key]) => key);

      queryParamsSchema = {
        properties,
        required,
      };
    }

    // Build body params schema
    let bodyParamsSchema;
    if (
      ["POST", "PUT", "PATCH"].includes(toolMethod) &&
      Object.keys(toolBodyParams).length > 0
    ) {
      const properties = Object.entries(toolBodyParams).reduce(
        (acc, [key, value]) => {
          return {
            ...acc,
            [key]: {
              type: (value as any).type || "string",
              description: (value as any).description || "",
            },
          };
        },
        {}
      );

      const required = Object.entries(toolBodyParams)
        .filter(([_, value]) => (value as any).required)
        .map(([key]) => key);

      bodyParamsSchema = {
        type: "object" as const,
        description: `Request body for ${toolName}`,
        properties,
        required,
      };
    }

    const toolData: Tool = {
      id: editingToolId || generateToolId(),
      type: "webhook",
      name: toolName,
      description: toolDescription,
      api_schema: {
        url: toolUrl,
        method: toolMethod,
        request_headers:
          Object.keys(toolHeaders).length > 0 ? toolHeaders : undefined,
        path_params_schema:
          Object.keys(toolPathParams).length > 0 ? toolPathParams : undefined,
        query_params_schema: queryParamsSchema,
        request_body_schema: bodyParamsSchema,
      },
    };

    onSave(toolData);
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">
          {editingToolId ? "Edit Tool" : "Add New Tool"}
        </CardTitle>
        <CardDescription>Configure webhook tool for your agent</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeToolTab} onValueChange={setActiveToolTab}>
          <TabsList className="grid grid-cols-6 mb-6">
            <TabsTrigger value="info" className="cursor-pointer">
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="headers" className="cursor-pointer">
              Headers
            </TabsTrigger>
            <TabsTrigger value="path" className="cursor-pointer">
              Path Params
            </TabsTrigger>
            <TabsTrigger value="query" className="cursor-pointer">
              Query Params
            </TabsTrigger>
            <TabsTrigger
              value="body"
              disabled={!["POST", "PUT", "PATCH"].includes(toolMethod)}
              className={
                !["POST", "PUT", "PATCH"].includes(toolMethod)
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }
            >
              Body
            </TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="toolName">Tool Name *</Label>
                <Input
                  id="toolName"
                  value={toolName}
                  onChange={(e) => {
                    if (
                      /^[a-zA-Z0-9_-]*$/.test(e.target.value) ||
                      e.target.value === ""
                    ) {
                      setToolName(e.target.value);
                    }
                  }}
                  placeholder="my_webhook_tool"
                  maxLength={64}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1-64 characters, letters, numbers, underscores, hyphens only
                </p>
              </div>
              <div>
                <Label htmlFor="toolMethod">Method *</Label>
                <Select
                  value={toolMethod}
                  onValueChange={(v) => setToolMethod(v as any)}
                >
                  <SelectTrigger id="toolMethod" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="toolUrl">URL *</Label>
              <Input
                id="toolUrl"
                value={toolUrl}
                onChange={(e) => setToolUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint/{id}"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {`{parameter_name}`} for path parameters
              </p>
            </div>

            <div>
              <Label htmlFor="toolDescription">Description *</Label>
              <Textarea
                id="toolDescription"
                value={toolDescription}
                onChange={(e) => setToolDescription(e.target.value)}
                placeholder="Describe what this tool does and when the AI should use it"
                className="mt-1 min-h-[100px]"
              />
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ This description is crucial - it tells the AI when and how to
                use this tool
              </p>
            </div>
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Request Headers</h3>
              <p className="text-sm text-gray-500 mb-4">
                Add headers that will be sent with every request
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <Label>Header Name</Label>
                <Input
                  value={newHeaderKey}
                  onChange={(e) => setNewHeaderKey(e.target.value)}
                  placeholder="Authorization"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Header Value</Label>
                <Input
                  value={newHeaderValue}
                  onChange={(e) => setNewHeaderValue(e.target.value)}
                  placeholder="Bearer token"
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addHeader}
                  disabled={!newHeaderKey.trim() || !newHeaderValue.trim()}
                  className="w-full"
                >
                  Add
                </Button>
              </div>
            </div>

            {Object.keys(toolHeaders).length > 0 && (
              <div className="border rounded-md">
                <div className="bg-gray-50 px-3 py-2 text-sm font-medium">
                  Headers ({Object.keys(toolHeaders).length})
                </div>
                {Object.entries(toolHeaders).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border-b p-3 last:border-0"
                  >
                    <div>
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHeader(key)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="path" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Path Parameters</h3>
              <p className="text-sm text-gray-500 mb-4">
                Define parameters that replace {`{parameter_name}`} in your URL
              </p>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-3">
                <Label>Parameter Name</Label>
                <Input
                  value={newParamKey}
                  onChange={(e) => setNewParamKey(e.target.value)}
                  placeholder="id"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Type</Label>
                <Select value={newParamType} onValueChange={setNewParamType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                <Label>AI Instructions</Label>
                <Input
                  value={newParamDescription}
                  onChange={(e) => setNewParamDescription(e.target.value)}
                  placeholder="The user ID to lookup"
                  className="mt-1"
                />
              </div>
              <div className="col-span-1 flex items-center justify-center pt-6">
                <input
                  type="checkbox"
                  checked={newParamRequired}
                  onChange={(e) => setNewParamRequired(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              <div className="col-span-2 flex items-end">
                <Button
                  type="button"
                  onClick={() => addParameter("path")}
                  disabled={!newParamKey.trim()}
                  className="w-full"
                >
                  Add
                </Button>
              </div>
            </div>

            {Object.keys(toolPathParams).length > 0 && (
              <div className="border rounded-md">
                <div className="bg-gray-50 px-3 py-2 text-sm font-medium">
                  Path Parameters ({Object.keys(toolPathParams).length})
                </div>
                {Object.entries(toolPathParams).map(([key, param]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border-b p-3 last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key}</span>
                        {param.required && (
                          <span className="text-red-500">*</span>
                        )}
                        <Badge variant="outline">{param.type}</Badge>
                      </div>
                      {param.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {param.description}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParameter("path", key)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="query" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Query Parameters</h3>
              <p className="text-sm text-gray-500 mb-4">
                Define parameters that will be added to the URL as ?param=value
              </p>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-3">
                <Label>Parameter Name</Label>
                <Input
                  value={newParamKey}
                  onChange={(e) => setNewParamKey(e.target.value)}
                  placeholder="limit"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Type</Label>
                <Select value={newParamType} onValueChange={setNewParamType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                <Label>AI Instructions</Label>
                <Input
                  value={newParamDescription}
                  onChange={(e) => setNewParamDescription(e.target.value)}
                  placeholder="Maximum number of results to return"
                  className="mt-1"
                />
              </div>
              <div className="col-span-1 flex items-center justify-center pt-6">
                <input
                  type="checkbox"
                  checked={newParamRequired}
                  onChange={(e) => setNewParamRequired(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              <div className="col-span-2 flex items-end">
                <Button
                  type="button"
                  onClick={() => addParameter("query")}
                  disabled={!newParamKey.trim()}
                  className="w-full"
                >
                  Add
                </Button>
              </div>
            </div>

            {Object.keys(toolQueryParams).length > 0 && (
              <div className="border rounded-md">
                <div className="bg-gray-50 px-3 py-2 text-sm font-medium">
                  Query Parameters ({Object.keys(toolQueryParams).length})
                </div>
                {Object.entries(toolQueryParams).map(([key, param]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border-b p-3 last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key}</span>
                        {param.required && (
                          <span className="text-red-500">*</span>
                        )}
                        <Badge variant="outline">{param.type}</Badge>
                      </div>
                      {param.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {param.description}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParameter("query", key)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="body" className="space-y-4">
            {!["POST", "PUT", "PATCH"].includes(toolMethod) ? (
              <div className="text-center py-8 text-yellow-600 bg-yellow-50 rounded-lg">
                <p className="font-medium">
                  Body parameters are only available for POST, PUT, and PATCH
                  methods
                </p>
                <p className="text-sm">
                  Switch to one of these methods to configure request body
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-medium mb-2">Request Body Properties</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Define the JSON properties that will be sent in the request
                    body
                  </p>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <Label>Property Name</Label>
                    <Input
                      value={newParamKey}
                      onChange={(e) => setNewParamKey(e.target.value)}
                      placeholder="name"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Type</Label>
                    <Select
                      value={newParamType}
                      onValueChange={setNewParamType}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="object">Object</SelectItem>
                        <SelectItem value="array">Array</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Label>AI Instructions</Label>
                    <Input
                      value={newParamDescription}
                      onChange={(e) => setNewParamDescription(e.target.value)}
                      placeholder="The user's full name"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center pt-6">
                    <input
                      type="checkbox"
                      checked={newParamRequired}
                      onChange={(e) => setNewParamRequired(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      onClick={() => addParameter("body")}
                      disabled={!newParamKey.trim()}
                      className="w-full"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {Object.keys(toolBodyParams).length > 0 && (
                  <div className="border rounded-md">
                    <div className="bg-gray-50 px-3 py-2 text-sm font-medium">
                      Body Properties ({Object.keys(toolBodyParams).length})
                    </div>
                    {Object.entries(toolBodyParams).map(([key, param]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between border-b p-3 last:border-0"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{key}</span>
                            {param.required && (
                              <span className="text-red-500">*</span>
                            )}
                            <Badge variant="outline">{param.type}</Badge>
                          </div>
                          {param.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {param.description}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParameter("body", key)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {Object.keys(toolBodyParams).length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">JSON Preview</h4>
                    <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-auto max-h-32">
                      {JSON.stringify(
                        Object.keys(toolBodyParams).reduce(
                          (acc, key) => ({
                            ...acc,
                            [key]:
                              toolBodyParams[key].type === "string"
                                ? "string value"
                                : toolBodyParams[key].type === "number"
                                ? 123
                                : toolBodyParams[key].type === "boolean"
                                ? true
                                : toolBodyParams[key].type === "array"
                                ? []
                                : {},
                          }),
                          {}
                        ),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Test Your Tool</h3>
              <p className="text-sm text-gray-500 mb-4">
                Test the tool configuration by making a real API call
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border rounded-lg p-6">
              <Button
                type="button"
                onClick={testTool}
                disabled={
                  !toolUrl.trim() || !toolName.trim() || !toolDescription.trim()
                }
                className="mb-4"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Connection
              </Button>

              {testSuccess !== null && (
                <div className="flex items-center mb-4">
                  {testSuccess ? (
                    <>
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-600 font-medium">
                        Connection successful!
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-600 font-medium">
                        Connection failed
                      </span>
                    </>
                  )}
                </div>
              )}

              {testResponse && (
                <div className="w-full max-w-2xl bg-gray-50 rounded-lg p-4 text-xs">
                  <h5 className="font-medium mb-2">Test Results</h5>
                  <div className="space-y-2">
                    <div>
                      <strong>URL:</strong> {testResponse.url}
                    </div>
                    <div>
                      <strong>Method:</strong> {testResponse.method}
                    </div>
                    {testResponse.response && (
                      <div>
                        <strong>Status:</strong> {testResponse.response.status}{" "}
                        {testResponse.response.statusText}
                      </div>
                    )}
                    {testResponse.error && (
                      <div className="text-red-600">
                        <strong>Error:</strong> {testResponse.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              !toolName.trim() || !toolUrl.trim() || !toolDescription.trim()
            }
          >
            <Save className="h-4 w-4 mr-2" />
            {editingToolId ? "Update Tool" : "Save Tool"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
