import { useState, useEffect } from 'react';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const genres = ['Hip Hop', 'Trap', 'R&B', 'Pop', 'Drill', 'Lo-Fi', 'Afrobeats', 'Reggaeton', 'Soul', 'Jazz'];
const moods = ['Energetic', 'Dark', 'Chill', 'Aggressive', 'Dreamy', 'Uplifting', 'Melancholic', 'Romantic', 'Bouncy', 'Ethereal'];

interface Beat {
  id: string;
  title: string;
  bpm: number;
  genre: string;
  mood: string;
  cover_url: string | null;
  is_active: boolean;
  is_exclusive_available: boolean;
  is_free?: boolean;
  license_tiers: {
    id: string;
    type: string;
    name: string;
    price: number;
  }[];
}

interface BeatEditModalProps {
  beat: Beat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BeatEditModal({ beat, open, onOpenChange, onSuccess }: BeatEditModalProps) {
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isExclusiveAvailable, setIsExclusiveAvailable] = useState(true);
  const [isFree, setIsFree] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [licenseTiers, setLicenseTiers] = useState<Beat['license_tiers']>([]);

  useEffect(() => {
    if (beat) {
      setTitle(beat.title);
      setBpm(beat.bpm.toString());
      setGenre(beat.genre);
      setMood(beat.mood);
      setIsActive(beat.is_active);
      setIsExclusiveAvailable(beat.is_exclusive_available);
      setIsFree(beat.is_free || false);
      setCoverPreview(beat.cover_url);
      setLicenseTiers(beat.license_tiers);
      setCoverFile(null);
    }
  }, [beat]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTierPrice = (tierId: string, price: string) => {
    setLicenseTiers(prev => 
      prev.map(tier => 
        tier.id === tierId ? { ...tier, price: parseFloat(price) || 0 } : tier
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beat) return;

    setIsSubmitting(true);

    try {
      let newCoverUrl = beat.cover_url;

      // Upload new cover if selected
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `covers/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, coverFile, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);
        
        newCoverUrl = publicUrl;
      }

      // Update beat record
      const { error: beatError } = await supabase
        .from('beats')
        .update({
          title: title.trim(),
          bpm: parseInt(bpm),
          genre,
          mood,
          cover_url: newCoverUrl,
          is_active: isActive,
          is_exclusive_available: isExclusiveAvailable,
          is_free: isFree,
        })
        .eq('id', beat.id);

      if (beatError) throw beatError;

      // Update license tier prices
      for (const tier of licenseTiers) {
        const { error: tierError } = await supabase
          .from('license_tiers')
          .update({ price: tier.price })
          .eq('id', tier.id);

        if (tierError) throw tierError;
      }

      toast.success('Beat updated successfully!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update beat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Beat</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  Change Cover
                </label>
                {coverFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(beat?.cover_url || null);
                    }}
                    className="ml-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 inline" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Beat title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bpm">BPM</Label>
              <Input
                id="edit-bpm"
                type="number"
                min="60"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mood</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
              <div>
                <Label>Active (Visible in Store)</Label>
                <p className="text-xs text-muted-foreground">Show this beat in the store</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
              <div>
                <Label>Exclusive Available</Label>
                <p className="text-xs text-muted-foreground">Allow exclusive licensing</p>
              </div>
              <Switch checked={isExclusiveAvailable} onCheckedChange={setIsExclusiveAvailable} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div>
                <Label className="text-green-500">Free Download</Label>
                <p className="text-xs text-muted-foreground">Allow free download (no purchase required)</p>
              </div>
              <Switch checked={isFree} onCheckedChange={setIsFree} />
            </div>
          </div>

          {/* License Prices */}
          {licenseTiers.length > 0 && (
            <div className="space-y-3">
              <Label>License Prices</Label>
              {licenseTiers.map((tier) => (
                <div key={tier.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <span className="font-medium w-24">{tier.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tier.price}
                      onChange={(e) => updateTierPrice(tier.id, e.target.value)}
                      className="w-24"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
