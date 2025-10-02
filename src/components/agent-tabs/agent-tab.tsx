"use client";

import { useState, useEffect, useRef } from "react";
// Removed react-draggable due to React 19 compatibility issues
import {
  FileText,
  Globe,
  Wrench,
  Plus,
  Trash2,
  Loader2,
  Upload,
  Type,
  Library,
  ChevronDown,
  Settings,
  ExternalLink,
  Check,
  X,
  Terminal,
  Edit2,
  Save,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Agent } from "@/types/agent";
import { KnowledgeBaseDocument } from "@/types/knowledge-base";
import { ClientFile } from "@/types/files";
import { knowledgeBaseApi, filesApi } from "@/lib/api";
import KnowledgeBaseUploadModal from "@/components/knowledge-base-upload-modal";
import KnowledgeBaseTextModal from "@/components/knowledge-base-text-modal";
import FileUploadModal from "@/components/file-upload-modal";
import ToolConfigForm from "@/components/tool-config-form";

// Tool types based on agent schema
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

interface AgentTabProps {
  agent: Agent;
  formData: {
    name: string;
    language: string;
    system_prompt: string;
    description: string;
    knowledge_base: any[];
    files: any[];
    tools: Tool[];
  };
  onFormDataChange: (field: string, value: any) => void;
  onUpdate: (agent: Agent) => void;
}

