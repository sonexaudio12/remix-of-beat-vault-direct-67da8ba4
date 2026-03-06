import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Beat, License } from '@/types/beat';
import { useTenant } from '@/hooks/useTenant';

interface DbCollaborator {
  id: string;
  collaborator_user_id: string;
  split_percentage: number;
  role: string;
  status: string;
}

interface DbBeat {
  id: string;
  title: string;
  bpm: number;
  genre: string;
  mood: string;
  cover_url: string | null;
  preview_url: string | null;
  is_exclusive_available: boolean;
  is_free: boolean | null;
  created_at: string;
  license_tiers: DbLicenseTier[];
  beat_collaborators?: DbCollaborator[];
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

const transformBeat = (dbBeat: DbBeat, profileMap?: Map<string, string>, isCollab?: boolean): Beat & { isFree?: boolean; isCollab?: boolean; collaborators?: { name: string; role: string }[] } => ({
  id: dbBeat.id,
  title: dbBeat.title,
  bpm: dbBeat.bpm,
  genre: dbBeat.genre,
  mood: dbBeat.mood,
  coverUrl: dbBeat.cover_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  previewUrl: dbBeat.preview_url || '',
  isExclusiveAvailable: dbBeat.is_exclusive_available,
  isFree: dbBeat.is_free || false,
  isCollab: isCollab || false,
  createdAt: new Date(dbBeat.created_at),
  licenses: dbBeat.license_tiers.map((tier): License => ({
    id: tier.id,
    type: tier.type as 'mp3' | 'wav' | 'stems',
    name: tier.name,
    price: tier.price,
    includes: tier.includes,
    color: mapLicenseColor(tier.type),
  })),
  collaborators: (dbBeat.beat_collaborators || [])
    .filter(c => c.status === 'accepted')
    .map(c => ({
      name: profileMap?.get(c.collaborator_user_id) || 'Unknown',
      role: c.role,
    })),
});

export function useBeats() {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ['beats', tenant?.id],
    queryFn: async (): Promise<Beat[]> => {
      const beatSelect = `
        id, title, bpm, genre, mood, cover_url, preview_url,
        is_exclusive_available, is_free, created_at, tenant_id,
        license_tiers ( id, type, name, price, includes ),
        beat_collaborators ( id, collaborator_user_id, split_percentage, role, status )
      `;

      // Fetch owned beats
      let ownedQuery = supabase
        .from('beats')
        .select(beatSelect)
        .eq('is_active', true);

      if (tenant?.id) {
        ownedQuery = ownedQuery.eq('tenant_id', tenant.id);
      }

      const { data: ownedData, error: ownedError } = await ownedQuery.order('created_at', { ascending: false });

      if (ownedError) {
        console.error('Error fetching owned beats:', ownedError);
        throw ownedError;
      }

      const ownedBeats = (ownedData || []) as (DbBeat & { tenant_id: string | null })[];
      const ownedBeatIds = new Set(ownedBeats.map(b => b.id));

      // Fetch collab beats: beats where this tenant's owner is an accepted collaborator
      let collabBeats: (DbBeat & { tenant_id: string | null })[] = [];
      if (tenant?.owner_user_id) {
        // First get beat IDs where this user is an accepted collaborator
        const { data: collabEntries } = await supabase
          .from('beat_collaborators')
          .select('beat_id')
          .eq('collaborator_user_id', tenant.owner_user_id)
          .eq('status', 'accepted');

        const collabBeatIds = (collabEntries || [])
          .map(c => c.beat_id)
          .filter(id => !ownedBeatIds.has(id));

        if (collabBeatIds.length > 0) {
          const { data: collabData, error: collabError } = await supabase
            .from('beats')
            .select(beatSelect)
            .in('id', collabBeatIds)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (collabError) {
            console.error('Error fetching collab beats:', collabError);
          } else {
            collabBeats = (collabData || []) as (DbBeat & { tenant_id: string | null })[];
          }
        }
      }

      // Build profile map for all collaborators
      const allCollabIds = new Set<string>();
      [...ownedBeats, ...collabBeats].forEach(b =>
        (b.beat_collaborators || []).forEach(c => allCollabIds.add(c.collaborator_user_id))
      );

      // Also add tenant owner to profile map for display
      if (tenant?.owner_user_id) {
        allCollabIds.add(tenant.owner_user_id);
      }

      // Add owners of collab beats
      const collabTenantIds = [...new Set(collabBeats.map(b => b.tenant_id).filter(Boolean))];
      let ownerProfileMap = new Map<string, string>();

      const profileMap = new Map<string, string>();
      if (allCollabIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', Array.from(allCollabIds));
        profiles?.forEach(p => profileMap.set(p.id, p.display_name || p.email || 'Unknown'));
      }

      // Transform and merge
      const transformedOwned = ownedBeats.map(b => transformBeat(b, profileMap, false));
      const transformedCollab = collabBeats.map(b => transformBeat(b, profileMap, true));

      return [...transformedOwned, ...transformedCollab];
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
          id, title, bpm, genre, mood, cover_url, preview_url,
          is_exclusive_available, is_free, created_at,
          license_tiers ( id, type, name, price, includes ),
          beat_collaborators ( id, collaborator_user_id, split_percentage, role, status )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching beat:', error);
        throw error;
      }

      if (!data) return null;

      const profileMap = new Map<string, string>();
      const collabIds = (data as DbBeat).beat_collaborators?.map(c => c.collaborator_user_id) || [];
      if (collabIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', collabIds);
        profiles?.forEach(p => profileMap.set(p.id, p.display_name || p.email || 'Unknown'));
      }

      return transformBeat(data as DbBeat, profileMap);
    },
    enabled: !!id,
  });
}
