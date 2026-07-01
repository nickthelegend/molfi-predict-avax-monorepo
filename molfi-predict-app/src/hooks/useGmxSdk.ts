import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import { initGmxService, getGmxService, GmxService } from '@/services/gmx-sdk';
import { GMX_CONFIG } from '@/config/gmx';

export function useGmxSdk() {
  const { isConnected, getSigner } = useWallet();
  const [service, setService] = useState<GmxService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initAttemptedRef = useRef(false);

  // Initialize SDK with provider (only once)
  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const init = async () => {
      try {
        // Always start with a public RPC for read-only operations
        // This avoids rate limiting issues with wallet providers
        const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
        const svc = initGmxService(provider);
        setService(svc);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        // Silent fail - use fallback data
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  // Update signer when wallet connects (debounced)
  useEffect(() => {
    if (!isConnected || !service) return;
    
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const signer = await getSigner();
        if (signer && !cancelled) {
          service.setSigner(signer);
        }
      } catch {
        // Silently ignore - read-only mode is fine
      }
    }, 1000); // Debounce to avoid rate limiting

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isConnected, service, getSigner]);

  // Check if on correct network
  const checkNetwork = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return false;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      return Number(network.chainId) === GMX_CONFIG.chainId;
    } catch {
      return false;
    }
  }, []);

  // Switch to Arbitrum
  const switchToArbitrum = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return false;
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${GMX_CONFIG.chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${GMX_CONFIG.chainId.toString(16)}`,
              chainName: 'Arbitrum One',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://arb1.arbitrum.io/rpc'],
              blockExplorerUrls: ['https://arbiscan.io'],
            }],
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }, []);

  return {
    service,
    isInitialized,
    error,
    checkNetwork,
    switchToArbitrum,
    chainId: GMX_CONFIG.chainId,
  };
}
