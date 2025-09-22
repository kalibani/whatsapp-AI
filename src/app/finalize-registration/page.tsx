'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { setClientKeyCookie } from '@/lib/auth-utils';

export default function FinalizeRegistrationPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    finalizeRegistration();
  }, []);

  const finalizeRegistration = async () => {
    try {
      // Get post-registration data
      const postData = localStorage.getItem('postRegistrationData');
      if (!postData) {
        toast.error('No registration data found');
        router.push('/dashboard');
        return;
      }

      const data = JSON.parse(postData);

      // Save user to database
      await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: data.clerkUserId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          clientKey: data.clientKey || null,
        }),
      });

      // Set client key cookie
      if (data.clientKey) {
        setClientKeyCookie(data.clientKey);
      }

      // Clean up localStorage
      localStorage.removeItem('pendingRegistration');
      localStorage.removeItem('postRegistrationData');

      toast.success('Registration completed successfully!');
      setIsProcessing(false);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error finalizing registration:', error);
      toast.error('Failed to complete registration');
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {isProcessing ? (
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              ) : (
                <CheckCircle className="w-16 h-16 text-green-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {isProcessing ? 'Finalizing Registration' : 'Registration Complete!'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              {isProcessing ? (
                <p className="text-gray-600">
                  Setting up your account and activating your subscription...
                </p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    🎉 Your account has been created and your subscription is now active!
                  </p>
                  <Button onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}