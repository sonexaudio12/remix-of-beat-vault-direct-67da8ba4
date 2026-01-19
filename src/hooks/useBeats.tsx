import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Beat, License } from '@/types/beat';

interface DbBeat {
  id: string;
  title: string;
  bpm: number;
  genre: string;
  mood: string;
  cover_url: string | null;
  preview_url: string | null;
  is_exclusive_available: boolean;
  created_at: string;
  license_tiers: DbLicenseTier[];
}

interface DbLicenseTier {
  id: string;
  type: string;
  name: string;
  price: number;
  includes: string[];
}

const mapLicenseColor = (type: string): 'basic' | 'premium' | 'exclusive' => {
  switch (type) {
    case 'mp3':
      return 'basic';
    case 'wav':
      return 'premium';
    case 'stems':
      return 'exclusive';
    default:
      return 'basic';
  }
};

const transformBeat = (dbBeat: DbBeat): Beat => ({
  id: dbBeat.id,
  title: dbBeat.title,
  bpm: dbBeat.bpm,
  genre: dbBeat.genre,
  mood: dbBeat.mood,
  coverUrl: dbBeat.cover_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  previewUrl: dbBeat.preview_url || '',
  isExclusiveAvailable: dbBeat.is_exclusive_available,
  createdAt: new Date(dbBeat.created_at),
  licenses: dbBeat.license_tiers.map((tier): License => ({
    id: tier.id,
    type: tier.type as 'mp3' | 'wav' | 'stems',
    name: tier.name,
    price: tier.price,
    includes: tier.includes,
    color: mapLicenseColor(tier.type),
  })),
});

export function useBeats() {
  return useQuery({
    queryKey: ['beats'],
    queryFn: async (): Promise<Beat[]> => {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id,
          title,
          bpm,
          genre,
          mood,
          cover_url,
          preview_url,
          is_exclusive_available,
          created_at,
          license_tiers (
            id,
            type,
            name,
            price,
            includes
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching beats:', error);
        throw error;
      }

      return (data as DbBeat[]).map(transformBeat);
    },
  });
}

export function useBeat(id: string) {
  return useQuery({
    queryKey: ['beat', id],
    queryFn: async (): Promise<Beat | null> => {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id,
          title,
          bpm,
          genre,
          mood,
          cover_url,
          preview_url,
          is_exclusive_available,
          created_at,
          license_tiers (
            id,
            type,
            name,
            price,
            includes
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching beat:', error);
        throw error;
      }

      if (!data) return null;

      return transformBeat(data as DbBeat);
    },
    enabled: !!id,
  });
}
