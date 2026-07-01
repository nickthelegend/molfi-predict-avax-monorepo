import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useRouterAccount } from '@/hooks/useRouterAccount';
import { localBackend } from '@/services/local-backend';
import { supabase } from '@/integrations/supabase/db';
import { SUPPORTED_NETWORKS } from '@/config/gmx';
import type {
  ConnectedWallet,
  ArenaWallet,
  MolfiWalletContextState,
  SupportedNetwork,
} from '@/types/molfi-wallet';

const MolfiWalletContext = createContext<MolfiWalletContextState | null>(null);

export function MolfiWalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, wallet } = useWallet();

  // ── On-chain router account (UserRouter contract) ─────────────────────────
  const router = useRouterAccount();
  
  // Connected wallet state
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  
  // Protocol state — ledger balance from backend
  const [ledgerBalance, setLedgerBalance] = useState(0);
  const [ledgerBalanceLoading, setLedgerBalanceLoading] = useState(false);
  
  // Arena wallets state
  const [arenaWallets, setArenaWallets] = useState<ArenaWallet[]>([]);
  const [arenaWalletsLoading, setArenaWalletsLoading] = useState(false);
  const [currentArenaWallet, setCurrentArenaWallet] = useState<ArenaWallet | null>(null);

  // Determine wallet type from Dynamic
  useEffect(() => {
    if (isConnected && address && wallet) {
      const walletType = wallet.connector?.name?.toLowerCase().includes('embedded') ? 'aa' : 'eoa';
      const providerName = wallet.connector?.name?.toLowerCase() || 'unknown';
      
      let provider: ConnectedWallet['provider'] = 'unknown';
      if (providerName.includes('metamask')) provider = 'metamask';
      else if (providerName.includes('coinbase')) provider = 'coinbase';
      else if (providerName.includes('walletconnect')) provider = 'walletconnect';
      else if (providerName.includes('dynamic') || providerName.includes('embedded')) provider = 'dynamic';
      
      setConnectedWallet({
        address,
        type: walletType,
        provider,
      });
      // proxyAddress is now sourced from useRouterAccount
    } else {
      setConnectedWallet(null);
      setLedgerBalance(0);
      setArenaWallets([]);
      setCurrentArenaWallet(null);
    }
  }, [isConnected, address, wallet]);

  // Fetch ledger balance (prediction market internal balance)
  const refreshLedgerBalance = useCallback(async () => {
    if (!address) return;
    
    setLedgerBalanceLoading(true);
    try {
      const balance = await localBackend.getBalance(address);
      const available = typeof balance.available === 'number' ? balance.available : parseFloat(String(balance.available) || '0');
      setLedgerBalance(available);
    } catch (error) {
      // Backend may be unreachable in production — degrade gracefully
      console.warn('[MolfiWalletContext] Failed to fetch ledger balance:', error);
      setLedgerBalance(0);
    } finally {
      setLedgerBalanceLoading(false);
    }
  }, [address]);

  // Fetch arena wallets from registrations
  const refreshArenaWallets = useCallback(async () => {
    if (!address) return;
    
    setArenaWalletsLoading(true);
    try {
      // Fetch registrations with arena wallet addresses
      const { data: registrations, error } = await supabase
        .from('arena_registrations')
        .select(`
          id,
          competition_id,
          wallet_address,
          arena_wallet_address,
          status,
          deposit_amount,
          arena_competitions!inner(
            competition_number,
            status,
            competition_start,
            competition_end
          )
        `)
        .eq('wallet_address', address.toLowerCase())
        .not('arena_wallet_address', 'is', null);

      if (error) throw error;

      // Fetch performance data for each registration
      const wallets: ArenaWallet[] = await Promise.all(
        (registrations || []).map(async (reg: any) => {
          const { data: perfData } = await supabase
            .from('arena_performance')
            .select('*')
            .eq('registration_id', reg.id)
            .single();

          const competition = reg.arena_competitions;
          const isLocked = competition?.status === 'LIVE' || competition?.status === 'FINALIZED';
          
          return {
            address: reg.arena_wallet_address,
            competitionId: reg.competition_id,
            competitionNumber: competition?.competition_number || 0,
            balance: perfData?.current_balance || reg.deposit_amount || 100,
            equity: perfData?.current_balance || reg.deposit_amount || 100,
            roi: perfData?.roi_percent || 0,
            rank: 0, // Calculated from leaderboard
            initialDeposit: reg.deposit_amount || 100,
            depositsLocked: isLocked,
            isForfeited: reg.status === 'WITHDRAWN' || reg.status === 'ELIMINATED',
            status: reg.status as ArenaWallet['status'],
          };
        })
      );

      setArenaWallets(wallets);
      
      // Auto-select first active wallet
      if (wallets.length > 0 && !currentArenaWallet) {
        const activeWallet = wallets.find(w => w.status === 'ACTIVE') || wallets[0];
        setCurrentArenaWallet(activeWallet);
      }
    } catch (error) {
      console.error('Failed to fetch arena wallets:', error);
    } finally {
      setArenaWalletsLoading(false);
    }
  }, [address, currentArenaWallet]);

  // Initial fetch
  useEffect(() => {
    if (isConnected && address) {
      refreshLedgerBalance();
      refreshArenaWallets();
    }
  }, [isConnected, address, refreshLedgerBalance, refreshArenaWallets]);

  const value = useMemo<MolfiWalletContextState>(() => ({
    connectedWallet,
    isConnected: !!connectedWallet,
    // proxyAddress: the user's on-chain UserRouter (deposit address)
    proxyAddress: router.routerAddress,
    // Router account state (internal infra — not surfaced to users)
    isRouterReady: router.isReady,
    isRouterSettingUp: router.isSettingUp,
    routerUsdcBalance: router.routerUsdcBalance,
    sweepRouter: router.sweep,
    refreshRouter: router.refresh,
    ledgerBalance,
    ledgerBalanceLoading,
    arenaWallets,
    arenaWalletsLoading,
    currentArenaWallet,
    setCurrentArenaWallet,
    refreshLedgerBalance,
    refreshArenaWallets,
    supportedNetworks: SUPPORTED_NETWORKS,
  }), [
    connectedWallet,
    router.routerAddress,
    router.isReady,
    router.isSettingUp,
    router.routerUsdcBalance,
    router.sweep,
    router.refresh,
    ledgerBalance,
    ledgerBalanceLoading,
    arenaWallets,
    arenaWalletsLoading,
    currentArenaWallet,
    refreshLedgerBalance,
    refreshArenaWallets,
  ]);

  return (
    <MolfiWalletContext.Provider value={value}>
      {children}
    </MolfiWalletContext.Provider>
  );
}

export function useMolfiWallet() {
  const context = useContext(MolfiWalletContext);
  if (!context) {
    throw new Error('useMolfiWallet must be used within a MolfiWalletProvider');
  }
  return context;
}

// Helper hook to get the current signer
export function useArenaSigner() {
  const { connectedWallet, currentArenaWallet } = useMolfiWallet();
  const { getSigner } = useWallet();
  
  const getArenaSigner = useCallback(async () => {
    if (!connectedWallet || !currentArenaWallet) {
      throw new Error('No wallet connected or arena wallet selected');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Failed to get signer');
    }
    
    return {
      signer,
      account: currentArenaWallet.address,
      signerAddress: connectedWallet.address,
    };
  }, [connectedWallet, currentArenaWallet, getSigner]);
  
  return { getArenaSigner };
}
