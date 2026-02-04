import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SoundKit {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  price: number;
  category: string;
  is_active: boolean;
}

interface SoundKitEditModalProps {
  soundKit: SoundKit | null;
  open: boolean;
  onClose: () => void;
}

const categories = [
  'Drum Kit',
  'Loop Kit',
  'Sample Pack',
  'One Shots',
  'Melody Pack',
  'FX Pack',
  'Vocal Pack',
  'Other',
];

export function SoundKitEditModal({ soundKit, open, onClose }: SoundKitEditModalProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (soundKit) {
      setTitle(soundKit.title);
      setDescription(soundKit.description || '');
      setPrice(soundKit.price.toString());
      setCategory(soundKit.category);
      setCoverUrl(soundKit.cover_url || '');
      setIsActive(soundKit.is_active);
    }
  }, [soundKit]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !soundKit) return;

    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${soundKit.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName);

      setCoverUrl(urlData.publicUrl);
      toast.success('Cover uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload cover');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!soundKit) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sound_kits')
        .update({
          title,
          description: description || null,
          price: parseFloat(price),
          category,
          cover_url: coverUrl || null,
          is_active: isActive,
        })
        .eq('id', soundKit.id);

      if (error) throw error;

      toast.success('Sound kit updated');
      queryClient.invalidateQueries({ queryKey: ['admin-sound-kits'] });
      queryClient.invalidateQueries({ queryKey: ['sound-kits'] });
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update sound kit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sound Kit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="max-w-[200px]"
                />
                {uploadingCover && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploading...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is-active">Published</Label>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
