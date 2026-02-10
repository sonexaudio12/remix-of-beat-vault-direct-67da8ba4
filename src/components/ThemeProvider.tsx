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

    const ALL_VARS = [
      '--primary', '--primary-foreground',
      '--background', '--foreground',
      '--card', '--card-foreground',
      '--popover', '--popover-foreground',
      '--secondary', '--secondary-foreground',
      '--accent', '--accent-foreground',
      '--muted', '--muted-foreground',
      '--destructive', '--destructive-foreground',
      '--border', '--input', '--ring', '--radius',
    ];

    if (isAdmin || !theme) {
      ALL_VARS.forEach(v => root.style.removeProperty(v));
      document.body.style.removeProperty('font-family');
      if (headingStyle) headingStyle.textContent = '';
      return;
    }

    // Apply all color tokens
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--primary-foreground', theme.colors.primaryForeground || '204 80% 15%');
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--card', theme.colors.card);
    root.style.setProperty('--card-foreground', theme.colors.cardForeground);
    root.style.setProperty('--popover', theme.colors.popover || theme.colors.card);
    root.style.setProperty('--popover-foreground', theme.colors.popoverForeground || theme.colors.cardForeground);
    root.style.setProperty('--secondary', theme.colors.secondary || '212 26% 83%');
    root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground || '228 84% 4%');
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-foreground', theme.colors.accentForeground || '215 20% 65%');
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
    root.style.setProperty('--destructive', theme.colors.destructive || '0 84% 60%');
    root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground || '0 85% 97%');
    root.style.setProperty('--border', theme.colors.border || '215 19% 34%');
    root.style.setProperty('--input', theme.colors.input || theme.colors.border || '215 19% 34%');
    root.style.setProperty('--ring', theme.colors.ring || theme.colors.primary);
    root.style.setProperty('--radius', theme.spacing.borderRadius);

    document.body.style.fontFamily = `'${theme.fonts.body}', system-ui, sans-serif`;

    const headingCSS = `h1,h2,h3,h4,h5,h6{font-family:'${theme.fonts.heading}',system-ui,sans-serif!important}`;
    if (headingStyle) {
      headingStyle.textContent = headingCSS;
    } else {
      const style = document.createElement('style');
      style.id = 'theme-heading-font';
      style.textContent = headingCSS;
      document.head.appendChild(style);
    }

    return () => {
      ALL_VARS.forEach(v => root.style.removeProperty(v));
      document.body.style.removeProperty('font-family');
      const el = document.getElementById('theme-heading-font');
      if (el) el.textContent = '';
    };
  }, [theme, isAdmin]);

  return <>{children}</>;
}
