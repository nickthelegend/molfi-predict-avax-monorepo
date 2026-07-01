import { useState, useEffect, useCallback } from 'react';
import { molfiApi, type UserBalance } from '@/services/molfi-api';
import { useWallet } from '@/hooks/useWallet';

interface UseBalanceResult {
  balance: UserBalance | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useBalance(): UseBalanceResult {
  const { address, isConnected } = useWallet();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await molfiApi.getBalance(address);
      if (response.success) {
        setBalance(response.balance);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [isConnected, address, fetchBalance]);

  return { balance, isLoading, error, refresh: fetchBalance };
}
