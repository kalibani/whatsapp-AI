'use client';

import { ReactNode } from 'react';
import { useClientKeySetup } from '@/hooks/use-client-key-setup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientKeyGuardProps {
  children: ReactNode;
}

export function ClientKeyGuard({ children }: ClientKeyGuardProps) {
  const { isClientKeyReady, isLoading, error } = useClientKeySetup();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-semibold mb-2">Setting up your account</h3>
                  <p className="text-gray-600">Please wait while we configure your API access...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !isClientKeyReady) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                API Access Setup Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  {error || 'Unable to setup API access. Please try refreshing the page or contact support.'}
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Setup
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/dashboard/subscription'}
                    variant="default"
                  >
                    Check Subscription
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Client key is ready, render the protected content
  return <>{children}</>;
}