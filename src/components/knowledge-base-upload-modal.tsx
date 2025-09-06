"use client";

import { useState } from "react";
import { Upload, X, Loader2, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { knowledgeBaseApi } from "@/lib/api";

interface KnowledgeBaseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  agentId?: string;
}

const SUPPORTED_TYPES = [
  { ext: ".pdf", type: "PDF Document", mime: "application/pdf" },
  {
    ext: ".doc,.docx",
    type: "Word Document",
    mime: "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    ext: ".xls,.xlsx",
    type: "Excel Spreadsheet",
    mime: "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  { ext: ".txt", type: "Text File", mime: "text/plain" },
  { ext: ".jpg,.jpeg,.png", type: "Image (OCR)", mime: "image/jpeg,image/png" },
];

const CATEGORIES = [
  "FAQ",
  "Product Info",
  "Policies",
  "Documentation",
  "Guidelines",
  "Training",
  "Other",
];

export default function KnowledgeBaseUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  agentId,
}: KnowledgeBaseUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setError(null);
    setDragActive(false);
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (!title) {
      // Auto-populate title from filename (without extension)
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return "File size must be less than 100MB";
    }

    // Check file type
    const supportedMimes = SUPPORTED_TYPES.flatMap((type) =>
      type.mime.split(",")
    );
    if (!supportedMimes.includes(file.type)) {
      return "Unsupported file type. Please upload PDF, Word, Excel, Text, or Image files.";
    }

    return null;
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError("Please select a file and enter a title");
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const uploadData = {
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        agent_id: agentId,
      };

      const response = await knowledgeBaseApi.uploadDocument(uploadData);

      if (response.success) {
        onUploadSuccess();
        handleClose();
      } else {
        setError("Upload failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(
        err.response?.data?.error?.message || "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Knowledge Base Document
          </DialogTitle>
          <DialogDescription>
            Upload documents to enhance your agent's knowledge. Supported
            formats: PDF, Word, Excel, Text, and Images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : file
                ? "border-green-300 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <FileText className="h-8 w-8 mx-auto text-green-600" />
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="mt-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <div className="text-sm font-medium">
                  Drop your file here, or click to browse
                </div>
                <div className="text-xs text-gray-500">
                  Maximum file size: 100MB
                </div>
                <input
                  type="file"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0])
                  }
                  accept={SUPPORTED_TYPES.map((type) => type.ext).join(",")}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    asChild
                  >
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the document content (optional)"
                className="mt-1 h-20 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !title.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
