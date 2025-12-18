import { useState } from 'react';
import axios from 'axios';

export interface StorageInfo {
  totalDays: number;
  freeDaysRemaining: number;
  unpaidDays: number;
  daysUntilDisposal: number;
  currentFee: number;
  isExpired: boolean;
  canShip: boolean;
  status: 'free' | 'paid' | 'expired';
}

export function useStorage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payStorageFees = async (packageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/user/packages/${packageId}/pay-storage`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to pay storage fees';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    payStorageFees,
    loading,
    error
  };
}
