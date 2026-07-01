import { useState, useEffect } from 'react';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  custody: string;
}

export function useFarcaster() {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if running in Farcaster context
    const isFarcaster = window.location.search.includes('farcaster=true') || 
                        window.parent !== window;
    
    if (isFarcaster) {
      // Listen for Farcaster auth messages
      window.addEventListener('message', handleFarcasterMessage);
      return () => window.removeEventListener('message', handleFarcasterMessage);
    }
  }, []);

  const handleFarcasterMessage = (event: MessageEvent) => {
    if (event.data.type === 'fc:frame:auth') {
      const { fid, username, displayName, pfpUrl, custody } = event.data;
      setUser({ fid, username, displayName, pfpUrl, custody });
      setIsConnected(true);
    }
  };

  const signIn = () => {
    // Post message to parent frame to request auth
    window.parent.postMessage({
      type: 'fc:frame:requestAuth',
      data: {}
    }, '*');
  };

  const signOut = () => {
    setUser(null);
    setIsConnected(false);
  };

  return {
    user,
    isConnected,
    signIn,
    signOut,
    isFarcaster: isConnected
  };
}
