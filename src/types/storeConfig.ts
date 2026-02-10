export interface ThemeConfig {
  logo: {
    url: string;
    height: number; // px
  };
  colors: {
    primary: string;       // HSL e.g. "264 67% 35%"
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    accent: string;
    muted: string;
    mutedForeground: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    containerMaxWidth: string; // e.g. "1400px"
    sectionPadding: string;   // e.g. "5rem"
    borderRadius: string;     // e.g. "0.5rem"
  };
}

export const DEFAULT_THEME: ThemeConfig = {
  logo: {
    url: '',
    height: 36,
  },
  colors: {
    primary: '264 67% 35%',
    background: '222 47% 11%',
    foreground: '210 40% 98%',
    card: '217 32% 17%',
    cardForeground: '210 40% 98%',
    accent: '228 84% 4%',
    muted: '215 16% 46%',
    mutedForeground: '210 40% 98%',
  },
  fonts: {
    heading: 'Space Grotesk',
    body: 'Inter',
  },
  spacing: {
    containerMaxWidth: '1400px',
    sectionPadding: '5rem',
    borderRadius: '0.5rem',
  },
};

export const FONT_OPTIONS = [
  'Inter',
  'Space Grotesk',
  'Montserrat',
  'Lora',
  'Cormorant Garamond',
  'IBM Plex Mono',
  'Space Mono',
];

export const COLOR_PRESETS = [
  { name: 'Purple Night', primary: '264 67% 35%', background: '222 47% 11%', foreground: '210 40% 98%' },
  { name: 'Ocean Blue', primary: '198 93% 59%', background: '220 30% 8%', foreground: '210 40% 98%' },
  { name: 'Crimson', primary: '0 72% 50%', background: '0 0% 7%', foreground: '0 0% 95%' },
  { name: 'Emerald', primary: '160 84% 39%', background: '160 20% 7%', foreground: '160 10% 95%' },
  { name: 'Gold', primary: '45 100% 51%', background: '40 15% 8%', foreground: '40 10% 95%' },
  { name: 'Minimal Light', primary: '0 0% 15%', background: '0 0% 98%', foreground: '0 0% 9%' },
];
