import { useState, useEffect } from 'react';

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: any;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      setIsTelegram(true);
      
      // Initialize Telegram WebApp
      tg.ready();
      tg.expand();
      
      // Get user data
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Apply Telegram theme
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
      document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color);
      document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color);
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
      document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color);
    }
  }, []);

  const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      webApp?.HapticFeedback.impactOccurred(style);
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      webApp?.HapticFeedback.notificationOccurred(type);
    },
    selection: () => {
      webApp?.HapticFeedback.selectionChanged();
    }
  };

  const mainButton = {
    show: (text: string, onClick: () => void) => {
      if (webApp?.MainButton) {
        webApp.MainButton.setText(text);
        webApp.MainButton.onClick(onClick);
        webApp.MainButton.show();
      }
    },
    hide: () => {
      webApp?.MainButton.hide();
    },
    showProgress: () => {
      webApp?.MainButton.showProgress(true);
    },
    hideProgress: () => {
      webApp?.MainButton.hideProgress();
    }
  };

  const backButton = {
    show: (onClick: () => void) => {
      if (webApp?.BackButton) {
        webApp.BackButton.onClick(onClick);
        webApp.BackButton.show();
      }
    },
    hide: () => {
      webApp?.BackButton.hide();
    }
  };

  return {
    webApp,
    user,
    isTelegram,
    haptic,
    mainButton,
    backButton,
    close: () => webApp?.close(),
    openLink: (url: string) => webApp?.openLink(url)
  };
}
