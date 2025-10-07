"use client";

import { AlertCircle, CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface QuotaExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string;
}

export default function QuotaExhaustedModal({
  isOpen,
  onClose,
  errorMessage = "Document processing quota exhausted. Please upgrade your plan or wait for quota reset.",
}: QuotaExhaustedModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push("/dashboard/subscription");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            Quota Exhausted
          </DialogTitle>
          <DialogDescription>
            You've reached your processing quota limit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Icon and Message */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-center text-gray-700">{errorMessage}</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Need more quota?</h4>
            <p className="text-sm text-blue-800">
              Upgrade your subscription plan to get:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Higher processing quota</li>
              <li>More document uploads</li>
              <li>Advanced AI features</li>
              <li>Priority support</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleUpgrade} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              View Subscription Plans
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
