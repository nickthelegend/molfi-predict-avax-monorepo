/**
 * Venue display utilities
 */

import logoIconDark from "@/assets/logo-icon-dark.png";
import logoIconLight from "@/assets/logo-icon-light.png";

export function getVenueDisplayName(venue: string): string {
  const venueMap: Record<string, string> = {
    'MOLFI_NATIVE': 'Molfi',
    'POLYMARKET': 'Polymarket',
    'KALSHI': 'Kalshi',
    'LIMITLESS': 'Limitless',
  };
  
  return venueMap[venue] || venue;
}

export function getVenueImage(venue: string, theme: 'light' | 'dark' = 'light'): string | undefined {
  // Use the logo-icon assets for venue display
  const imageMap: Record<string, { light: string; dark: string }> = {
    'MOLFI_NATIVE': {
      light: logoIconLight,
      dark: logoIconDark,
    },
  };
  
  const venueImages = imageMap[venue];
  return venueImages ? venueImages[theme] : undefined;
}
