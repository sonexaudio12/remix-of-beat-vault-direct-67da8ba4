import { useState, useEffect } from 'react';
import { Loader2, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Beat {
  id: string;
  title: string;
  bpm: number;
  genre: string;
  mood: string;
  cover_url: string | null;
  is_active: boolean;
  is_exclusive_available: boolean;
  created_at: string;
  license_tiers: {
    id: string;
    type: string;
    name: string;
    price: number;
  }[];
}

export function BeatsManager() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBeats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id,
          title,
          bpm,
          genre,
          mood,
          cover_url,
          is_active,
          is_exclusive_available,
          created_at,
          license_tiers (
            id,
            type,
            name,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBeats(data || []);
    } catch (error: any) {
      console.error('Error fetching beats:', error);
      toast.error('Failed to load beats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeats();
  }, []);

  const toggleBeatActive = async (beatId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('beats')
        .update({ is_active: !currentState })
        .eq('id', beatId);

      if (error) throw error;
      
      setBeats(prev => 
        prev.map(beat => 
          beat.id === beatId ? { ...beat, is_active: !currentState } : beat
        )
      );
      
      toast.success(currentState ? 'Beat hidden from store' : 'Beat now visible in store');
    } catch (error: any) {
      toast.error('Failed to update beat');
    }
  };

  const deleteBeat = async (beatId: string) => {
    try {
      const { error } = await supabase
        .from('beats')
        .delete()
        .eq('id', beatId);

      if (error) throw error;
      
      setBeats(prev => prev.filter(beat => beat.id !== beatId));
      toast.success('Beat deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete beat');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (beats.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-8 text-center">
        <p className="text-muted-foreground">No beats uploaded yet. Add your first beat using the Upload tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {beats.length} beat{beats.length !== 1 ? 's' : ''} total
        </p>
        <Button variant="outline" size="sm" onClick={fetchBeats}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {beats.map((beat) => (
          <div
            key={beat.id}
            className={`rounded-xl bg-card border border-border p-4 transition-opacity ${
              !beat.is_active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Cover Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {beat.cover_url ? (
                  <img
                    src={beat.cover_url}
                    alt={beat.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    ?
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{beat.title}</h3>
                  {!beat.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      Hidden
                    </span>
                  )}
                  {beat.is_exclusive_available && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                      Exclusive
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {beat.bpm} BPM • {beat.genre} • {beat.mood}
                </p>
                <div className="flex gap-2 mt-1">
                  {beat.license_tiers.map((tier) => (
                    <span
                      key={tier.id}
                      className="text-xs px-2 py-0.5 rounded bg-secondary"
                    >
                      {tier.type.toUpperCase()}: ${tier.price}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => toggleBeatActive(beat.id, beat.is_active)}
                  title={beat.is_active ? 'Hide from store' : 'Show in store'}
                >
                  {beat.is_active ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{beat.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this beat and all its license tiers. 
                        Existing orders will not be affected but download links may break.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteBeat(beat.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
