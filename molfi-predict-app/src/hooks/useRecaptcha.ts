import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    // Check if reCAPTCHA is already loaded
    if (window.grecaptcha) {
      setIsLoaded(true);
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      const scripts = document.querySelectorAll('script[src*="recaptcha"]');
      scripts.forEach(s => s.remove());
    };
  }, [siteKey]);

  const executeRecaptcha = async (action: string): Promise<string> => {
    if (!isLoaded || !window.grecaptcha) {
      throw new Error('reCAPTCHA not loaded');
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution error:', error);
      throw error;
    }
  };

  return {
    isLoaded,
    executeRecaptcha,
  };
}
