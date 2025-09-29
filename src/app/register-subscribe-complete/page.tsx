'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clientApi } from '@/lib/api';

interface SubscriptionData {
  packageId: string;
  billingCycle: 'monthly' | 'annual';
  userEmail: string;
  userPhone: string;
  userName: string;
}

export default function RegisterSubscribeCompletePage() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [step, setStep] = useState<'loading' | 'ready' | 'processing' | 'complete'>('loading');
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    // Get subscription data from localStorage
    const storedData = localStorage.getItem('postRegistrationSubscription');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setSubscriptionData(data);
        setStep('ready');
      } catch (error) {
        console.error('Error parsing subscription data:', error);
        toast.error('Invalid subscription data');
        router.push('/dashboard');
      }
    } else {
      toast.error('No subscription data found');
      router.push('/dashboard');
    }
  }, [router]);

  // Automatically call handleCreateAccount when both user and subscriptionData are ready
  useEffect(() => {
    if (user && subscriptionData && step === 'ready' && !isSubscribing) {
      console.log('Auto-starting account creation...');
      handleCreateAccount();
    }
  }, [user, subscriptionData, step, isSubscribing]);

  const handleCreateAccount = useCallback(async () => {
    if (!user || !subscriptionData) {
      toast.error('User information not available');
      return;
    }

    setIsSubscribing(true);
    setStep('processing');

    try {
      // Step 1: Create user in local database
      await createUserInDatabase({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || subscriptionData.userEmail,
        firstName: user.unsafeMetadata?.firstName as string,
        lastName: user.unsafeMetadata?.lastName as string,
        phone: user.unsafeMetadata?.phone as string,
      });

      // Step 2: Call external API to register + create subscription in one step
      const response = await clientApi.createSubscriptionRegister({
        name: subscriptionData.userName,
        phone: subscriptionData.userPhone,
        email: subscriptionData.userEmail,
        package_id: subscriptionData.packageId,
        sub_type: subscriptionData.billingCycle,
      });

      if (response?.data?.url) {
        // Clean up localStorage
        localStorage.removeItem('postRegistrationSubscription');

        toast.success('Account created! Redirecting to payment...');

        // Redirect to payment
        window.location.href = response.data.url;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error: any) {
      console.error('Account creation error:', error);
      toast.error(error.message || 'Failed to complete account setup');
      setStep('ready'); // Allow retry
    } finally {
      setIsSubscribing(false);
    }
  }, [user, subscriptionData, router]);

  const createUserInDatabase = async (userData: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        clientKey: null, // Will be set after external API registration
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create user in database');
    }

    return response.json();
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Verified!
          </h1>
          <p className="text-gray-600">
            Complete your subscription to get started.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Complete Setup</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionData && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-3">Your Subscription</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Package:</span>
                    <span className="font-medium ml-2">{subscriptionData.packageId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Billing:</span>
                    <span className="font-medium ml-2 capitalize">{subscriptionData.billingCycle}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium ml-2">{subscriptionData.userEmail}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              {isSubscribing && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Setting up your account and subscription...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}