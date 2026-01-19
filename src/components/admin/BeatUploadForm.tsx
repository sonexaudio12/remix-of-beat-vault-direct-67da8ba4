import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Music, 
  FileAudio, 
  Archive, 
  Image as ImageIcon,
  Loader2,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const genres = ['Hip Hop', 'Trap', 'R&B', 'Pop', 'Drill', 'Lo-Fi', 'Afrobeats', 'Reggaeton', 'Soul', 'Jazz'];
const moods = ['Energetic', 'Dark', 'Chill', 'Aggressive', 'Dreamy', 'Uplifting', 'Melancholic', 'Romantic', 'Bouncy', 'Ethereal'];

interface FileUpload {
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  path: string | null;
  error: string | null;
}

interface LicenseTier {
  enabled: boolean;
  price: string;
  includes: string[];
}

const defaultLicenseTiers: Record<string, LicenseTier> = {
  mp3: {
    enabled: true,
    price: '29.99',
    includes: ['MP3 File', 'License PDF'],
  },
  wav: {
    enabled: true,
    price: '49.99',
    includes: ['WAV File', 'MP3 File', 'License PDF'],
  },
  stems: {
    enabled: true,
    price: '99.99',
    includes: ['WAV File', 'MP3 File', 'STEMS (ZIP)', 'License PDF'],
  },
};