export default function AgentTab({
  agent,
  formData,
  onFormDataChange,
  onUpdate,
}: AgentTabProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [knowledgeBaseDocs, setKnowledgeBaseDocs] = useState<
    KnowledgeBaseDocument[]
  >([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loadingKnowledgeBase, setLoadingKnowledgeBase] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [addingToAgent, setAddingToAgent] = useState<string | null>(null);
  const [addingFileToAgent, setAddingFileToAgent] = useState<string | null>(
    null
  );

  // Ref for auto-scrolling to tool form
  const toolFormRef = useRef<HTMLDivElement>(null);

  // Tool state variables
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [activeToolTab, setActiveToolTab] = useState("info");

  // Tool form state
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolMethod, setToolMethod] = useState<
    "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  >("GET");
  const [toolUrl, setToolUrl] = useState("");

  // Tool configuration state
  const [toolHeaders, setToolHeaders] = useState<Record<string, string>>({});
  const [toolPathParams, setToolPathParams] = useState<Record<string, any>>({});
  const [toolQueryParams, setToolQueryParams] = useState<Record<string, any>>(
    {}
  );
  const [toolBodyParams, setToolBodyParams] = useState<Record<string, any>>({});

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
  const [testPathParamValues, setTestPathParamValues] = useState<
    Record<string, string>
  >({});
  const [testQueryParamValues, setTestQueryParamValues] = useState<
    Record<string, string>
  >({});
  const [testBodyParamValues, setTestBodyParamValues] = useState<
    Record<string, any>
  >({});

  const handleInputChange = (field: string, value: string) => {
    onFormDataChange(field, value);
  };

  const fetchKnowledgeBaseDocs = async () => {
    try {
      setLoadingKnowledgeBase(true);
      const response = await knowledgeBaseApi.getDocuments();
      if (response.success) {
        setKnowledgeBaseDocs(response.data);
      }
    } catch (error) {
      console.error("Error fetching knowledge base documents:", error);
    } finally {
      setLoadingKnowledgeBase(false);
    }
  };

  const handleRemoveFromAgent = (docId: string) => {
    if (
      !confirm("Are you sure you want to remove this document from the agent?")
    ) {
      return;
    }

    try {
      // Remove from formData knowledge base (deselect from agent)
      const updatedKnowledgeBase = formData.knowledge_base.filter(
        (kb) => kb.id !== docId
      );

      // Update formData instead of making API call
      onFormDataChange("knowledge_base", updatedKnowledgeBase);
    } catch (error: any) {
      console.error("Error removing document from agent:", error);
      alert("Failed to remove document from agent");
    }
  };

  const handleDeleteFromDatabase = async (docId: string, docName: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${docName}" from the knowledge base? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await knowledgeBaseApi.deleteDocument(docId);
      if (response.success) {
        // Remove from formData if it was selected
        const updatedKnowledgeBase = formData.knowledge_base.filter(
          (kb) => kb.id !== docId
        );
        onFormDataChange("knowledge_base", updatedKnowledgeBase);

        // Refresh knowledge base list
        fetchKnowledgeBaseDocs();
      }
    } catch (error: any) {
      console.error("Error deleting document:", error);
      alert(
        error.response?.data?.error?.message || "Failed to delete document"
      );
    }
  };

  const handleUploadSuccess = (uploadedDoc?: any) => {
    // Refresh knowledge base list so new document appears in library
    fetchKnowledgeBaseDocs();

    // If document details are provided, add to selected knowledge base
    if (uploadedDoc) {
      const newKnowledgeBaseItem = {
        id: uploadedDoc.document_id,
        name: uploadedDoc.title,
        type:
          uploadedDoc.document_type === "text"
            ? "text"
            : uploadedDoc.document_type === "pdf"
            ? "pdf"
            : "document",
        description: uploadedDoc.description || "",
      };

      const updatedKnowledgeBase = [
        ...(formData.knowledge_base || []),
        newKnowledgeBaseItem,
      ];

      onFormDataChange("knowledge_base", updatedKnowledgeBase);
    }

    // Close the modal
    setShowUploadModal(false);
  };

  const handleTextUploadSuccess = (uploadedDoc?: any) => {
    // Refresh knowledge base list so new document appears in library
    fetchKnowledgeBaseDocs();
    // If document details are provided, add to selected knowledge base
    if (uploadedDoc) {
      const newKnowledgeBaseItem = {
        id: uploadedDoc.document_id,
        name: uploadedDoc.title,
        type: "text", // Text uploads are always type 'text'
        description: uploadedDoc.description || "",
      };

      const updatedKnowledgeBase = [
        ...(formData.knowledge_base || []),
        newKnowledgeBaseItem,
      ];

      onFormDataChange("knowledge_base", updatedKnowledgeBase);
    }

    // Close the modal
    setShowTextModal(false);
  };

  const handleAddToAgent = (documentId: string, documentName: string) => {
    try {
      setAddingToAgent(documentId);

      // Find document details to get the correct type
      const docDetails = knowledgeBaseDocs.find((doc) => doc.id === documentId);
      const docType =
        docDetails?.document_type === "text"
          ? "text"
          : docDetails?.document_type === "pdf"
          ? "pdf"
          : "document";

      // Add document to formData knowledge base (with id as per API spec)
      const updatedKnowledgeBase = [
        ...(formData.knowledge_base || []),
        {
          id: documentId,
          name: documentName,
          type: docType,
          description: docDetails?.description || "",
        },
      ];

      // Update formData instead of making API call
      onFormDataChange("knowledge_base", updatedKnowledgeBase);
    } catch (error: any) {
      console.error("Error adding document to agent:", error);
      alert("Failed to add document to agent");
    } finally {
      setAddingToAgent(null);
    }
  };

  // Check if document is already assigned to agent (check by id in formData)
  const isDocumentAssigned = (docId: string) => {
    return formData.knowledge_base?.some((kb) => kb.id === docId) || false;
  };

  // Filter documents to show only unassigned ones in library
  const unassignedDocuments = knowledgeBaseDocs.filter(
    (doc) => !isDocumentAssigned(doc.id)
  );

  const fetchFiles = async () => {
    try {
      setLoadingFiles(true);
      const response = await filesApi.listFiles();
      if (response.success) {
        setFiles(response.data);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUploadSuccess = (uploadedFile?: any) => {
    // Refresh files list so new file appears in library
    fetchFiles();

    // If file details are provided, add to selected files
    if (uploadedFile) {
      const newFileItem = {
        id: uploadedFile.id,
        file_id: uploadedFile.file_id, // From upload response, file_id should be available
        file_reference: uploadedFile.file_reference || "",
        name: uploadedFile.name || uploadedFile.real_name,
        description: uploadedFile.description || "",
        file_url: uploadedFile.file_url || "",
        file_type: uploadedFile.file_type || "document",
        file_size: uploadedFile.file_size || 0,
        real_name: uploadedFile.real_name || uploadedFile.name,
        usage_context: uploadedFile.usage_context || "",
        status: uploadedFile.status || "uploaded",
      };

      const updatedFiles = [...(formData.files || []), newFileItem];
      onFormDataChange("files", updatedFiles);
    }

    // Close the modal
    setShowFileUploadModal(false);
  };

  const handleAddFileToAgent = async (fileId: string, fileName: string) => {
    try {
      setAddingFileToAgent(fileId);

      // Find file details to get complete info
      const fileDetails = files.find((file) => file.id === fileId);
      if (!fileDetails) {
        alert("File details not found");
        return;
      }

      // Step 1: Associate file with agent via API
      // Use file_id if available from upload, otherwise use id
      const fileIdForApi = fileDetails.file_id || fileDetails.id;
      const associateResponse = await filesApi.associateFile(agent.id, {
        file_id: fileIdForApi,
      });

      if (associateResponse.success) {
        // Step 2: Add file to formData files (with correct structure for agent)
        const newFileItem = {
          id: fileDetails.id,
          file_id: fileDetails.file_id || fileDetails.id, // Use file_id if available, otherwise use id
          file_reference: fileDetails.file_reference,
          name: fileDetails.name,
          description: fileDetails.description,
          file_url: fileDetails.file_url,
          file_type: fileDetails.file_type,
          file_size: fileDetails.file_size,
          real_name: fileDetails.real_name,
          usage_context: fileDetails.usage_context,
          status: fileDetails.status || "uploaded",
        };

        const updatedFiles = [...(formData.files || []), newFileItem];
        onFormDataChange("files", updatedFiles);
      } else {
        alert("Failed to associate file with agent");
      }
    } catch (error: any) {
      console.error("Error adding file to agent:", error);
      alert(
        error.response?.data?.error?.message || "Failed to add file to agent"
      );
    } finally {
      setAddingFileToAgent(null);
    }
  };

  const handleRemoveFileFromAgent = async (fileId: string) => {
    if (!confirm("Are you sure you want to remove this file from the agent?")) {
      return;
    }

    try {
      // Find the file details to get the correct file_id
      const fileDetails = formData.files.find((file) => file.id === fileId);

      // Step 1: Remove file association via API
      // Use file_id if available, otherwise use id
      const fileIdForApi = fileDetails?.file_id || fileDetails?.id || fileId;
      const removeResponse = await filesApi.removeFileAssociation(
        agent.id,
        fileIdForApi
      );

      if (removeResponse.success) {
        // Step 2: Remove from formData files (deselect from agent)
        const updatedFiles = formData.files.filter(
          (file) => file.id !== fileId
        );
        onFormDataChange("files", updatedFiles);
      } else {
        alert("Failed to remove file association");
      }
    } catch (error: any) {
      console.error("Error removing file from agent:", error);
      alert(
        error.response?.data?.error?.message ||
          "Failed to remove file from agent"
      );
    }
  };

  const handleDeleteFileFromDatabase = async (
    fileId: string,
    fileName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${fileName}" from the file library? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      // Find the file details to get the correct file_id for deletion
      const fileDetails = files.find((file) => file.id === fileId);

      // Use file_id if available, otherwise use id
      const fileIdForApi = fileDetails?.file_id || fileDetails?.id || fileId;
      const response = await filesApi.deleteFile(fileIdForApi);
      if (response.success) {
        // Remove from formData if it was selected
        const updatedFiles = formData.files.filter(
          (file) => file.id !== fileId
        );
        onFormDataChange("files", updatedFiles);

        // Refresh files list
        fetchFiles();
      }
    } catch (error: any) {
      console.error("Error deleting file:", error);
      alert(error.response?.data?.error?.message || "Failed to delete file");
    }
  };

  // Check if file is already assigned to agent (check by id in formData)
  const isFileAssigned = (fileId: string) => {
    return formData.files?.some((file) => file.id === fileId) || false;
  };

  // Filter files to show only unassigned ones in library
  const unassignedFiles = files.filter((file) => !isFileAssigned(file.id));

  // Tool management functions
  const generateToolId = () =>
    `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const resetToolForm = () => {
    setToolName("");
    setToolDescription("");
    setToolMethod("GET");
    setToolUrl("");
    setToolHeaders({});
    setToolPathParams({});
    setToolQueryParams({});
    setToolBodyParams({});
    setNewHeaderKey("");
    setNewHeaderValue("");
    setNewParamKey("");
    setNewParamType("string");
    setNewParamDescription("");
    setNewParamRequired(false);
    setTestSuccess(null);
    setTestResponse(null);
    setTestPathParamValues({});
    setTestQueryParamValues({});
    setTestBodyParamValues({});
    setActiveToolTab("info");
    setEditingToolId(null);
  };

  const handleAddTool = () => {
    resetToolForm();
    setIsAddingTool(true);

    // Scroll to tool form to show it
    setTimeout(() => {
      toolFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 150);
  };

  const handleEditTool = (toolId: string) => {
    const tool = formData.tools.find((t) => t.id === toolId);
    if (!tool) return;

    setEditingToolId(toolId);
    setToolName(tool.name);
    setToolDescription(tool.description);
    setToolMethod(tool.api_schema.method);
    setToolUrl(tool.api_schema.url);
    setToolHeaders(tool.api_schema.request_headers || {});
    setToolPathParams(tool.api_schema.path_params_schema || {});

    // Handle query params schema
    if (tool.api_schema.query_params_schema?.properties) {
      const queryParams: Record<string, any> = {};
      Object.entries(tool.api_schema.query_params_schema.properties).forEach(
        ([key, value]) => {
          queryParams[key] = {
            type: (value as any).type || "string",
            description: (value as any).description || "",
            required:
              tool.api_schema.query_params_schema?.required?.includes(key) ||
              false,
          };
        }
      );
      setToolQueryParams(queryParams);
    } else {
      setToolQueryParams({});
    }

    // Handle body params schema
    if (tool.api_schema.request_body_schema?.properties) {
      const bodyParams: Record<string, any> = {};
      Object.entries(tool.api_schema.request_body_schema.properties).forEach(
        ([key, value]) => {
          bodyParams[key] = {
            type: (value as any).type || "string",
            description: (value as any).description || "",
            required:
              tool.api_schema.request_body_schema?.required?.includes(key) ||
              false,
          };
        }
      );
      setToolBodyParams(bodyParams);
    } else {
      setToolBodyParams({});
    }

    setIsAddingTool(true);

    // Scroll to tool form to show it
    setTimeout(() => {
      toolFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 150);
  };

  const handleSaveTool = () => {
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

    let updatedTools: Tool[];
    if (editingToolId) {
      updatedTools = formData.tools.map((tool) =>
        tool.id === editingToolId ? toolData : tool
      );
    } else {
      updatedTools = [...formData.tools, toolData];
    }

    onFormDataChange("tools", updatedTools);
    setIsAddingTool(false);
    resetToolForm();
  };

  const handleRemoveTool = (toolId: string) => {
    if (!confirm("Are you sure you want to remove this tool?")) return;

    const updatedTools = formData.tools.filter((tool) => tool.id !== toolId);
    onFormDataChange("tools", updatedTools);
  };

  // Parameter management functions
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
        const value = testPathParamValues[paramKey] || `sample_${paramKey}`;
        urlToTest = urlToTest.replace(placeholder, value);
      });

      const urlObj = new URL(urlToTest);

      // Add query parameters
      Object.keys(toolQueryParams).forEach((paramKey) => {
        const value = testQueryParamValues[paramKey] || `sample_${paramKey}`;
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
          const value = testBodyParamValues[paramKey] || `sample_${paramKey}`;
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

  // Fetch knowledge base documents and files on component mount
  useEffect(() => {
    fetchKnowledgeBaseDocs();
    fetchFiles();
  }, []);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-lg">Agent Information</CardTitle>
            <CardDescription>
              Basic details and configuration for the agent
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Agent Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="mt-1"
                placeholder="Enter agent name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Language
              </label>
              <Select
                value={formData.language}
                onValueChange={(value) => handleInputChange("language", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Indonesian (ID)</SelectItem>
                  <SelectItem value="en">English (EN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="mt-1"
                placeholder="Enter agent description (optional)"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                System Prompt
              </label>
              <Textarea
                value={formData.system_prompt}
                onChange={(e) =>
                  handleInputChange("system_prompt", e.target.value)
                }
                className="mt-1 h-52 resize-none overflow-y-auto"
                placeholder="Enter system prompt"
              />
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTextModal(true)}
              >
                <Type className="h-4 w-4 mr-2" />
                Add Text
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Library className="h-4 w-4 mr-2" />
                    Add from Library
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>
                    Document Library ({knowledgeBaseDocs.length} total,{" "}
                    {unassignedDocuments.length} available)
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {loadingKnowledgeBase ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : knowledgeBaseDocs.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {knowledgeBaseDocs.map((doc) => {
                        const isSelected = isDocumentAssigned(doc.id);
                        return (
                          <DropdownMenuItem
                            key={doc.id}
                            className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 border-l-4 border-blue-400"
                                : ""
                            }`}
                            disabled={
                              doc.status === "processing" ||
                              addingToAgent === doc.id ||
                              isSelected
                            }
                            onClick={() =>
                              !isSelected && handleAddToAgent(doc.id, doc.title)
                            }
                          >
                            <div className="flex items-center gap-2 w-full">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="font-medium truncate flex-1">
                                {doc.title}
                              </span>
                              <div className="flex items-center gap-1">
                                {isSelected && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 flex-shrink-0">
                                    Selected
                                  </span>
                                )}
                                <span
                                  className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                    doc.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : doc.status === "processing"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {doc.status}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFromDatabase(doc.id, doc.title);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 w-full">
                              {doc.document_type}
                              {doc.category && ` • ${doc.category}`}
                            </div>
                            {doc.description && (
                              <div className="text-xs text-gray-400 w-full truncate">
                                {doc.description}
                              </div>
                            )}
                            {addingToAgent === doc.id && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Adding...
                              </div>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Library className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No available documents</p>
                      <p className="text-xs">
                        All documents are already assigned
                      </p>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingKnowledgeBase ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading knowledge base...</span>
            </div>
          ) : formData.knowledge_base && formData.knowledge_base.length > 0 ? (
            <div className="space-y-3">
              {formData.knowledge_base.map((kb, index) => {
                // Find additional details from knowledge base docs by id
                const docDetails = knowledgeBaseDocs.find(
                  (doc) => doc.id === kb.id
                );

                return (
                  <div
                    key={kb.id || index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{kb.name}</span>
                        {docDetails?.status && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              docDetails.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : docDetails.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {docDetails.status}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Type: {kb.type || "document"}
                        {docDetails?.category &&
                          ` • Category: ${docDetails.category}`}
                        {docDetails?.document_type &&
                          ` • Format: ${docDetails.document_type}`}
                      </div>
                      {(kb.description || docDetails?.description) && (
                        <div className="text-xs text-gray-400 mt-1">
                          {kb.description || docDetails?.description}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFromAgent(kb.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remove from agent (deselect)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
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

      {/* File References */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File References
              </CardTitle>
              <CardDescription>
                Files that your agent can send to customers during
                conversations. Reference them in your system prompt using file
                codes.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFileUploadModal(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Library className="h-4 w-4 mr-2" />
                    Add from Library
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>
                    File Library ({files.length} total, {unassignedFiles.length}{" "}
                    available)
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {loadingFiles ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : files.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {files.map((file) => {
                        const isSelected = isFileAssigned(file.id);
                        return (
                          <DropdownMenuItem
                            key={file.id}
                            className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 border-l-4 border-blue-400"
                                : ""
                            }`}
                            disabled={
                              file.status === "processing" ||
                              addingFileToAgent === file.id ||
                              isSelected
                            }
                            onClick={async () => {
                              if (!isSelected) {
                                await handleAddFileToAgent(file.id, file.name);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="font-medium truncate flex-1">
                                {file.name}
                              </span>
                              <div className="flex items-center gap-1">
                                {isSelected && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 flex-shrink-0">
                                    Selected
                                  </span>
                                )}
                                <span
                                  className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                    file.status === "uploaded"
                                      ? "bg-green-100 text-green-800"
                                      : file.status === "processing"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {file.status}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFileFromDatabase(
                                      file.id,
                                      file.name
                                    );
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 w-full">
                              {file.file_type}
                              {file.usage_context && ` • ${file.usage_context}`}
                              • {Math.round(file.file_size / 1024)} KB
                            </div>
                            {file.description && (
                              <div className="text-xs text-gray-400 w-full truncate">
                                {file.description}
                              </div>
                            )}
                            {addingFileToAgent === file.id && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Adding...
                              </div>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Library className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No files available</p>
                      <p className="text-xs">Upload files to get started</p>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* File Reference Instructions */}
          {formData.files && formData.files.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                📋 How to Use File References:
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Use file reference codes in your system prompt to instruct the
                agent when to send files.
              </p>
              <div className="space-y-2">
                <div className="text-sm font-medium text-blue-900">
                  Available file references:
                </div>
                <div className="space-y-1">
                  {formData.files.map((file, index) => (
                    <div
                      key={file.id || `file-${index}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <code className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-mono">
                        {file.file_reference ||
                          `file-${file.name.charAt(0).toUpperCase()}`}
                      </code>
                      <span className="text-gray-600">({file.name})</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-white border border-blue-200 rounded">
                  <div className="text-xs font-medium text-blue-900 mb-1">
                    Example usage in system prompt:
                  </div>
                  <code className="text-xs text-blue-700 block whitespace-pre-wrap">
                    {formData.files.length > 0
                      ? `"When client asks about ${
                          formData.files[0]?.usage_context || "menu"
                        }, send ${
                          formData.files[0]?.file_reference ||
                          `file-${formData.files[0]?.name
                            .charAt(0)
                            .toUpperCase()}`
                        }.${
                          formData.files.length > 1
                            ? `\nFor ${
                                formData.files[1]?.usage_context || "pricing"
                              } information, send ${
                                formData.files[1]?.file_reference ||
                                `file-${formData.files[1]?.name
                                  .charAt(0)
                                  .toUpperCase()}`
                              }.`
                            : ""
                        }"`
                      : '"When client asks about the menu, send file-A. For pricing information, send file-B."'}
                  </code>
                </div>
              </div>
            </div>
          )}

          {loadingFiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading files...</span>
            </div>
          ) : formData.files && formData.files.length > 0 ? (
            <div className="space-y-3">
              {formData.files.map((file, index) => {
                // Find additional details from files list by id
                const fileDetails = files.find((f) => f.id === file.id);

                return (
                  <div
                    key={file.id || index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{file.name}</span>
                        <Badge variant="secondary">{file.file_type}</Badge>
                        {file.status && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              file.status === "uploaded"
                                ? "bg-green-100 text-green-800"
                                : file.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {file.status}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Size: {Math.round(file.file_size / 1024)} KB
                        {file.file_reference &&
                          ` • Reference: ${file.file_reference}`}
                        {file.usage_context &&
                          ` • Context: ${file.usage_context}`}
                      </div>
                      {(file.description || fileDetails?.description) && (
                        <div className="text-xs text-gray-400 mt-1">
                          {file.description || fileDetails?.description}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {file.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.file_url, "_blank")}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () =>
                          await handleRemoveFileFromAgent(file.id)
                        }
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Remove from agent (deselect)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No file references configured</p>
              <p className="text-sm mb-4">
                Add files that your agent can send to customers during
                conversations
              </p>
              <div className="max-w-md mx-auto p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  💡 How it works:
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>1. Upload files (documents, images, videos, audio)</div>
                  <div>2. Use file codes in your system prompt</div>
                  <div>
                    3. Agent automatically sends files based on customer
                    questions
                  </div>
                </div>
                <div className="mt-3 p-2 bg-white border border-gray-200 rounded text-xs">
                  <div className="font-medium text-gray-700 mb-1">Example:</div>
                  <code className="text-gray-600">
                    "When client asks about menu, send file-A"
                  </code>
                </div>
              </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTool}
              disabled={isAddingTool}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tool
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tools List */}
          {formData.tools && formData.tools.length > 0 ? (
            <div className="space-y-3 mb-6">
              {formData.tools.map((tool) => {
                const urlDisplay = (() => {
                  try {
                    const url = new URL(tool.api_schema.url);
                    return url.hostname + url.pathname;
                  } catch {
                    return tool.api_schema.url;
                  }
                })();

                return (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{tool.name}</span>
                        <Badge variant="outline">
                          {tool.api_schema.method}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {tool.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>🔗</span>
                        <span className="font-mono">{urlDisplay}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTool(tool.id!)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveTool(tool.id!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !isAddingTool && (
              <div className="text-center py-8 text-gray-500 mb-6">
                <Terminal className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No tools configured</p>
                <p className="text-sm">
                  Add webhooks and external tools to extend your agent's
                  capabilities
                </p>
              </div>
            )
          )}

          {/* Tool Configuration Form */}
          {isAddingTool && (
            <div ref={toolFormRef}>
              <ToolConfigForm
                editingToolId={editingToolId}
                onSave={(tool) => {
                  let updatedTools: Tool[];
                  if (editingToolId) {
                    updatedTools = formData.tools.map((t) =>
                      t.id === editingToolId ? tool : t
                    );
                  } else {
                    updatedTools = [...formData.tools, tool];
                  }
                  onFormDataChange("tools", updatedTools);
                  setIsAddingTool(false);
                  resetToolForm();
                }}
                onCancel={() => {
                  setIsAddingTool(false);
                  resetToolForm();
                }}
                initialData={
                  editingToolId
                    ? formData.tools.find((t) => t.id === editingToolId)
                    : undefined
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modals */}
      <KnowledgeBaseUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <KnowledgeBaseTextModal
        isOpen={showTextModal}
        agentId={agent.id}
        onClose={() => setShowTextModal(false)}
        onUploadSuccess={handleTextUploadSuccess}
      />

      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onUploadSuccess={handleFileUploadSuccess}
        agentId={agent.id}
      />
    </div>
  );
}
