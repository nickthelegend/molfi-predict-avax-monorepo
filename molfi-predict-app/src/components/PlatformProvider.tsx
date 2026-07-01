import { createContext, useContext, ReactNode } from 'react';
import { useFarcaster } from '@/hooks/useFarcaster';
import { useTelegram } from '@/hooks/useTelegram';

interface PlatformContextValue {
  farcaster: ReturnType<typeof useFarcaster>;
  telegram: ReturnType<typeof useTelegram>;
  platform: 'web' | 'farcaster' | 'telegram';
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const farcaster = useFarcaster();
  const telegram = useTelegram();
  
  const platform = telegram.isTelegram 
    ? 'telegram' 
    : farcaster.isFarcaster 
    ? 'farcaster' 
    : 'web';

  return (
    <PlatformContext.Provider value={{ farcaster, telegram, platform }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider');
  }
  return context;
}
