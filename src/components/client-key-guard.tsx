"use client";

import { ReactNode, useState } from "react";
import { useClientKeySetup } from "@/hooks/use-client-key-setup";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  RefreshCw,
  X,
  ExternalLink,
  TrendingUp,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientKeyGuardProps {
  children: ReactNode;
}

export function ClientKeyGuard({ children }: ClientKeyGuardProps) {
  const { isClientKeyReady, isLoading, error } = useClientKeySetup();
  const [showBanner, setShowBanner] = useState(true);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-semibold mb-2">
                    Setting up your account
                  </h3>
                  <p className="text-gray-600">
                    Please wait while we configure your API access...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show banner if there's an error or client key is not ready, but don't block the content
  const shouldShowBanner = (error || !isClientKeyReady) && showBanner;

  return (
    <>
      {shouldShowBanner && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  💰 Become a BerryLabs Reseller Partner
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  {error
                    ? "Your account is not configured for reseller features. "
                    : "Want to monetize AI solutions? "}
                  Join our Partner Program to resell WhatsApp AI agents, earn
                  commissions, and access exclusive features for your clients.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      window.open("https://berrylabs.io/mitra/daftar", "_blank")
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply for Partnership
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        "https://docs.berrylabs.io/docs/api/wa-agent/authentication#reseller-authentication",
                        "_blank"
                      )
                    }
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Learn More
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0 h-8 w-8 p-0 text-blue-700 hover:bg-blue-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Render the protected content regardless of client key status */}
      {children}
    </>
  );
}
