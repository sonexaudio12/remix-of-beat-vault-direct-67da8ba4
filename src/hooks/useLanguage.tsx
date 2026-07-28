import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/hooks/useTenant';

export type StoreLanguage = 'en' | 'es';

const translations = {
  en: {
    beats: 'Beats', soundKits: 'Sound Kits', licensing: 'Licensing', services: 'Services', about: 'About',
    signIn: 'Sign In', cart: 'Cart', findYourPerfect: 'Find Your Perfect', beat: 'Beat',
    browseCollection: 'Browse our collection of premium beats. Filter by genre, vibe, and tempo.',
    beatCatalog: 'Beat Catalog', filters: 'Filters', showFilters: 'Show Filters', hideFilters: 'Hide Filters',
    search: 'Search', allGenres: 'All Genres', allVibes: 'All Vibes', tempo: 'Tempo', clear: 'Clear',
    noBeats: 'No beats found', language: 'Language', quickLinks: 'Quick Links', legal: 'Legal',
  },
  es: {
    beats: 'Beats', soundKits: 'Kits de Sonido', licensing: 'Licencias', services: 'Servicios', about: 'Acerca de',
    signIn: 'Iniciar sesión', cart: 'Carrito', findYourPerfect: 'Encuentra Tu Beat', beat: 'Perfecto',
    browseCollection: 'Explora nuestra colección de beats premium. Filtra por género, estilo y tempo.',
    beatCatalog: 'Catálogo de Beats', filters: 'Filtros', showFilters: 'Mostrar filtros', hideFilters: 'Ocultar filtros',
    search: 'Buscar', allGenres: 'Todos los géneros', allVibes: 'Todos los estilos', tempo: 'Tempo', clear: 'Limpiar',
    noBeats: 'No se encontraron beats', language: 'Idioma', quickLinks: 'Enlaces rápidos', legal: 'Legal',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageContextValue {
  language: StoreLanguage;
  setLanguage: (language: StoreLanguage) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const [language, setLanguageState] = useState<StoreLanguage>('en');

  useEffect(() => {
    const tenantLanguage = tenant?.branding?.store_language;
    const defaultLanguage: StoreLanguage = tenantLanguage === 'es' ? 'es' : 'en';
    const key = `store-language-${tenant?.id || 'platform'}`;
    const savedLanguage = window.localStorage.getItem(key);
    setLanguageState(savedLanguage === 'es' || savedLanguage === 'en' ? savedLanguage : defaultLanguage);
  }, [tenant?.id, tenant?.branding]);

  const setLanguage = (nextLanguage: StoreLanguage) => {
    const key = `store-language-${tenant?.id || 'platform'}`;
    window.localStorage.setItem(key, nextLanguage);
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: TranslationKey) => translations[language][key],
  }), [language, tenant?.id]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
