import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getClientKeyFromCookie, setClientKeyCookie } from "@/lib/auth-utils";

export function useClientKeySetup() {
  const { user, isLoaded } = useUser();
  const [isClientKeyReady, setIsClientKeyReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupClientKey = async () => {
      if (!isLoaded) return;

      try {
        // Check if client key already exists in cookies
        const existingClientKey = getClientKeyFromCookie();

        if (existingClientKey) {
          // Client key already exists
          setIsClientKeyReady(true);
          setIsLoading(false);
          return;
        }

        // If no client key and user is authenticated, fetch it
        if (user) {
          const response = await fetch("/api/users/get-client-key", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ clerkId: user.id }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.clientKey) {
              setClientKeyCookie(data.clientKey);
              setIsClientKeyReady(true);
            } else {
              setError("No client key found for user");
            }
          } else {
            setError("Failed to fetch client key");
          }
        } else {
          setError("User not authenticated");
        }
      } catch (err) {
        console.error("Error setting up client key:", err);
        setError("Failed to setup client key");
      } finally {
        setIsLoading(false);
      }
    };

    setupClientKey();
  }, [user, isLoaded]);

  return {
    isClientKeyReady,
    isLoading,
    error,
  };
}
