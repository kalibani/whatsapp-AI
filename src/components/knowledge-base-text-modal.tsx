"use client";

import { useState } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
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

interface KnowledgeBaseTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  agentId?: string;
}

const CATEGORIES = [
  "FAQ",
  "Product Info",
  "Policies",
  "Documentation",
  "Guidelines",
  "Training",
  "Other",
];

export default function KnowledgeBaseTextModal({
  isOpen,
  onClose,
  onUploadSuccess,
  agentId,
}: KnowledgeBaseTextModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setDescription("");
    setCategory("");
    setError(null);
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Please enter both title and content");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const uploadData = {
        title: title.trim(),
        content: content.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        agent_id: agentId,
      };

      const response = await knowledgeBaseApi.uploadText(uploadData);

      if (response.success) {
        onUploadSuccess();
        handleClose();
      } else {
        setError("Upload failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Text upload error:", err);
      setError(
        err.response?.data?.error?.message || "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Text Content
          </DialogTitle>
          <DialogDescription>
            Add text content directly to your knowledge base. Perfect for FAQ,
            policies, or any text-based information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title (e.g., FAQ, Company Policies)"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Content *</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your text content here. You can include FAQ questions and answers, policies, guidelines, or any other text-based information that will help your AI agent respond better to customer inquiries."
                className="mt-1 h-32 resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                Characters: {content.length}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this content (optional)"
                className="mt-1 h-16 resize-none"
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

          {/* Example Content */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm font-medium text-gray-700 mb-2">
              💡 Example FAQ Content:
            </div>
            <div className="text-xs text-gray-600">
              Q: What are your business hours?
              <br />
              A: We are open Monday to Friday from 9 AM to 6 PM.
              <br />
              <br />
              Q: How can I reset my password?
              <br />
              A: Click on the "Forgot Password" link on the login page...
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
              disabled={!title.trim() || !content.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Content...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Add Text Content
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
