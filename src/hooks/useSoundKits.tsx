import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SoundKit } from '@/types/soundKit';

export function useSoundKits() {
  return useQuery({
    queryKey: ['sound-kits'],
    queryFn: async (): Promise<SoundKit[]> => {
      const { data, error } = await supabase
        .from('sound_kits')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sound kits:', error);
        throw error;
      }

      return (data || []).map((kit) => ({
        id: kit.id,
        title: kit.title,
        description: kit.description,
        coverUrl: kit.cover_url,
        previewUrl: kit.preview_url,
        price: Number(kit.price),
        category: kit.category,
        createdAt: new Date(kit.created_at),
      }));
    },
  });
}
