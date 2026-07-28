import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types/beat';
import { StoreLanguage } from '@/hooks/useLanguage';

export function useLocalizedBeats(beats: Beat[], tenantId: string | undefined, language: StoreLanguage) {
  const { data: translations = [] } = useQuery({
    queryKey: ['beat-translations', tenantId, language],
    enabled: !!tenantId && language === 'es',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_content_translations' as any)
        .select('source_id, field, translated_text')
        .eq('tenant_id', tenantId!)
        .eq('locale', 'es')
        .eq('source_type', 'beat');
      if (error) throw error;
      return data as Array<{ source_id: string; field: 'title' | 'genre' | 'mood'; translated_text: string }>;
    },
  });

  if (language !== 'es') return beats;

  const values = new Map<string, Partial<Record<'title' | 'genre' | 'mood', string>>>();
  translations.forEach((translation) => {
    values.set(translation.source_id, { ...values.get(translation.source_id), [translation.field]: translation.translated_text });
  });

  return beats.map((beat) => ({ ...beat, ...values.get(beat.id) }));
}
