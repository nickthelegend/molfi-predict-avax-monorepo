# Platform Integration Guide

Predifi is now optimized for Farcaster Frames and Telegram Mini Apps!

## 🎭 Farcaster Integration

### Frame Meta Tags
All pages automatically include Farcaster Frame meta tags with:
- Rich preview images
- Interactive frame buttons
- Action handlers

### Farcaster Authentication
Use the `useFarcaster()` hook to access Farcaster user data:

```tsx
import { useFarcaster } from '@/hooks/useFarcaster';

function MyComponent() {
  const { user, isConnected, signIn, signOut } = useFarcaster();
  
  return (
    <div>
      {isConnected ? (
        <p>Welcome @{user.username}!</p>
      ) : (
        <button onClick={signIn}>Sign in with Farcaster</button>
      )}
    </div>
  );
}
```

## 📱 Telegram Mini App Integration

### Features Available
- ✅ Haptic feedback (light, medium, heavy, rigid, soft)
- ✅ Main button (floating action button)
- ✅ Back button
- ✅ Theme adaptation
- ✅ User data access
- ✅ Native UI components

### Using Telegram Features

```tsx
import { useTelegram } from '@/hooks/useTelegram';

function TradingPage() {
  const { telegram, haptic, mainButton, backButton } = useTelegram();

  useEffect(() => {
    // Show main action button
    mainButton.show('Place Trade', () => {
      haptic.impact('medium'); // Haptic feedback
      handleTrade();
    });

    // Show back button
    backButton.show(() => {
      haptic.impact('soft');
      navigate(-1);
    });

    return () => {
      mainButton.hide();
      backButton.hide();
    };
  }, []);

  return (
    <button onClick={() => haptic.notification('success')}>
      Trade with Haptic Feedback
    </button>
  );
}
```

### Haptic Feedback Types
- **Impact**: `light`, `medium`, `heavy`, `rigid`, `soft`
- **Notification**: `error`, `success`, `warning`
- **Selection**: For UI selections

## 🎨 Platform Detection

Use the `usePlatform()` hook to detect the current platform:

```tsx
import { usePlatform } from '@/components/PlatformProvider';

function AdaptiveComponent() {
  const { platform, farcaster, telegram } = usePlatform();

  if (platform === 'telegram') {
    return <TelegramOptimizedView />;
  }

  if (platform === 'farcaster') {
    return <FarcasterOptimizedView />;
  }

  return <WebView />;
}
```

## 🔧 CSS Variables for Telegram Theming

Telegram theme colors are automatically applied:
- `--tg-theme-bg-color`
- `--tg-theme-text-color`
- `--tg-theme-button-color`
- `--tg-theme-button-text-color`

Use utility classes:
- `.telegram-bg` - Background color
- `.telegram-text` - Text color
- `.telegram-button` - Button styling

## 📝 Example: Complete Integration

See `src/components/PlatformIntegration.tsx` for a complete example showing:
- Platform detection
- Farcaster authentication
- Telegram native features
- Haptic feedback
- Main/Back buttons

## 🚀 Testing

### Farcaster
1. Share your site URL on Warpcast
2. Frame preview will show automatically
3. Test frame actions

### Telegram
1. Create a bot with @BotFather
2. Set web app URL to your site
3. Open bot and launch web app
4. Test haptic feedback and buttons

## 📚 Additional Resources

- [Farcaster Frames Docs](https://docs.farcaster.xyz/developers/frames/)
- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
