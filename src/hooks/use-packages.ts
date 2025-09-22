import { useState, useEffect } from 'react';
import { clientApi } from '@/lib/api';

export interface Package {
  package_id: string;
  package_name: string;
  floor_price: string;
  price: string;
  partner_price: string;
  description: string;
  features: string[];
}

interface ApiResponse {
  status: string;
  data: {
    data: Package[];
    count: number;
  };
}

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const data: ApiResponse = await clientApi.getPackages();
        if (data.status === 'success' && data.data?.data) {
          setPackages(data.data.data);
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