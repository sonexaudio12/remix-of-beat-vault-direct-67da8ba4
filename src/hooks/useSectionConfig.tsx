import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SectionConfig, DEFAULT_SECTIONS } from '@/types/sectionConfig';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useSectionsPublished() {
  return useQuery({
    queryKey: ['store-config', 'sections', 'published'],
    queryFn: async (): Promise<SectionConfig[]> => {
      const { data, error } = await supabase
        .from('store_config' as any)
        .select('config_data')
        .eq('config_type', 'sections')
        .eq('is_published', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching sections config:', error);
        return DEFAULT_SECTIONS;
      }
      if (!data) return DEFAULT_SECTIONS;
      const row = data as any;
      const sections = (row.config_data as any)?.sections;
      return Array.isArray(sections) ? sections : DEFAULT_SECTIONS;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSectionsDraft() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['store-config', 'sections', 'draft'],
    queryFn: async (): Promise<{ sections: SectionConfig[]; id: string | null; version: number }> => {
      const { data, error } = await supabase
        .from('store_config' as any)
        .select('id, config_data, is_published, version')
        .eq('config_type', 'sections')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching sections draft:', error);
        return { sections: DEFAULT_SECTIONS, id: null, version: 0 };
      }
      if (!data) return { sections: DEFAULT_SECTIONS, id: null, version: 0 };
      const row = data as any;
      const sections = (row.config_data as any)?.sections;

      return {
        sections: Array.isArray(sections) ? sections : DEFAULT_SECTIONS,
        id: row.id as string,
        version: row.version as number,
      };
    },
    enabled: !!user,
  });
}

export function useSaveSectionsDraft() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sections, existingId, version }: { sections: SectionConfig[]; existingId: string | null; version: number }) => {
      if (!user) throw new Error('Not authenticated');
      const configData = JSON.parse(JSON.stringify({ sections }));

      if (existingId) {
        const { error } = await supabase
          .from('store_config' as any)
          .update({ config_data: configData, is_published: false })
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_config' as any)
          .insert({
            user_id: user.id,
            config_type: 'sections',
            config_data: configData,
            is_published: false,
            version: 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-config', 'sections'] });
      toast.success('Sections draft saved');
    },
    onError: (err: Error) => {
      toast.error('Failed to save: ' + err.message);
    },
  });
}

export function usePublishSections() {
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
      queryClient.invalidateQueries({ queryKey: ['store-config', 'sections'] });
      toast.success('Sections published!');
    },
    onError: (err: Error) => {
      toast.error('Failed to publish: ' + err.message);
    },
  });
}
