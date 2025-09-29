'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setClientKeyCookie, removeClientKeyCookie } from '@/lib/auth-utils';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Set client key cookie when user is authenticated
        fetchAndSetClientKey(user.id);
      } else {
        // Remove client key cookie when user is not authenticated (logged out or session invalid)
        removeClientKeyCookie();
      }
    }
  }, [isLoaded, user]);

  const fetchAndSetClientKey = async (clerkId: string) => {
    try {
      const response = await fetch('/api/users/get-client-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clerkId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.clientKey) {
          setClientKeyCookie(data.clientKey);
        }
      }
    } catch (error) {
      console.error('Error fetching client key:', error);
    }
  };

  return <>{children}</>;
}