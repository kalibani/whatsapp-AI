import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export interface CurrentSubscription {
  id: string;
  packageId: string;
  packageName: string;
  status: string;
  totalAmount: string;
  subsType: string;
  createdAt: string;
  updatedAt: string;
}

interface CurrentSubscriptionResponse {
  success: boolean;
  subscription: CurrentSubscription | null;
  message?: string;
}

export function useCurrentSubscription() {
  const { isSignedIn, isLoaded } = useAuth();
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subscription/current');

        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }

        const data: CurrentSubscriptionResponse = await response.json();

        if (data.success) {
          setSubscription(data.subscription);
        } else {
          throw new Error(data.message || 'Failed to fetch subscription');
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch subscription if user is loaded and signed in
    if (isLoaded) {
      if (isSignedIn) {
        fetchSubscription();
      } else {
        // User is not signed in, set loading to false and clear data
        setLoading(false);
        setSubscription(null);
        setError(null);
      }
    }
  }, [isLoaded, isSignedIn]);

  return { subscription, loading, error, refetch: () => window.location.reload() };
}