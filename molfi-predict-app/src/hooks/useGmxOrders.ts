import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGmxSdk } from './useGmxSdk';
import { useMolfiWallet, useArenaSigner } from '@/contexts/MolfiWalletContext';
import { GMX_CONFIG } from '@/config/gmx';
import { fetchGmxOrders } from '@/services/gmx-subgraph';
import type { GmxOrder, OrderParams } from '@/types/molfi-wallet';
import { toast } from 'sonner';

export function useGmxOrders(arenaWalletAddress?: string) {
  const { isInitialized } = useGmxSdk();
  const { currentArenaWallet } = useMolfiWallet();
  
  const walletAddress = arenaWalletAddress || currentArenaWallet?.address;

  return useQuery({
    queryKey: ['gmx', 'orders', walletAddress],
    queryFn: async (): Promise<GmxOrder[]> => {
      if (!walletAddress) {
        return [];
      }

      // Fetch from GMX subgraph
      return fetchGmxOrders(walletAddress);
    },
    enabled: isInitialized && !!walletAddress,
    refetchInterval: GMX_CONFIG.polling.orders,
    staleTime: 3000,
  });
}

export function useCreateOrder() {
  const { service, checkNetwork, switchToArbitrum } = useGmxSdk();
  const { getArenaSigner } = useArenaSigner();
  const { currentArenaWallet } = useMolfiWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: OrderParams) => {
      // Check network first
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        const switched = await switchToArbitrum();
        if (!switched) {
          throw new Error('Please switch to Arbitrum network to trade');
        }
      }

      const { signer, account } = await getArenaSigner();
      
      if (!service) {
        throw new Error('GMX service not initialized');
      }

      // Validate collateral
      if (!currentArenaWallet) {
        throw new Error('No arena wallet selected');
      }

      const collateralUsd = Number(params.collateralAmount) / 1e6;
      if (collateralUsd > currentArenaWallet.balance) {
        throw new Error(`Insufficient balance. Available: $${currentArenaWallet.balance.toFixed(2)}`);
      }

      if (collateralUsd < GMX_CONFIG.execution.minCollateralUsd) {
        throw new Error(`Minimum collateral is $${GMX_CONFIG.execution.minCollateralUsd}`);
      }

      service.setSigner(signer);

      if (params.side === 'long') {
        return service.createLongOrder(account, params);
      } else {
        return service.createShortOrder(account, params);
      }
    },
    onSuccess: (data, params) => {
      toast.success(`${params.side.toUpperCase()} order submitted`, {
        description: `Tx: ${data.hash.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ['gmx', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['gmx', 'positions'] });
    },
    onError: (error: Error) => {
      toast.error(`Order failed: ${error.message}`);
    },
  });
}

export function useCancelOrder() {
  const { service } = useGmxSdk();
  const { getArenaSigner } = useArenaSigner();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { signer, account } = await getArenaSigner();
      
      if (!service) {
        throw new Error('GMX service not initialized');
      }

      service.setSigner(signer);
      return service.cancelOrder(account, orderId);
    },
    onSuccess: () => {
      toast.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['gmx', 'orders'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel order: ${error.message}`);
    },
  });
}

// Estimate order before submission
export function useOrderEstimate() {
  const { service } = useGmxSdk();

  const estimate = (params: {
    marketAddress: string;
    side: 'long' | 'short';
    collateral: number;
    leverage: number;
    entryPrice: number;
  }) => {
    if (!service) {
      return null;
    }

    return service.estimatePosition(params);
  };

  return { estimate };
}

// Get pending orders count
export function usePendingOrdersCount(arenaWalletAddress?: string) {
  const { data: orders } = useGmxOrders(arenaWalletAddress);
  
  return orders?.filter((o) => o.status === 'pending').length ?? 0;
}
