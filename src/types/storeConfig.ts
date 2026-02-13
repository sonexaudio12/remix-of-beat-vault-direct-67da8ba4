export interface ThemeConfig {
  logo: {
    url: string;
    height: number;
  };
  colors: {
    primary: string;
    primaryForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    containerMaxWidth: string;
    sectionPadding: string;
    borderRadius: string;
  };
  buttons: {
    primaryRadius: string;
    primaryWeight: string;
  };
  searchPlaceholder?: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  logo: { url: '', height: 36 },
  colors: {
    primary: '198 93% 59%',
    primaryForeground: '204 80% 15%',
    background: '222 47% 11%',
    foreground: '210 40% 98%',
    card: '217 32% 17%',
    cardForeground: '210 40% 98%',
    popover: '215 24% 26%',
    popoverForeground: '210 40% 98%',
    secondary: '212 26% 83%',
    secondaryForeground: '228 84% 4%',
    accent: '228 84% 4%',
    accentForeground: '215 20% 65%',
    muted: '215 16% 46%',
    mutedForeground: '210 40% 98%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 85% 97%',
    border: '215 19% 34%',
    input: '215 19% 34%',
    ring: '198 93% 59%',
  },
  fonts: { heading: 'Space Grotesk', body: 'Inter' },
  spacing: {
    containerMaxWidth: '1400px',
    sectionPadding: '5rem',
    borderRadius: '0.5rem',
  },
  buttons: {
    primaryRadius: '0.5rem',
    primaryWeight: '600',
  },
  searchPlaceholder: 'Search beats, sound kits...',
};

export const FONT_OPTIONS = [
  'Inter',
  'Space Grotesk',
  'Montserrat',
  'Lora',
  'Cormorant Garamond',
  'IBM Plex Mono',
  'Space Mono',
  'Poppins',
  'Outfit',
  'Sora',
  'DM Sans',
  'Playfair Display',
  'Bebas Neue',
  'Raleway',
  'Archivo',
];