export function BeatUploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState('120');
  const [genre, setGenre] = useState('Hip Hop');
  const [mood, setMood] = useState('Energetic');
  const [isExclusiveAvailable, setIsExclusiveAvailable] = useState(true);
  
  const [coverImage, setCoverImage] = useState<FileUpload>({ file: null, uploading: false, uploaded: false, path: null, error: null });
  const [previewAudio, setPreviewAudio] = useState<FileUpload>({ file: null, uploading: false, uploaded: false, path: null, error: null });
  const [mp3File, setMp3File] = useState<FileUpload>({ file: null, uploading: false, uploaded: false, path: null, error: null });
  const [wavFile, setWavFile] = useState<FileUpload>({ file: null, uploading: false, uploaded: false, path: null, error: null });
  const [stemsFile, setStemsFile] = useState<FileUpload>({ file: null, uploading: false, uploaded: false, path: null, error: null });
  
  const [licenseTiers, setLicenseTiers] = useState(defaultLicenseTiers);
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

  const updateLicenseTier = (type: string, field: string, value: any) => {
    setLicenseTiers(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a beat title');
      return;
    }

    if (!coverImage.file) {
      toast.error('Please upload a cover image');
      return;
    }

    if (!previewAudio.file) {
      toast.error('Please upload a preview audio file');
      return;
    }

    // Check that at least one license tier is enabled
    const enabledTiers = Object.entries(licenseTiers).filter(([_, tier]) => tier.enabled);
    if (enabledTiers.length === 0) {
      toast.error('Please enable at least one license tier');
      return;
    }

    // Validate that files are uploaded for enabled tiers
    if (licenseTiers.mp3.enabled && !mp3File.file) {
      toast.error('Please upload an MP3 file for the MP3 license tier');
      return;
    }
    if (licenseTiers.wav.enabled && !wavFile.file) {
      toast.error('Please upload a WAV file for the WAV license tier');
      return;
    }
    if (licenseTiers.stems.enabled && !stemsFile.file) {
      toast.error('Please upload a STEMS file for the Trackout license tier');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all files
      const [coverUrl, previewUrl, mp3Path, wavPath, stemsPath] = await Promise.all([
        uploadFile(coverImage.file, 'covers', 'covers', setCoverImage),
        uploadFile(previewAudio.file, 'previews', 'previews', setPreviewAudio),
        mp3File.file ? uploadFile(mp3File.file, 'beats', 'mp3', setMp3File) : Promise.resolve(null),
        wavFile.file ? uploadFile(wavFile.file, 'beats', 'wav', setWavFile) : Promise.resolve(null),
        stemsFile.file ? uploadFile(stemsFile.file, 'beats', 'stems', setStemsFile) : Promise.resolve(null),
      ]);

      if (!coverUrl || !previewUrl) {
        throw new Error('Failed to upload required files');
      }

      // Create beat record
      const { data: beat, error: beatError } = await supabase
        .from('beats')
        .insert({
          title: title.trim(),
          bpm: parseInt(bpm),
          genre,
          mood,
          cover_url: coverUrl,
          preview_url: previewUrl,
          mp3_file_path: mp3Path,
          wav_file_path: wavPath,
          stems_file_path: stemsPath,
          is_exclusive_available: isExclusiveAvailable,
          is_active: true,
        })
        .select()
        .single();

      if (beatError) {
        throw beatError;
      }

      // Create license tiers
      const tierInserts = Object.entries(licenseTiers)
        .filter(([_, tier]) => tier.enabled)
        .map(([type, tier]) => ({
          beat_id: beat.id,
          type,
          name: type === 'mp3' ? 'MP3 Lease' : type === 'wav' ? 'WAV Lease' : 'Trackout',
          price: parseFloat(tier.price),
          includes: tier.includes,
          is_active: true,
        }));

      const { error: tiersError } = await supabase
        .from('license_tiers')
        .insert(tierInserts);

      if (tiersError) {
        throw tiersError;
      }

      toast.success('Beat uploaded successfully!');
      
      // Reset form
      setTitle('');
      setBpm('120');
      setGenre('Hip Hop');
      setMood('Energetic');
      setCoverImage({ file: null, uploading: false, uploaded: false, path: null, error: null });
      setPreviewAudio({ file: null, uploading: false, uploaded: false, path: null, error: null });
      setMp3File({ file: null, uploading: false, uploaded: false, path: null, error: null });
      setWavFile({ file: null, uploading: false, uploaded: false, path: null, error: null });
      setStemsFile({ file: null, uploading: false, uploaded: false, path: null, error: null });
      setLicenseTiers(defaultLicenseTiers);
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to upload beat');
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
        <h3 className="font-display font-semibold text-lg mb-4">Beat Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter beat title"
              className="bg-secondary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bpm">BPM *</Label>
            <Input
              id="bpm"
              type="number"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              className="bg-secondary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre *</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-secondary">
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
            <Label htmlFor="mood">Mood *</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moods.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
            <div>
              <Label htmlFor="exclusive">Exclusive Available</Label>
              <p className="text-xs text-muted-foreground">Allow exclusive licensing</p>
            </div>
            <Switch
              id="exclusive"
              checked={isExclusiveAvailable}
              onCheckedChange={setIsExclusiveAvailable}
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
            label="Preview Audio (Watermarked)"
            accept="audio/*"
            icon={Music}
            fileState={previewAudio}
            onChange={(e) => handleFileSelect(e, setPreviewAudio)}
            required
          />

          <FileUploadInput
            id="mp3"
            label="MP3 File (Sellable)"
            accept=".mp3,audio/mpeg"
            icon={Music}
            fileState={mp3File}
            onChange={(e) => handleFileSelect(e, setMp3File)}
            required={licenseTiers.mp3.enabled}
          />

          <FileUploadInput
            id="wav"
            label="WAV File"
            accept=".wav,audio/wav"
            icon={FileAudio}
            fileState={wavFile}
            onChange={(e) => handleFileSelect(e, setWavFile)}
            required={licenseTiers.wav.enabled}
          />

          <FileUploadInput
            id="stems"
            label="STEMS (ZIP)"
            accept=".zip,application/zip"
            icon={Archive}
            fileState={stemsFile}
            onChange={(e) => handleFileSelect(e, setStemsFile)}
            required={licenseTiers.stems.enabled}
          />
        </div>
      </div>

      {/* License Pricing */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-display font-semibold text-lg mb-4">License Pricing</h3>
        <div className="space-y-4">
          {/* MP3 Lease */}
          <div className={`p-4 rounded-lg border transition-colors ${
            licenseTiers.mp3.enabled ? 'border-primary/50 bg-primary/5' : 'border-border bg-secondary/50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                <span className="font-medium">MP3 Lease</span>
              </div>
              <Switch
                checked={licenseTiers.mp3.enabled}
                onCheckedChange={(checked) => updateLicenseTier('mp3', 'enabled', checked)}
              />
            </div>
            {licenseTiers.mp3.enabled && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={licenseTiers.mp3.price}
                  onChange={(e) => updateLicenseTier('mp3', 'price', e.target.value)}
                  className="w-32 bg-secondary"
                />
                <span className="text-sm text-muted-foreground">
                  Includes: MP3, License PDF
                </span>
              </div>
            )}
          </div>

          {/* WAV Lease */}
          <div className={`p-4 rounded-lg border transition-colors ${
            licenseTiers.wav.enabled ? 'border-amber-500/50 bg-amber-500/5' : 'border-border bg-secondary/50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileAudio className="h-5 w-5 text-amber-500" />
                <span className="font-medium">WAV Lease</span>
              </div>
              <Switch
                checked={licenseTiers.wav.enabled}
                onCheckedChange={(checked) => updateLicenseTier('wav', 'enabled', checked)}
              />
            </div>
            {licenseTiers.wav.enabled && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={licenseTiers.wav.price}
                  onChange={(e) => updateLicenseTier('wav', 'price', e.target.value)}
                  className="w-32 bg-secondary"
                />
                <span className="text-sm text-muted-foreground">
                  Includes: WAV, MP3, License PDF
                </span>
              </div>
            )}
          </div>

          {/* Trackout / Stems */}
          <div className={`p-4 rounded-lg border transition-colors ${
            licenseTiers.stems.enabled ? 'border-purple-500/50 bg-purple-500/5' : 'border-border bg-secondary/50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Trackout (Stems)</span>
              </div>
              <Switch
                checked={licenseTiers.stems.enabled}
                onCheckedChange={(checked) => updateLicenseTier('stems', 'enabled', checked)}
              />
            </div>
            {licenseTiers.stems.enabled && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={licenseTiers.stems.price}
                  onChange={(e) => updateLicenseTier('stems', 'price', e.target.value)}
                  className="w-32 bg-secondary"
                />
                <span className="text-sm text-muted-foreground">
                  Includes: Stems ZIP, WAV, MP3, License PDF
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          type="submit"
          variant="hero"
          size="lg"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Upload Beat
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
