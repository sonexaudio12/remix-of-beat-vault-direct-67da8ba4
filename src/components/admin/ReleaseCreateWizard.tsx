import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Upload, Music, Image, Store, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const STORES = ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'TikTok', 'Deezer', 'Tidal'];
const GENRES = ['Hip Hop', 'R&B', 'Pop', 'Trap', 'Lo-Fi', 'Afrobeats', 'Drill', 'Electronic', 'Soul', 'Jazz', 'Rock', 'Reggaeton', 'Latin', 'Country', 'Other'];

const STEPS = [
  { label: 'Track Info', icon: Music },
  { label: 'Upload Audio', icon: Upload },
  { label: 'Artwork', icon: Image },
  { label: 'Platforms', icon: Store },
  { label: 'Review', icon: CheckCircle2 },
];

interface ReleaseForm {
  title: string;
  artistName: string;
  featuringArtists: string;
  genre: string;
  releaseDate: string;
  isExplicit: boolean;
  isrc: string;
  audioFile: File | null;
  artworkFile: File | null;
  selectedStores: string[];
}

export function ReleaseCreateWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { tenant } = useTenant();
  const { user } = useAuth();

  const [form, setForm] = useState<ReleaseForm>({
    title: '',
    artistName: '',
    featuringArtists: '',
    genre: 'Hip Hop',
    releaseDate: new Date().toISOString().split('T')[0],
    isExplicit: false,
    isrc: '',
    audioFile: null,
    artworkFile: null,
    selectedStores: [],
  });

  const update = (patch: Partial<ReleaseForm>) => setForm(prev => ({ ...prev, ...patch }));

  const canNext = () => {
    switch (step) {
      case 0: return form.title && form.artistName && form.genre && form.releaseDate;
      case 1: return !!form.audioFile;
      case 2: return !!form.artworkFile;
      case 3: return form.selectedStores.length > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const userId = user.id;
      const tenantId = tenant?.id;

      // Upload audio
      const audioExt = form.audioFile!.name.split('.').pop();
      const audioPath = `${tenantId || 'default'}/${userId}/${Date.now()}.${audioExt}`;
      const { error: audioErr } = await supabase.storage.from('distribution').upload(audioPath, form.audioFile!);
      if (audioErr) throw audioErr;

      // Upload artwork
      const artExt = form.artworkFile!.name.split('.').pop();
      const artPath = `${tenantId || 'default'}/${userId}/${Date.now()}-cover.${artExt}`;
      const { error: artErr } = await supabase.storage.from('distribution').upload(artPath, form.artworkFile!);
      if (artErr) throw artErr;

      // Call edge function
      const { data, error } = await supabase.functions.invoke('submit-release', {
        body: {
          tenant_id: tenantId,
          title: form.title,
          artist_name: form.artistName,
          featuring_artists: form.featuringArtists || null,
          genre: form.genre,
          release_date: form.releaseDate,
          is_explicit: form.isExplicit,
          isrc: form.isrc || null,
          audio_file_url: audioPath,
          cover_art_url: artPath,
          selected_stores: form.selectedStores,
        },
      });

      if (error) throw error;
      toast.success('Release submitted successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit release');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStore = (store: string) => {
    update({
      selectedStores: form.selectedStores.includes(store)
        ? form.selectedStores.filter(s => s !== store)
        : [...form.selectedStores, store],
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Releases
        </Button>
        <h2 className="text-xl font-bold">New Release</h2>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-full justify-center transition-colors ${isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Step 0: Track Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Song Title *</Label>
                <Input value={form.title} onChange={e => update({ title: e.target.value })} placeholder="Enter song title" />
              </div>
              <div>
                <Label>Artist Name *</Label>
                <Input value={form.artistName} onChange={e => update({ artistName: e.target.value })} placeholder="Primary artist name" />
              </div>
              <div>
                <Label>Featuring Artists</Label>
                <Input value={form.featuringArtists} onChange={e => update({ featuringArtists: e.target.value })} placeholder="e.g. Artist A, Artist B" />
              </div>
              <div>
                <Label>Genre *</Label>
                <Select value={form.genre} onValueChange={v => update({ genre: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Release Date *</Label>
                <Input type="date" value={form.releaseDate} onChange={e => update({ releaseDate: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isExplicit} onCheckedChange={v => update({ isExplicit: v })} />
                <Label>Explicit Content</Label>
              </div>
              <div>
                <Label>ISRC (optional)</Label>
                <Input value={form.isrc} onChange={e => update({ isrc: e.target.value })} placeholder="e.g. USRC17607839" />
              </div>
            </div>
          )}

          {/* Step 1: Upload Audio */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Audio File</h3>
                <p className="text-sm text-muted-foreground mb-4">WAV format • 16-bit or 24-bit • 44.1kHz minimum</p>
                <Input
                  type="file"
                  accept=".wav"
                  onChange={e => update({ audioFile: e.target.files?.[0] || null })}
                  className="max-w-xs mx-auto"
                />
                {form.audioFile && (
                  <p className="mt-3 text-sm text-primary font-medium">✓ {form.audioFile.name} ({(form.audioFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Artwork */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Cover Art</h3>
                <p className="text-sm text-muted-foreground mb-4">3000×3000px recommended • JPG or PNG • No logos or URLs</p>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={e => update({ artworkFile: e.target.files?.[0] || null })}
                  className="max-w-xs mx-auto"
                />
                {form.artworkFile && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(form.artworkFile)}
                      alt="Cover preview"
                      className="w-48 h-48 object-cover rounded-lg mx-auto border"
                    />
                    <p className="mt-2 text-sm text-primary font-medium">✓ {form.artworkFile.name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Platforms */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Distribution Platforms</h3>
              <p className="text-sm text-muted-foreground">Choose where your music will be available</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {STORES.map(store => (
                  <button
                    key={store}
                    onClick={() => toggleStore(store)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
                      form.selectedStores.includes(store)
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <Checkbox checked={form.selectedStores.includes(store)} />
                    <span className="font-medium">{store}</span>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => update({ selectedStores: form.selectedStores.length === STORES.length ? [] : [...STORES] })}
              >
                {form.selectedStores.length === STORES.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review Your Release</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{form.title}</span></div>
                <div><span className="text-muted-foreground">Artist:</span> <span className="font-medium">{form.artistName}</span></div>
                {form.featuringArtists && <div><span className="text-muted-foreground">Feat:</span> <span className="font-medium">{form.featuringArtists}</span></div>}
                <div><span className="text-muted-foreground">Genre:</span> <span className="font-medium">{form.genre}</span></div>
                <div><span className="text-muted-foreground">Release Date:</span> <span className="font-medium">{form.releaseDate}</span></div>
                <div><span className="text-muted-foreground">Explicit:</span> <span className="font-medium">{form.isExplicit ? 'Yes' : 'No'}</span></div>
                {form.isrc && <div><span className="text-muted-foreground">ISRC:</span> <span className="font-medium">{form.isrc}</span></div>}
                <div><span className="text-muted-foreground">Audio:</span> <span className="font-medium">{form.audioFile?.name}</span></div>
              </div>
              {form.artworkFile && (
                <img src={URL.createObjectURL(form.artworkFile)} alt="Cover" className="w-32 h-32 object-cover rounded-lg border" />
              )}
              <div>
                <span className="text-sm text-muted-foreground">Platforms: </span>
                <span className="text-sm font-medium">{form.selectedStores.join(', ')}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onClose} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-2">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit Release
          </Button>
        )}
      </div>
    </div>
  );
}
