import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ThemeConfig, DEFAULT_THEME } from '@/types/storeConfig';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useThemeConfig() {
  return useQuery({
    queryKey: ['store-config', 'theme', 'published'],
    queryFn: async (): Promise<ThemeConfig> => {
      const { data, error } = await supabase
        .from('store_config' as any)
        .select('config_data')
        .eq('config_type', 'theme')
        .eq('is_published', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching theme config:', error);
        return DEFAULT_THEME;
      }

      if (!data) return DEFAULT_THEME;
      const row = data as any;
      return { ...DEFAULT_THEME, ...(row.config_data as Partial<ThemeConfig>) };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useThemeDraft() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['store-config', 'theme', 'draft'],
    queryFn: async (): Promise<{ config: ThemeConfig; id: string | null; version: number }> => {
      // Get latest draft or published config
      const { data, error } = await supabase
        .from('store_config' as any)
        .select('id, config_data, is_published, version')
        .eq('config_type', 'theme')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching theme draft:', error);
        return { config: DEFAULT_THEME, id: null, version: 0 };
      }

      if (!data) return { config: DEFAULT_THEME, id: null, version: 0 };
      const row = data as any;

      return {
        config: { ...DEFAULT_THEME, ...(row.config_data as Partial<ThemeConfig>) },
        id: row.id as string,
        version: row.version as number,
      };
    },
    enabled: !!user,
  });
}

export function useSaveThemeDraft() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ config, existingId, version }: { config: ThemeConfig; existingId: string | null; version: number }) => {
      if (!user) throw new Error('Not authenticated');

      if (existingId) {
        const { error } = await supabase
          .from('store_config' as any)
          .update({ config_data: JSON.parse(JSON.stringify(config)), is_published: false })
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_config' as any)
          .insert({
            user_id: user.id,
            config_type: 'theme',
            config_data: JSON.parse(JSON.stringify(config)),
            is_published: false,
            version: 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-config', 'theme'] });
      toast.success('Theme draft saved');
    },
    onError: (err: Error) => {
      toast.error('Failed to save theme: ' + err.message);
    },
  });
}

export function usePublishTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ existingId }: { existingId: string }) => {
      const { error } = await supabase
        .from('store_config' as any)
        .update({ is_published: true })
        .eq('id', existingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-config', 'theme'] });
      toast.success('Theme published!');
    },
    onError: (err: Error) => {
      toast.error('Failed to publish: ' + err.message);
    },
  });
}
