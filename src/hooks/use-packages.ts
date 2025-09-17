import { useState, useEffect } from 'react';

export interface Package {
  package_id: string;
  package_name: string;
  price: string;
  description: string;
  features: string[];
}

interface ApiResponse {
  status: string;
  data: string;
  result: {
    packages: Package[];
    addons: any[];
  };
}

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BERRYLABS_API_URL;
        const apiKey = process.env.NEXT_PUBLIC_BERRYLABS_API_KEY;
        
        if (!apiUrl) {
          throw new Error('API URL not configured');
        }

        const response = await fetch(`${apiUrl}/api/packages`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        
        const data: ApiResponse = await response.json();
        if (data.status === 'success' && data.result?.packages) {
          setPackages(data.result.packages);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
  }, []);

  return { packages, loading, error };
}