import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGmxSdk } from './useGmxSdk';
import { useMolfiWallet, useArenaSigner } from '@/contexts/MolfiWalletContext';
import { GMX_CONFIG } from '@/config/gmx';
import { fetchGmxPositions } from '@/services/gmx-subgraph';
import { useRealtimePnl } from '@/services/gmx-websocket';
import type { GmxPosition } from '@/types/molfi-wallet';
import { toast } from 'sonner';

export function useGmxPositions(arenaWalletAddress?: string) {
  const { service, isInitialized } = useGmxSdk();
  const { currentArenaWallet } = useMolfiWallet();
  
  const walletAddress = arenaWalletAddress || currentArenaWallet?.address;

  const query = useQuery({
    queryKey: ['gmx', 'positions', walletAddress],
    queryFn: async (): Promise<GmxPosition[]> => {
      if (!walletAddress) {
        return [];
      }

      // Fetch from GMX subgraph
      return fetchGmxPositions(walletAddress);
    },
    enabled: isInitialized && !!walletAddress,
    refetchInterval: GMX_CONFIG.polling.positions,
    staleTime: 5000,
  });

  // Apply real-time PnL updates via WebSocket
  const { positions: livePositions, totalPnl, totalPnlPercent, isConnected } = 
    useRealtimePnl(query.data || []);

  return {
    ...query,
    data: livePositions.length > 0 ? livePositions : query.data,
    totalPnl,
    totalPnlPercent,
    isLive: isConnected,
  };
}

export function useClosePosition() {
  const { service } = useGmxSdk();
  const { getArenaSigner } = useArenaSigner();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      positionId,
      closePercent = 100,
    }: {
      positionId: string;
      closePercent?: number;
    }) => {
      const { signer, account } = await getArenaSigner();
      
      if (!service) {
        throw new Error('GMX service not initialized');
      }

      service.setSigner(signer);
      return service.closePosition(account, positionId, closePercent);
    },
    onSuccess: (data, variables) => {
      toast.success(
        variables.closePercent === 100
          ? 'Position closed successfully'
          : `Closed ${variables.closePercent}% of position`
      );
      queryClient.invalidateQueries({ queryKey: ['gmx', 'positions'] });
      queryClient.invalidateQueries({ queryKey: ['gmx', 'orders'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to close position: ${error.message}`);
    },
  });
}

export function useAddCollateral() {
  const { service } = useGmxSdk();
  const { getArenaSigner } = useArenaSigner();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      positionId,
      amount,
    }: {
      positionId: string;
      amount: bigint;
    }) => {
      const { signer, account } = await getArenaSigner();
      
      if (!service) {
        throw new Error('GMX service not initialized');
      }

      service.setSigner(signer);
      return service.addCollateral(account, positionId, amount);
    },
    onSuccess: () => {
      toast.success('Collateral added successfully');
      queryClient.invalidateQueries({ queryKey: ['gmx', 'positions'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add collateral: ${error.message}`);
    },
  });
}

// Calculate total unrealized PnL across all positions with live data
export function useTotalUnrealizedPnl(arenaWalletAddress?: string) {
  const { data: positions, totalPnl, totalPnlPercent, isLive } = useGmxPositions(arenaWalletAddress);

  return {
    totalPnl,
    totalPnlPercent,
    positionCount: positions?.length ?? 0,
    isLive,
  };
}
