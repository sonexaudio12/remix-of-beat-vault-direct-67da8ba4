import { useState, useEffect, useCallback } from 'react';
import { Upload, Palette, Type, Ruler, Eye, Save, Loader2, Check, RotateCcw, Sparkles } from 'lucide-react';
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

/* ---- Color Swatch ---- */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={hslToHex(value)}
        onChange={e => onChange(hexToHsl(e.target.value))}
        className="w-9 h-9 rounded-lg border border-border cursor-pointer flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <Label className="text-xs">{label}</Label>
        <p className="text-[10px] text-muted-foreground font-mono truncate">{value}</p>
      </div>
    </div>
  );
}

export function ThemeEditor() {
  const { data: draft, isLoading } = useThemeDraft();
  const saveDraft = useSaveThemeDraft();
  const publishTheme = usePublishTheme();
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    if (draft?.config) setConfig(draft.config as ThemeConfig);
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

  const applyPreset = (preset: typeof COLOR_PRESETS[number]) => {
    setConfig(prev => ({ ...prev, colors: { ...prev.colors, ...preset.colors } }));
    setShowPresets(false);
    toast.success(`Applied "${preset.name}" theme`);
  };

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
    saveDraft.mutate({ config, existingId: draft?.id ?? null, version: draft?.version ?? 0 });
  };

  const handlePublish = () => {
    if (!draft?.id) {
      saveDraft.mutate(
        { config, existingId: null, version: 0 },
        { onSuccess: () => toast.info('Saved. Click publish again to go live.') }
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

  const COLOR_GROUPS: { title: string; items: { key: string; label: string }[] }[] = [
    {
      title: 'Core',
      items: [
        { key: 'colors.primary', label: 'Primary' },
        { key: 'colors.primaryForeground', label: 'Primary Text' },
        { key: 'colors.background', label: 'Background' },
        { key: 'colors.foreground', label: 'Text' },
      ],
    },
    {
      title: 'Cards & Popovers',
      items: [
        { key: 'colors.card', label: 'Card' },
        { key: 'colors.cardForeground', label: 'Card Text' },
        { key: 'colors.popover', label: 'Popover' },
        { key: 'colors.popoverForeground', label: 'Popover Text' },
      ],
    },
    {
      title: 'Secondary & Accent',
      items: [
        { key: 'colors.secondary', label: 'Secondary' },
        { key: 'colors.secondaryForeground', label: 'Secondary Text' },
        { key: 'colors.accent', label: 'Accent' },
        { key: 'colors.accentForeground', label: 'Accent Text' },
      ],
    },
    {
      title: 'Muted & Borders',
      items: [
        { key: 'colors.muted', label: 'Muted' },
        { key: 'colors.mutedForeground', label: 'Muted Text' },
        { key: 'colors.border', label: 'Border' },
        { key: 'colors.input', label: 'Input Border' },
        { key: 'colors.ring', label: 'Focus Ring' },
      ],
    },
    {
      title: 'Destructive',
      items: [
        { key: 'colors.destructive', label: 'Destructive' },
        { key: 'colors.destructiveForeground', label: 'Destructive Text' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-8">
      {/* Preview */}
      <div className="order-2 xl:order-1">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Live Preview</h3>
          <div className="ml-auto flex gap-1">
            {(['desktop', 'tablet', 'mobile'] as const).map(mode => (
              <Button key={mode} size="sm" variant={previewMode === mode ? 'default' : 'outline'} onClick={() => setPreviewMode(mode)} className="capitalize text-xs">
                {mode}
              </Button>
            ))}
          </div>
        </div>
        <div
          className="border border-border rounded-xl overflow-hidden mx-auto transition-all duration-300"
          style={{ width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '100%', maxWidth: '100%' }}
        >
          <ThemePreview config={config} />
        </div>
      </div>

      {/* Editor Panel */}
      <div className="order-1 xl:order-2">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold">Theme Editor</h2>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saveDraft.isPending}>
              {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save Draft
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={publishTheme.isPending}>
              {publishTheme.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} Publish
            </Button>
          </div>
        </div>

        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="presets"><Sparkles className="h-4 w-4 mr-1" /> Presets</TabsTrigger>
            <TabsTrigger value="colors"><Palette className="h-4 w-4 mr-1" /> Colors</TabsTrigger>
            <TabsTrigger value="fonts"><Type className="h-4 w-4 mr-1" /> Fonts</TabsTrigger>
            <TabsTrigger value="logo"><Upload className="h-4 w-4 mr-1" /> Logo</TabsTrigger>
            <TabsTrigger value="spacing"><Ruler className="h-4 w-4 mr-1" /> Layout</TabsTrigger>
          </TabsList>

          {/* Presets */}
          <TabsContent value="presets" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Pick a preset to start, then fine-tune individual colors.</p>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  className="text-left p-3 rounded-xl border border-border hover:border-primary/50 transition-all group"
                  onClick={() => applyPreset(preset)}
                >
                  <div className="flex gap-1.5 mb-2">
                    {[preset.colors.primary, preset.colors.background, preset.colors.accent, preset.colors.card].map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-border/50" style={{ backgroundColor: hslToHex(c) }} />
                    ))}
                  </div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{preset.name}</p>
                  <p className="text-[11px] text-muted-foreground">{preset.description}</p>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Colors - grouped */}
          <TabsContent value="colors" className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {COLOR_GROUPS.map(group => (
              <div key={group.title}>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">{group.title}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {group.items.map(({ key, label }) => {
                    const value = key.split('.').reduce((o: any, k) => o?.[k], config) || '0 0% 0%';
                    return <ColorField key={key} label={label} value={value} onChange={v => update(key, v)} />;
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Fonts */}
          <TabsContent value="fonts" className="space-y-6 mt-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Heading Font</Label>
              <Select value={config.fonts.heading} onValueChange={v => update('fonts.heading', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(f => (
                    <SelectItem key={f} value={f}><span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-2xl font-bold mt-3" style={{ fontFamily: `'${config.fonts.heading}', sans-serif` }}>Premium Beats for Your Next Hit</p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Body Font</Label>
              <Select value={config.fonts.body} onValueChange={v => update('fonts.body', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(f => (
                    <SelectItem key={f} value={f}><span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-3" style={{ fontFamily: `'${config.fonts.body}', sans-serif` }}>
                Discover studio-quality instrumentals with instant digital delivery.
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Button Font Weight</Label>
              <Select value={config.buttons?.primaryWeight || '600'} onValueChange={v => update('buttons.primaryWeight', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Regular (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semibold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                  <SelectItem value="800">Extra Bold (800)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Logo */}
          <TabsContent value="logo" className="space-y-6 mt-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Store Logo</Label>
              {config.logo.url ? (
                <div className="rounded-lg border border-border p-4 flex flex-col items-center gap-4">
                  <img src={config.logo.url} alt="Logo" style={{ height: `${config.logo.height}px` }} className="object-contain" />
                  <Button variant="outline" size="sm" onClick={() => update('logo.url', '')}>Remove</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload logo</span>
                  <span className="text-xs text-muted-foreground">PNG, SVG, or JPG</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                  {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
                </label>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Logo Height: {config.logo.height}px</Label>
              <Slider value={[config.logo.height]} min={20} max={80} step={2} onValueChange={([v]) => update('logo.height', v)} />
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
                min={0} max={24} step={2}
                onValueChange={([v]) => update('spacing.borderRadius', `${v / 16}rem`)}
              />
              <div className="flex gap-4 mt-3">
                <div className="w-16 h-16 bg-primary/20 border border-primary/30" style={{ borderRadius: config.spacing.borderRadius }} />
                <div className="flex-1 h-10 bg-primary/20 border border-primary/30" style={{ borderRadius: config.spacing.borderRadius }} />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Button Radius: {config.buttons?.primaryRadius || config.spacing.borderRadius}</Label>
              <Slider
                value={[parseFloat(config.buttons?.primaryRadius || config.spacing.borderRadius) * 16]}
                min={0} max={32} step={2}
                onValueChange={([v]) => update('buttons.primaryRadius', `${v / 16}rem`)}
              />
              <div className="mt-3">
                <div
                  className="inline-block px-6 py-2.5 text-sm font-semibold text-white"
                  style={{
                    backgroundColor: hslToHex(config.colors.primary),
                    borderRadius: config.buttons?.primaryRadius || config.spacing.borderRadius,
                    fontWeight: config.buttons?.primaryWeight || '600',
                  }}
                >
                  Preview Button
                </div>
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
  const border = `hsl(${config.colors.border})`;
  const secondary = `hsl(${config.colors.secondary})`;
  const accent = `hsl(${config.colors.accent})`;
  const btnRadius = config.buttons?.primaryRadius || config.spacing.borderRadius;
  const btnWeight = config.buttons?.primaryWeight || '600';

  return (
    <div style={{ backgroundColor: bg, color: fg, fontFamily: `'${config.fonts.body}', sans-serif` }} className="min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: `${border}40` }}>
        {config.logo.url ? (
          <img src={config.logo.url} alt="Logo" style={{ height: `${config.logo.height}px` }} className="object-contain" />
        ) : (
          <span className="font-bold text-lg" style={{ fontFamily: `'${config.fonts.heading}', sans-serif`, color: primary }}>Sonex Beats</span>
        )}
        <div className="flex gap-4 text-sm" style={{ color: muted }}>
          <span>Beats</span><span>Services</span><span>About</span>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center px-6" style={{ padding: `${config.spacing.sectionPadding} 1.5rem` }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-4" style={{ borderColor: `${border}60`, backgroundColor: `${secondary}30` }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />
          <span className="text-xs" style={{ color: muted }}>New beats every week</span>
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: `'${config.fonts.heading}', sans-serif` }}>
          Premium Beats for <span style={{ color: primary }}>Your Next Hit</span>
        </h1>
        <p className="mb-6" style={{ color: muted }}>Discover studio-quality instrumentals with instant delivery.</p>
        <div className="flex justify-center gap-3">
          <button className="px-6 py-2.5 text-sm text-white" style={{ backgroundColor: primary, borderRadius: btnRadius, fontWeight: btnWeight }}>
            Browse Beats
          </button>
          <button className="px-6 py-2.5 text-sm border" style={{ borderColor: border, borderRadius: btnRadius, fontWeight: btnWeight, color: fg }}>
            View Licensing
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="px-6 pb-8 grid grid-cols-3 gap-3" style={{ maxWidth: config.spacing.containerMaxWidth, margin: '0 auto' }}>
        {['Night Vibes', 'Cloud Nine', 'Dark Flow'].map(title => (
          <div key={title} className="p-4 border" style={{ backgroundColor: card, color: cardFg, borderRadius: config.spacing.borderRadius, borderColor: `${border}40` }}>
            <div className="w-full aspect-square rounded mb-3" style={{ backgroundColor: `${accent}30`, borderRadius: `calc(${config.spacing.borderRadius} - 4px)` }} />
            <p className="font-semibold text-sm" style={{ fontFamily: `'${config.fonts.heading}', sans-serif` }}>{title}</p>
            <p className="text-xs mt-1" style={{ color: muted }}>140 BPM · Trap</p>
            <p className="text-xs font-bold mt-2" style={{ color: primary }}>$29.99</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center text-xs border-t" style={{ borderColor: `${border}30`, color: muted }}>
        Made by Sonex Studio
      </div>
    </div>
  );
}