export const COLOR_PRESETS: {
  name: string;
  description: string;
  colors: ThemeConfig['colors'];
}[] = [
  {
    name: 'Midnight Ocean',
    description: 'Deep navy with electric cyan accents',
    colors: {
      primary: '198 93% 59%',
      primaryForeground: '204 80% 15%',
      background: '222 47% 11%',
      foreground: '210 40% 98%',
      card: '217 32% 17%',
      cardForeground: '210 40% 98%',
      popover: '215 24% 26%',
      popoverForeground: '210 40% 98%',
      secondary: '212 26% 83%',
      secondaryForeground: '228 84% 4%',
      accent: '228 84% 4%',
      accentForeground: '215 20% 65%',
      muted: '215 16% 46%',
      mutedForeground: '210 40% 98%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 85% 97%',
      border: '215 19% 34%',
      input: '215 19% 34%',
      ring: '198 93% 59%',
    },
  },
  {
    name: 'Royal Purple',
    description: 'Rich violet with deep backgrounds',
    colors: {
      primary: '264 67% 55%',
      primaryForeground: '0 0% 100%',
      background: '260 30% 8%',
      foreground: '260 10% 95%',
      card: '260 25% 13%',
      cardForeground: '260 10% 95%',
      popover: '260 20% 18%',
      popoverForeground: '260 10% 95%',
      secondary: '260 15% 25%',
      secondaryForeground: '260 10% 90%',
      accent: '280 60% 45%',
      accentForeground: '0 0% 100%',
      muted: '260 10% 40%',
      mutedForeground: '260 10% 75%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 0% 100%',
      border: '260 15% 22%',
      input: '260 15% 22%',
      ring: '264 67% 55%',
    },
  },
  {
    name: 'Crimson Fire',
    description: 'Bold red energy on dark canvas',
    colors: {
      primary: '0 72% 50%',
      primaryForeground: '0 0% 100%',
      background: '0 0% 5%',
      foreground: '0 0% 95%',
      card: '0 0% 10%',
      cardForeground: '0 0% 95%',
      popover: '0 0% 14%',
      popoverForeground: '0 0% 95%',
      secondary: '0 5% 20%',
      secondaryForeground: '0 0% 90%',
      accent: '15 80% 50%',
      accentForeground: '0 0% 100%',
      muted: '0 0% 30%',
      mutedForeground: '0 0% 70%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '0 5% 18%',
      input: '0 5% 18%',
      ring: '0 72% 50%',
    },
  },
  {
    name: 'Emerald Night',
    description: 'Lush green on dark forest tones',
    colors: {
      primary: '160 84% 39%',
      primaryForeground: '0 0% 100%',
      background: '160 20% 5%',
      foreground: '160 10% 95%',
      card: '160 15% 10%',
      cardForeground: '160 10% 95%',
      popover: '160 12% 14%',
      popoverForeground: '160 10% 95%',
      secondary: '160 10% 20%',
      secondaryForeground: '160 10% 90%',
      accent: '140 60% 40%',
      accentForeground: '0 0% 100%',
      muted: '160 8% 35%',
      mutedForeground: '160 10% 70%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 0% 100%',
      border: '160 10% 18%',
      input: '160 10% 18%',
      ring: '160 84% 39%',
    },
  },
  {
    name: 'Gold Rush',
    description: 'Warm amber and gold tones',
    colors: {
      primary: '45 100% 51%',
      primaryForeground: '40 30% 10%',
      background: '40 15% 6%',
      foreground: '40 10% 95%',
      card: '40 12% 11%',
      cardForeground: '40 10% 95%',
      popover: '40 10% 16%',
      popoverForeground: '40 10% 95%',
      secondary: '40 10% 22%',
      secondaryForeground: '40 10% 90%',
      accent: '30 80% 50%',
      accentForeground: '0 0% 100%',
      muted: '40 8% 35%',
      mutedForeground: '40 10% 70%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 0% 100%',
      border: '40 10% 18%',
      input: '40 10% 18%',
      ring: '45 100% 51%',
    },
  },
  {
    name: 'Minimal Light',
    description: 'Clean white with dark accents',
    colors: {
      primary: '0 0% 9%',
      primaryForeground: '0 0% 98%',
      background: '0 0% 98%',
      foreground: '0 0% 9%',
      card: '0 0% 100%',
      cardForeground: '0 0% 9%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 9%',
      secondary: '0 0% 93%',
      secondaryForeground: '0 0% 15%',
      accent: '0 0% 95%',
      accentForeground: '0 0% 15%',
      muted: '0 0% 80%',
      mutedForeground: '0 0% 45%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '0 0% 88%',
      input: '0 0% 88%',
      ring: '0 0% 9%',
    },
  },
  {
    name: 'Soft Lavender',
    description: 'Gentle purple tints on light base',
    colors: {
      primary: '270 60% 55%',
      primaryForeground: '0 0% 100%',
      background: '270 20% 97%',
      foreground: '270 30% 12%',
      card: '270 15% 100%',
      cardForeground: '270 30% 12%',
      popover: '270 15% 100%',
      popoverForeground: '270 30% 12%',
      secondary: '270 15% 92%',
      secondaryForeground: '270 20% 20%',
      accent: '280 50% 92%',
      accentForeground: '280 40% 30%',
      muted: '270 10% 78%',
      mutedForeground: '270 10% 45%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 0% 100%',
      border: '270 15% 88%',
      input: '270 15% 88%',
      ring: '270 60% 55%',
    },
  },
  {
    name: 'Sunset Blaze',
    description: 'Warm orange gradients on charcoal',
    colors: {
      primary: '25 95% 55%',
      primaryForeground: '0 0% 100%',
      background: '20 10% 6%',
      foreground: '20 10% 95%',
      card: '20 8% 11%',
      cardForeground: '20 10% 95%',
      popover: '20 8% 15%',
      popoverForeground: '20 10% 95%',
      secondary: '20 8% 20%',
      secondaryForeground: '20 10% 90%',
      accent: '10 90% 55%',
      accentForeground: '0 0% 100%',
      muted: '20 5% 35%',
      mutedForeground: '20 10% 70%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 0% 100%',
      border: '20 8% 18%',
      input: '20 8% 18%',
      ring: '25 95% 55%',
    },
  },
  {
    name: 'Arctic Blue',
    description: 'Cool ice blue on snow white',
    colors: {
      primary: '210 100% 50%',
      primaryForeground: '0 0% 100%',
      background: '210 30% 97%',
      foreground: '210 30% 10%',
      card: '210 20% 100%',
      cardForeground: '210 30% 10%',
      popover: '210 20% 100%',
      popoverForeground: '210 30% 10%',
      secondary: '210 20% 92%',
      secondaryForeground: '210 20% 15%',
      accent: '200 70% 92%',
      accentForeground: '200 50% 25%',
      muted: '210 15% 78%',
      mutedForeground: '210 15% 45%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: '210 20% 88%',
      input: '210 20% 88%',
      ring: '210 100% 50%',
    },
  },
  {
    name: 'Neon Pink',
    description: 'Hot pink punk energy on black',
    colors: {
      primary: '330 90% 60%',
      primaryForeground: '0 0% 100%',
      background: '300 10% 4%',
      foreground: '300 10% 96%',
      card: '300 8% 9%',
      cardForeground: '300 10% 96%',
      popover: '300 8% 13%',
      popoverForeground: '300 10% 96%',
      secondary: '300 8% 18%',
      secondaryForeground: '300 10% 90%',
      accent: '320 80% 55%',
      accentForeground: '0 0% 100%',
      muted: '300 5% 30%',
      mutedForeground: '300 10% 65%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 0% 100%',
      border: '300 8% 16%',
      input: '300 8% 16%',
      ring: '330 90% 60%',
    },
  },
  {
    name: 'Earth Tones',
    description: 'Warm browns and natural hues',
    colors: {
      primary: '30 50% 45%',
      primaryForeground: '0 0% 100%',
      background: '30 15% 95%',
      foreground: '30 20% 12%',
      card: '30 12% 100%',
      cardForeground: '30 20% 12%',
      popover: '30 12% 100%',
      popoverForeground: '30 20% 12%',
      secondary: '30 12% 90%',
      secondaryForeground: '30 15% 20%',
      accent: '25 40% 88%',
      accentForeground: '25 30% 25%',
      muted: '30 10% 75%',
      mutedForeground: '30 10% 45%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 0% 100%',
      border: '30 12% 85%',
      input: '30 12% 85%',
      ring: '30 50% 45%',
    },
  },
  {
    name: 'Cyberpunk',
    description: 'Electric teal and magenta on void',
    colors: {
      primary: '187 100% 42%',
      primaryForeground: '0 0% 0%',
      background: '240 10% 3%',
      foreground: '180 10% 95%',
      card: '240 8% 8%',
      cardForeground: '180 10% 95%',
      popover: '240 8% 12%',
      popoverForeground: '180 10% 95%',
      secondary: '300 60% 50%',
      secondaryForeground: '0 0% 100%',
      accent: '300 80% 55%',
      accentForeground: '0 0% 100%',
      muted: '240 5% 28%',
      mutedForeground: '180 10% 65%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 0% 100%',
      border: '240 8% 15%',
      input: '240 8% 15%',
      ring: '187 100% 42%',
    },
  },
];
