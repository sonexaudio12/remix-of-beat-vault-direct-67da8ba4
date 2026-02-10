import { useState, useEffect, useCallback } from 'react';
import { Upload, Palette, Type, Ruler, Eye, Save, Loader2, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeConfig, DEFAULT_THEME, FONT_OPTIONS, COLOR_PRESETS } from '@/types/storeConfig';
import { useThemeDraft, useSaveThemeDraft, usePublishTheme } from '@/hooks/useStoreConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function hslToHex(hsl: string): string {
  const parts = hsl.split(/\s+/);
  if (parts.length < 3) return '#6b21a8';
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ThemeEditor() {
  const { data: draft, isLoading } = useThemeDraft();
  const saveDraft = useSaveThemeDraft();
  const publishTheme = usePublishTheme();
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    if (draft?.config) setConfig(draft.config);
  }, [draft]);

  const update = useCallback((path: string, value: any) => {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `theme/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('covers').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path);
      update('logo.url', publicUrl);
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    saveDraft.mutate({
      config,
      existingId: draft?.id ?? null,
      version: draft?.version ?? 0,
    });
  };

  const handlePublish = () => {
    if (!draft?.id) {
      // Save first, then publish
      saveDraft.mutate(
        { config, existingId: null, version: 0 },
        {
          onSuccess: () => {
            // Re-fetch and publish
            toast.info('Saved. Click publish again to go live.');
          },
        }
      );
      return;
    }
    publishTheme.mutate({ existingId: draft.id });
  };

  const handleReset = () => {
    setConfig(DEFAULT_THEME);
    toast.info('Reset to defaults (save to apply)');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8">
      {/* Preview */}
      <div className="order-2 xl:order-1">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Live Preview</h3>
          <div className="ml-auto flex gap-1">
            {(['desktop', 'tablet', 'mobile'] as const).map(mode => (
              <Button
                key={mode}
                size="sm"
                variant={previewMode === mode ? 'default' : 'outline'}
                onClick={() => setPreviewMode(mode)}
                className="capitalize text-xs"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
        <div
          className="border border-border rounded-xl overflow-hidden mx-auto transition-all duration-300"
          style={{
            width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '100%',
            maxWidth: '100%',
          }}
        >
          <ThemePreview config={config} />
        </div>
      </div>

      {/* Editor Panel */}
      <div className="order-1 xl:order-2">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold">Theme Editor</h2>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saveDraft.isPending}>
              {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save Draft
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={publishTheme.isPending}>
              {publishTheme.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Publish
            </Button>
          </div>
        </div>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="colors"><Palette className="h-4 w-4 mr-1" /> Colors</TabsTrigger>
            <TabsTrigger value="fonts"><Type className="h-4 w-4 mr-1" /> Fonts</TabsTrigger>
            <TabsTrigger value="logo"><Upload className="h-4 w-4 mr-1" /> Logo</TabsTrigger>
            <TabsTrigger value="spacing"><Ruler className="h-4 w-4 mr-1" /> Layout</TabsTrigger>
          </TabsList>

          {/* Colors */}
          <TabsContent value="colors" className="space-y-6 mt-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Color Presets</Label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 transition-colors text-left"
                    onClick={() => {
                      update('colors.primary', preset.primary);
                      update('colors.background', preset.background);
                      update('colors.foreground', preset.foreground);
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: hslToHex(preset.primary) }}
                    />
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {[
              { key: 'colors.primary', label: 'Primary' },
              { key: 'colors.background', label: 'Background' },
              { key: 'colors.foreground', label: 'Text' },
              { key: 'colors.card', label: 'Card' },
              { key: 'colors.cardForeground', label: 'Card Text' },
              { key: 'colors.accent', label: 'Accent' },
              { key: 'colors.muted', label: 'Muted' },
              { key: 'colors.mutedForeground', label: 'Muted Text' },
            ].map(({ key, label }) => {
              const value = key.split('.').reduce((o: any, k) => o[k], config);
              return (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hslToHex(value)}
                    onChange={e => update(key, hexToHsl(e.target.value))}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <div className="flex-1">
                    <Label className="text-sm">{label}</Label>
                    <p className="text-xs text-muted-foreground font-mono">{value}</p>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Fonts */}
          <TabsContent value="fonts" className="space-y-6 mt-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Heading Font</Label>
              <Select value={config.fonts.heading} onValueChange={v => update('fonts.heading', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(f => (
                    <SelectItem key={f} value={f}>
                      <span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-2xl font-bold mt-3" style={{ fontFamily: `'${config.fonts.heading}', sans-serif` }}>
                Premium Beats for Your Next Hit
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Body Font</Label>
              <Select value={config.fonts.body} onValueChange={v => update('fonts.body', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(f => (
                    <SelectItem key={f} value={f}>
                      <span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-3" style={{ fontFamily: `'${config.fonts.body}', sans-serif` }}>
                Discover studio-quality instrumentals with instant digital delivery. Choose your license, pay once, and start creating.
              </p>
            </div>
          </TabsContent>

          {/* Logo */}
          <TabsContent value="logo" className="space-y-6 mt-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Store Logo</Label>
              {config.logo.url ? (
                <div className="rounded-lg border border-border p-4 flex flex-col items-center gap-4">
                  <img
                    src={config.logo.url}
                    alt="Store logo"
                    style={{ height: `${config.logo.height}px` }}
                    className="object-contain"
                  />
                  <Button variant="outline" size="sm" onClick={() => update('logo.url', '')}>
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload logo</span>
                  <span className="text-xs text-muted-foreground">PNG, SVG, or JPG recommended</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                  {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
                </label>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Logo Height: {config.logo.height}px</Label>
              <Slider
                value={[config.logo.height]}
                min={20}
                max={80}
                step={2}
                onValueChange={([v]) => update('logo.height', v)}
              />
            </div>
          </TabsContent>

          {/* Layout / Spacing */}
          <TabsContent value="spacing" className="space-y-6 mt-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Container Max Width</Label>
              <Select value={config.spacing.containerMaxWidth} onValueChange={v => update('spacing.containerMaxWidth', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1200px">Narrow (1200px)</SelectItem>
                  <SelectItem value="1400px">Default (1400px)</SelectItem>
                  <SelectItem value="1600px">Wide (1600px)</SelectItem>
                  <SelectItem value="100%">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Section Padding</Label>
              <Select value={config.spacing.sectionPadding} onValueChange={v => update('spacing.sectionPadding', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3rem">Compact</SelectItem>
                  <SelectItem value="5rem">Default</SelectItem>
                  <SelectItem value="7rem">Spacious</SelectItem>
                  <SelectItem value="10rem">Extra Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Border Radius: {config.spacing.borderRadius}</Label>
              <Slider
                value={[parseFloat(config.spacing.borderRadius) * 16]}
                min={0}
                max={24}
                step={2}
                onValueChange={([v]) => update('spacing.borderRadius', `${v / 16}rem`)}
              />
              <div className="flex gap-4 mt-3">
                <div className="w-16 h-16 bg-primary/20 border border-primary/30" style={{ borderRadius: config.spacing.borderRadius }} />
                <div className="flex-1 h-10 bg-primary/20 border border-primary/30" style={{ borderRadius: config.spacing.borderRadius }} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------- Live Preview Component ---------- */

function ThemePreview({ config }: { config: ThemeConfig }) {
  const bg = `hsl(${config.colors.background})`;
  const fg = `hsl(${config.colors.foreground})`;
  const primary = `hsl(${config.colors.primary})`;
  const card = `hsl(${config.colors.card})`;
  const cardFg = `hsl(${config.colors.cardForeground})`;
  const muted = `hsl(${config.colors.mutedForeground})`;

  return (
    <div style={{ backgroundColor: bg, color: fg, fontFamily: `'${config.fonts.body}', sans-serif` }} className="min-h-[500px]">
      {/* Fake Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: `hsl(${config.colors.muted} / 0.3)` }}>
        {config.logo.url ? (
          <img src={config.logo.url} alt="Logo" style={{ height: `${config.logo.height}px` }} className="object-contain" />
        ) : (
          <span className="font-bold text-lg" style={{ fontFamily: `'${config.fonts.heading}', sans-serif`, color: primary }}>
            Sonex Beats
          </span>
        )}
        <div className="flex gap-4 text-sm" style={{ color: muted }}>
          <span>Beats</span>
          <span>Services</span>
          <span>About</span>
        </div>
      </div>

      {/* Fake Hero */}
      <div className="text-center px-6" style={{ padding: `${config.spacing.sectionPadding} 1.5rem` }}>
        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: `'${config.fonts.heading}', sans-serif` }}>
          Premium Beats for <span style={{ color: primary }}>Your Next Hit</span>
        </h1>
        <p className="mb-6" style={{ color: muted }}>
          Discover studio-quality instrumentals with instant delivery.
        </p>
        <button
          className="px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: primary, borderRadius: config.spacing.borderRadius }}
        >
          Browse Beats
        </button>
      </div>

      {/* Fake Beat Cards */}
      <div className="px-6 pb-8 grid grid-cols-3 gap-3" style={{ maxWidth: config.spacing.containerMaxWidth, margin: '0 auto' }}>
        {['Night Vibes', 'Cloud Nine', 'Dark Flow'].map(title => (
          <div
            key={title}
            className="p-4 border"
            style={{
              backgroundColor: card,
              color: cardFg,
              borderRadius: config.spacing.borderRadius,
              borderColor: `hsl(${config.colors.muted} / 0.2)`,
            }}
          >
            <div className="w-full aspect-square rounded mb-3" style={{ backgroundColor: `hsl(${config.colors.muted} / 0.15)`, borderRadius: `calc(${config.spacing.borderRadius} - 4px)` }} />
            <p className="font-semibold text-sm" style={{ fontFamily: `'${config.fonts.heading}', sans-serif` }}>{title}</p>
            <p className="text-xs mt-1" style={{ color: muted }}>140 BPM · Trap</p>
            <p className="text-xs font-bold mt-2" style={{ color: primary }}>$29.99</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center text-xs border-t" style={{ borderColor: `hsl(${config.colors.muted} / 0.2)`, color: muted }}>
        Made by Sonex Studio
      </div>
    </div>
  );
}
