import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Edit, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
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

interface SoundKit {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  price: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export function SoundKitsManager() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: soundKits, isLoading, error } = useQuery({
    queryKey: ['admin-sound-kits'],
    queryFn: async (): Promise<SoundKit[]> => {
      const { data, error } = await supabase
        .from('sound_kits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const toggleActive = async (kit: SoundKit) => {
    try {
      const { error } = await supabase
        .from('sound_kits')
        .update({ is_active: !kit.is_active })
        .eq('id', kit.id);

      if (error) throw error;

      toast.success(kit.is_active ? 'Sound kit hidden' : 'Sound kit published');
      queryClient.invalidateQueries({ queryKey: ['admin-sound-kits'] });
      queryClient.invalidateQueries({ queryKey: ['sound-kits'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update sound kit');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('sound_kits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Sound kit deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-sound-kits'] });
      queryClient.invalidateQueries({ queryKey: ['sound-kits'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sound kit');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
        <p className="text-destructive">Error loading sound kits</p>
      </div>
    );
  }

  if (!soundKits || soundKits.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-12 text-center">
        <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display text-lg font-semibold mb-2">No sound kits yet</h3>
        <p className="text-muted-foreground text-sm">Upload your first sound kit to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {soundKits.map((kit) => (
        <div
          key={kit.id}
          className={`flex items-center gap-4 p-4 rounded-xl bg-card border border-border ${
            !kit.is_active ? 'opacity-60' : ''
          }`}
        >
          {kit.cover_url ? (
            <img
              src={kit.cover_url}
              alt={kit.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
              <Archive className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{kit.title}</h3>
              {!kit.is_active && (
                <span className="px-2 py-0.5 text-xs rounded bg-secondary text-muted-foreground">
                  Hidden
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {kit.category} • ${Number(kit.price).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleActive(kit)}
              title={kit.is_active ? 'Hide' : 'Publish'}
            >
              {kit.is_active ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Sound Kit</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{kit.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(kit.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingId === kit.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
