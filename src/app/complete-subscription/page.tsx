'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { clientApi } from '@/lib/api';
import { useAuth, useUser } from '@clerk/nextjs';

interface PendingSubscription {
  package_id: string;
  sub_type: 'monthly' | 'annual';
  amount: string;
  packageName: string;
  name?: string;
  phone?: string;
  email?: string;
}

export default function CompleteSubscriptionPage() {
  const [pendingSubscription, setPendingSubscription] = useState<PendingSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    // Check if user is authenticated
    if (isLoaded && !isSignedIn) {
      toast.error('Please complete email verification first');
      router.push('/sign-in');
      return;
    }

    // Get pending subscription from localStorage
    const pending = localStorage.getItem('pendingSubscription');
    if (pending) {
      try {
        const subscriptionData = JSON.parse(pending);
        setPendingSubscription(subscriptionData);
      } catch (error) {
        console.error('Error parsing pending subscription:', error);
        toast.error('Invalid subscription data');
        router.push('/dashboard/subscription');
      }
    } else {
      toast.error('No pending subscription found');
      router.push('/dashboard/subscription');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleCompleteSubscription = async () => {
    if (!pendingSubscription) {
      toast.error('No subscription data found');
      return;
    }

    if (!user) {
      toast.error('User information not available');
      return;
    }

    setIsSubscribing(true);

    try {
      // Use stored user info if available, otherwise get from Clerk user
      let userName, userPhone, userEmail;

      if (pendingSubscription.name && pendingSubscription.email) {
        // Use stored information from registration flow
        userName = pendingSubscription.name;
        userPhone = pendingSubscription.phone || '';
        userEmail = pendingSubscription.email;
      } else {
        // Fall back to Clerk user data for authenticated checkout flow
        userName = user.unsafeMetadata?.firstName && user.unsafeMetadata?.lastName
          ? `${user.unsafeMetadata.firstName} ${user.unsafeMetadata.lastName}`
          : user.fullName || 'User';
        userPhone = user.unsafeMetadata?.phone as string || '';
        userEmail = user.primaryEmailAddress?.emailAddress || '';
      }

      if (!userEmail) {
        toast.error('Email address is required');
        return;
      }

      // Call subscription API
      const response = await clientApi.createSubscriptionRegister({
        name: userName,
        phone: userPhone,
        email: userEmail,
        package_id: pendingSubscription.package_id,
        sub_type: pendingSubscription.sub_type,
      });

      // Handle successful subscription
      if (response?.data?.url) {
        toast.success('Redirecting to payment...');

        // Clear pending subscription from localStorage
        localStorage.removeItem('pendingSubscription');

        // Redirect to payment URL
        window.location.href = response?.data?.url;
      } else {
        // Fallback if no URL provided
        toast.success('Subscription created successfully!');
        localStorage.removeItem('pendingSubscription');
        router.push('/dashboard/subscription');
      }

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('pendingSubscription');
    router.push('/dashboard');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!pendingSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Created Successfully!
          </h1>
          <p className="text-gray-600">
            Your email has been verified. Now let's complete your subscription.
          </p>
        </div>

        {/* Subscription Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Complete Your Subscription</span>
              <Badge variant="outline" className="capitalize">
                {pendingSubscription.sub_type}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Package Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Selected Package</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package:</span>
                    <span className="font-medium">{pendingSubscription.packageName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Billing:</span>
                    <span className="font-medium capitalize">{pendingSubscription.sub_type}</span>
                  </div>
                  {pendingSubscription.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">Rp {parseFloat(pendingSubscription.amount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
                  🎉 Your account is ready! Click the button below to proceed to payment and activate your subscription.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCompleteSubscription}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSkip}
                  disabled={isSubscribing}
                >
                  Skip for Now (Go to Dashboard)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}