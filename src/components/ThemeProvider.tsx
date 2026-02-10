import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useThemeConfig } from '@/hooks/useStoreConfig';

/**
 * Applies published theme config as CSS custom properties on :root.
 * Only applies to public storefront pages — skips /admin routes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: theme } = useThemeConfig();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const root = document.documentElement;
    const headingStyle = document.getElementById('theme-heading-font');

    // If on admin or no published theme, clean up any applied overrides
    if (isAdmin || !theme) {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--radius');
      document.body.style.removeProperty('font-family');
      if (headingStyle) headingStyle.textContent = '';
      return;
    }

    // Apply published theme to public pages
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--card', theme.colors.card);
    root.style.setProperty('--card-foreground', theme.colors.cardForeground);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
    root.style.setProperty('--radius', theme.spacing.borderRadius);

    document.body.style.fontFamily = `'${theme.fonts.body}', system-ui, sans-serif`;

    if (headingStyle) {
      headingStyle.textContent = `h1,h2,h3,h4,h5,h6{font-family:'${theme.fonts.heading}',system-ui,sans-serif!important}`;
    } else {
      const style = document.createElement('style');
      style.id = 'theme-heading-font';
      style.textContent = `h1,h2,h3,h4,h5,h6{font-family:'${theme.fonts.heading}',system-ui,sans-serif!important}`;
      document.head.appendChild(style);
    }

    return () => {
      // Clean up on unmount
      root.style.removeProperty('--primary');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--radius');
      document.body.style.removeProperty('font-family');
      const el = document.getElementById('theme-heading-font');
      if (el) el.textContent = '';
    };
  }, [theme, isAdmin]);

  return <>{children}</>;
}
