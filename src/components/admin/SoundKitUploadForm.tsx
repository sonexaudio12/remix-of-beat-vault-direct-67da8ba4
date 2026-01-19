import { useState } from 'react';
import { 
  Upload, 
  Archive, 
  Image as ImageIcon,
  Loader2,
  X,
  Check,
  AlertCircle,
  Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const categories = ['Drum Kit', 'Loop Kit', 'Sample Pack', 'One Shot Kit', 'Preset Pack', 'MIDI Kit', 'Vocal Kit'];

interface FileUpload {
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  path: string | null;
  error: string | null;
}

export function SoundKitUploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('29.99');
  const [category, setCategory] = useState('Drum Kit');
  
  const [coverImage, setCoverImage] = useState<FileUpload>({ file: null, uploading: false, uploaded: false, path: null, error: null });
  const [previewAudio, setPreviewAudio] = useState<FileUpload>({ file: null, uploading: false, uploaded: false, path: null, error: null });
  const [kitFile, setKitFile] = useState<FileUpload>({ file: null, uploading: false, uploaded: false, path: null, error: null });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileUpload>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setter({ file, uploading: false, uploaded: false, path: null, error: null });
    }
  };

  const uploadFile = async (
    file: File,
    bucket: string,
    folder: string,
    setter: React.Dispatch<React.SetStateAction<FileUpload>>
  ): Promise<string | null> => {
    setter(prev => ({ ...prev, uploading: true, error: null }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL for public buckets
      if (bucket === 'covers' || bucket === 'previews') {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
        
        setter({ file, uploading: false, uploaded: true, path: publicUrl, error: null });
        return publicUrl;
      }

      // For private buckets, store the path
      setter({ file, uploading: false, uploaded: true, path: fileName, error: null });
      return fileName;
    } catch (error: any) {
      console.error('Upload error:', error);
      setter(prev => ({ ...prev, uploading: false, error: error.message }));
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a sound kit title');
      return;
    }

    if (!coverImage.file) {
      toast.error('Please upload a cover image');
      return;
    }

    if (!kitFile.file) {
      toast.error('Please upload the sound kit file (ZIP)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all files
      const [coverUrl, previewUrl, filePath] = await Promise.all([
        uploadFile(coverImage.file, 'covers', 'soundkits', setCoverImage),
        previewAudio.file ? uploadFile(previewAudio.file, 'previews', 'soundkits', setPreviewAudio) : Promise.resolve(null),
        uploadFile(kitFile.file, 'soundkits', 'files', setKitFile),
      ]);

      if (!coverUrl || !filePath) {
        throw new Error('Failed to upload required files');
      }

      // Create sound kit record
      const { error: kitError } = await supabase
        .from('sound_kits')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          cover_url: coverUrl,
          preview_url: previewUrl,
          file_path: filePath,
          price: parseFloat(price),
          category,
          is_active: true,
        });

      if (kitError) {
        throw kitError;
      }

      toast.success('Sound kit uploaded successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('29.99');
      setCategory('Drum Kit');
      setCoverImage({ file: null, uploading: false, uploaded: false, path: null, error: null });
      setPreviewAudio({ file: null, uploading: false, uploaded: false, path: null, error: null });
      setKitFile({ file: null, uploading: false, uploaded: false, path: null, error: null });
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to upload sound kit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadInput = ({
    id,
    label,
    accept,
    icon: Icon,
    fileState,
    onChange,
    required = false,
  }: {
    id: string;
    label: string;
    accept: string;
    icon: any;
    fileState: FileUpload;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
        <label
          htmlFor={id}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            fileState.error
              ? 'border-destructive bg-destructive/10'
              : fileState.uploaded
              ? 'border-primary bg-primary/10'
              : fileState.file
              ? 'border-primary/50 bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary'
          }`}
        >
          {fileState.uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : fileState.uploaded ? (
            <Check className="h-5 w-5 text-primary" />
          ) : fileState.error ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <Icon className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm">
            {fileState.file ? fileState.file.name : `Choose ${label.toLowerCase()}`}
          </span>
          {fileState.file && !fileState.uploaded && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onChange({ target: { files: null } } as any);
              }}
              className="ml-auto p-1 hover:bg-secondary rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        {fileState.error && (
          <p className="text-xs text-destructive mt-1">{fileState.error}</p>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Sound Kit Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter sound kit title"
              className="bg-secondary"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your sound kit..."
              className="bg-secondary min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price ($) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-secondary"
              required
            />
          </div>
        </div>
      </div>

      {/* File Uploads */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Files</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FileUploadInput
            id="cover"
            label="Cover Image"
            accept="image/*"
            icon={ImageIcon}
            fileState={coverImage}
            onChange={(e) => handleFileSelect(e, setCoverImage)}
            required
          />

          <FileUploadInput
            id="preview"
            label="Preview Audio (Optional)"
            accept="audio/*"
            icon={Music}
            fileState={previewAudio}
            onChange={(e) => handleFileSelect(e, setPreviewAudio)}
          />

          <FileUploadInput
            id="kitFile"
            label="Sound Kit File (ZIP)"
            accept=".zip,application/zip"
            icon={Archive}
            fileState={kitFile}
            onChange={(e) => handleFileSelect(e, setKitFile)}
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="hero"
        size="lg"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Sound Kit
          </>
        )}
      </Button>
    </form>
  );
}
