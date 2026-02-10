import { useEffect } from 'react';
import { useThemeConfig } from '@/hooks/useStoreConfig';

/**
 * Applies published theme config as CSS custom properties on :root.
 * Wrap anywhere above your app shell (e.g. in App.tsx).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: theme } = useThemeConfig();

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;

    // Colors
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--card', theme.colors.card);
    root.style.setProperty('--card-foreground', theme.colors.cardForeground);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);

    // Fonts
    document.body.style.fontFamily = `'${theme.fonts.body}', system-ui, sans-serif`;
    const headingStyle = document.getElementById('theme-heading-font');
    if (headingStyle) {
      headingStyle.textContent = `h1,h2,h3,h4,h5,h6{font-family:'${theme.fonts.heading}',system-ui,sans-serif!important}`;
    } else {
      const style = document.createElement('style');
      style.id = 'theme-heading-font';
      style.textContent = `h1,h2,h3,h4,h5,h6{font-family:'${theme.fonts.heading}',system-ui,sans-serif!important}`;
      document.head.appendChild(style);
    }

    // Spacing
    root.style.setProperty('--radius', theme.spacing.borderRadius);

    return () => {
      // Cleanup is optional since we always overwrite
    };
  }, [theme]);

  return <>{children}</>;
}
