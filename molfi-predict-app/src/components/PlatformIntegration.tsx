import { useEffect } from 'react';
import { usePlatform } from './PlatformProvider';
import { Button } from './ui/button';
import { Card } from './ui/card';

/**
 * Example component demonstrating platform-specific features
 * Use this pattern throughout your app to provide platform-optimized experiences
 */
export function PlatformIntegration() {
  const { farcaster, telegram, platform } = usePlatform();

  // Example: Show Telegram main button on market pages
  useEffect(() => {
    if (telegram.isTelegram) {
      telegram.mainButton.show('Quick Trade', () => {
        telegram.haptic.impact('medium');
        // Handle quick trade action
      });

      return () => {
        telegram.mainButton.hide();
      };
    }
  }, [telegram]);

  // Example: Handle Telegram back button
  useEffect(() => {
    if (telegram.isTelegram) {
      telegram.backButton.show(() => {
        telegram.haptic.impact('soft');
        window.history.back();
      });

      return () => {
        telegram.backButton.hide();
      };
    }
  }, [telegram]);

  if (platform === 'telegram') {
    return (
      <Card className="p-4 bg-telegram-bg text-telegram-text">
        <h3 className="font-bold mb-2">Telegram Mini App Mode</h3>
        {telegram.user && (
          <p className="text-sm">
            Welcome, {telegram.user.first_name}! 👋
          </p>
        )}
        <Button 
          onClick={() => {
            telegram.haptic.notification('success');
            // Your action here
          }}
          className="mt-2"
        >
          Trade with Haptic Feedback
        </Button>
      </Card>
    );
  }

  if (platform === 'farcaster') {
    return (
      <Card className="p-4">
        <h3 className="font-bold mb-2">Farcaster Frame Mode</h3>
        {farcaster.isConnected && farcaster.user ? (
          <div className="space-y-2">
            <p className="text-sm">
              Connected as @{farcaster.user.username}
            </p>
            <img 
              src={farcaster.user.pfpUrl} 
              alt="Profile" 
              className="w-12 h-12 rounded-full"
            />
            <Button onClick={farcaster.signOut}>Sign Out</Button>
          </div>
        ) : (
          <Button onClick={farcaster.signIn}>
            Sign in with Farcaster
          </Button>
        )}
      </Card>
    );
  }

  return null;
}
