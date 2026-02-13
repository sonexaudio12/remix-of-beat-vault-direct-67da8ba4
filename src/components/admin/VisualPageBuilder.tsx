import { useState, useEffect, useCallback } from 'react';
import {
  GripVertical, Eye, EyeOff, Save, Check, Loader2, RotateCcw,
  LayoutTemplate, ZoomIn, ZoomOut, Monitor, Tablet, Smartphone, X,
  Upload, ChevronDown, ChevronRight, Pencil, Image as ImageIcon,
  Type, Palette, Ruler, Search, Globe, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionConfig, DEFAULT_SECTIONS } from '@/types/sectionConfig';
import { ThemeConfig, DEFAULT_THEME, FONT_OPTIONS, COLOR_PRESETS } from '@/types/storeConfig';
import { useSectionsDraft, useSaveSectionsDraft, usePublishSections } from '@/hooks/useSectionConfig';
import { useThemeDraft, useSaveThemeDraft, usePublishTheme } from '@/hooks/useStoreConfig';
import { SECTION_TEMPLATES } from '@/data/sectionTemplates';
import { HomepageLivePreview } from './HomepageLivePreview';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ---- Color helpers ---- */
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <input
        type="color"
        value={hslToHex(value)}
        onChange={e => onChange(hexToHsl(e.target.value))}
        className="w-7 h-7 rounded-full border border-border/50 cursor-pointer flex-shrink-0 bg-transparent"
      />
      <span className="text-xs text-foreground/80">{label}</span>
      <span className="text-[10px] text-muted-foreground ml-auto font-mono">{hslToHex(value)}</span>
    </div>
  );
}

/* ---- Section settings definitions ---- */
const SECTION_SETTING_LABELS: Record<string, Record<string, { label: string; type: 'text' | 'textarea' | 'number' }>> = {
  hero: {
    title: { label: 'Title', type: 'text' },
    titleHighlight: { label: 'Highlighted Text', type: 'text' },
    subtitle: { label: 'Subtitle', type: 'textarea' },
    badgeText: { label: 'Badge Text', type: 'text' },
    ctaText: { label: 'Primary Button', type: 'text' },
    ctaLink: { label: 'Primary Link', type: 'text' },
    secondaryCtaText: { label: 'Secondary Button', type: 'text' },
    secondaryCtaLink: { label: 'Secondary Link', type: 'text' },
  },
  beats: { title: { label: 'Title', type: 'text' }, subtitle: { label: 'Subtitle', type: 'text' }, count: { label: 'Count', type: 'number' } },
  beat_player: { title: { label: 'Title', type: 'text' }, subtitle: { label: 'Subtitle', type: 'text' }, count: { label: 'Tracks to show', type: 'number' } },
  soundkits: { title: { label: 'Title', type: 'text' }, subtitle: { label: 'Subtitle', type: 'text' }, count: { label: 'Count', type: 'number' } },
  services: { title: { label: 'Title', type: 'text' }, subtitle: { label: 'Subtitle', type: 'text' }, count: { label: 'Count', type: 'number' } },
  cta: { title: { label: 'Title', type: 'text' }, subtitle: { label: 'Subtitle', type: 'textarea' }, ctaText: { label: 'Button Text', type: 'text' }, ctaLink: { label: 'Button Link', type: 'text' } },
};

const COLOR_GROUPS = [
  { title: 'Core', items: [
    { key: 'primary', label: 'Primary' }, { key: 'primaryForeground', label: 'Primary Text' },
    { key: 'background', label: 'Background' }, { key: 'foreground', label: 'Text' },
  ]},
  { title: 'Cards', items: [
    { key: 'card', label: 'Card' }, { key: 'cardForeground', label: 'Card Text' },
  ]},
  { title: 'Secondary', items: [
    { key: 'secondary', label: 'Secondary' }, { key: 'secondaryForeground', label: 'Secondary Text' },
    { key: 'accent', label: 'Accent' }, { key: 'accentForeground', label: 'Accent Text' },
  ]},
  { title: 'Muted & Borders', items: [
    { key: 'muted', label: 'Muted' }, { key: 'mutedForeground', label: 'Muted Text' },
    { key: 'border', label: 'Border' }, { key: 'ring', label: 'Focus Ring' },
  ]},
];

/* ---- Accordion section component ---- */
function AccordionSection({ icon, title, open, onToggle, children }: {
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/40">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium hover:bg-muted/20 transition-colors"
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function VisualPageBuilder({ onClose }: { onClose?: () => void }) {
  /* ---- Sections state ---- */
  const { data: sectionDraft, isLoading: sectionsLoading } = useSectionsDraft();
  const saveSectionsDraft = useSaveSectionsDraft();
  const publishSections = usePublishSections();
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);

  /* ---- Theme state ---- */
  const { data: themeDraft, isLoading: themeLoading } = useThemeDraft();
  const saveThemeDraft = useSaveThemeDraft();
  const publishTheme = usePublishTheme();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);

  /* ---- UI state ---- */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoom, setZoom] = useState(0.55);
  const [showTemplates, setShowTemplates] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set(['sections']));

  const togglePanel = (id: string) => {
    setOpenPanels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (sectionDraft?.sections) {
      const merged = DEFAULT_SECTIONS.map(def => {
        const saved = sectionDraft.sections.find(s => s.id === def.id);
        return saved ? { ...def, ...saved, settings: { ...def.settings, ...saved.settings } } : def;
      });
      setSections(merged.sort((a, b) => a.order - b.order));
    }
  }, [sectionDraft]);

  useEffect(() => {
    if (themeDraft?.config) setTheme(themeDraft.config as ThemeConfig);
  }, [themeDraft]);

  /* ---- Section handlers ---- */
  const toggleEnabled = useCallback((id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  }, []);

  const updateSetting = useCallback((id: string, key: string, value: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, [key]: value } } : s));
  }, []);

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); if (dragId && dragId !== id) setDragOverId(id); };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    setSections(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(s => s.id === dragId);
      const toIdx = next.findIndex(s => s.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next.map((s, i) => ({ ...s, order: i }));
    });
    setDragId(null);
    setDragOverId(null);
  };
  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

  /* ---- Theme handlers ---- */
  const updateTheme = useCallback((path: string, value: any) => {
    setTheme(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const applyPreset = (preset: typeof COLOR_PRESETS[number]) => {
    setTheme(prev => ({ ...prev, colors: { ...prev.colors, ...preset.colors } }));
    toast.success(`Applied "${preset.name}"`);
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
      updateTheme('logo.url', publicUrl);
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  /* ---- Save / Publish all ---- */
  const isSaving = saveSectionsDraft.isPending || saveThemeDraft.isPending;
  const isPublishing = publishSections.isPending || publishTheme.isPending;

  const handleSaveAll = () => {
    saveSectionsDraft.mutate({ sections, existingId: sectionDraft?.id ?? null, version: sectionDraft?.version ?? 0 });
    saveThemeDraft.mutate({ config: theme, existingId: themeDraft?.id ?? null, version: themeDraft?.version ?? 0 });
  };

  const handlePublishAll = () => {
    if (!sectionDraft?.id || !themeDraft?.id) {
      handleSaveAll();
      toast.info('Saved. Click publish again to go live.');
      return;
    }
    publishSections.mutate({ existingId: sectionDraft.id });
    publishTheme.mutate({ existingId: themeDraft.id });
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTIONS);
    setTheme(DEFAULT_THEME);
    setSelectedId(null);
    toast.info('Reset to defaults');
  };

  const applyTemplate = useCallback((templateId: string) => {
    const template = SECTION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    setSections(template.sections);
    setShowTemplates(false);
    toast.success(`"${template.name}" applied`);
  }, []);

  const selectedSection = sections.find(s => s.id === selectedId);
  const settingsDef = selectedId ? SECTION_SETTING_LABELS[selectedId] || {} : {};
  const viewportWidth = viewport === 'mobile' ? '390px' : viewport === 'tablet' ? '768px' : '100%';

  if (sectionsLoading || themeLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* ---- Top Toolbar ---- */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 flex-shrink-0 bg-card/80 backdrop-blur-sm">
        <h2 className="text-sm font-bold tracking-wide mr-auto flex items-center gap-2">
          <Pencil className="h-4 w-4 text-primary" />
          Customize Pro Page
        </h2>

        <div className="flex items-center gap-1 border border-border/50 rounded-lg p-0.5 bg-background/50">
          {(['desktop', 'tablet', 'mobile'] as const).map(v => (
            <Button key={v} size="sm" variant={viewport === v ? 'default' : 'ghost'} onClick={() => setViewport(v)} className="h-7 w-7 p-0">
              {v === 'desktop' ? <Monitor className="h-3.5 w-3.5" /> : v === 'tablet' ? <Tablet className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 border border-border/50 rounded-lg p-0.5 bg-background/50">
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="h-7 w-7 p-0"><ZoomOut className="h-3.5 w-3.5" /></Button>
          <span className="text-[10px] font-mono w-9 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(1, z + 0.1))} className="h-7 w-7 p-0"><ZoomIn className="h-3.5 w-3.5" /></Button>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setShowTemplates(!showTemplates)} className="h-8 text-xs gap-1.5">
          <LayoutTemplate className="h-3.5 w-3.5" /> Templates
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>

        <div className="w-px h-5 bg-border/50 mx-1" />

        <Button variant="outline" size="sm" onClick={handleSaveAll} disabled={isSaving} className="h-8 text-xs gap-1.5">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Draft
        </Button>
        <Button size="sm" onClick={handlePublishAll} disabled={isPublishing} className="h-8 text-xs gap-1.5">
          {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Publish
        </Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 ml-1"><X className="h-4 w-4" /></Button>
        )}
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-border/50 bg-card/50">
          {SECTION_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => applyTemplate(t.id)} className="text-left rounded-xl border border-border/50 bg-card p-3 hover:border-primary/50 hover:shadow-md transition-all">
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="font-semibold text-xs">{t.name}</div>
              <div className="text-[10px] text-muted-foreground">{t.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* ---- Main body ---- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Single accordion sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-border/40 bg-card overflow-y-auto">
          <div className="px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Customize Pro Page</span>
            </div>
          </div>

          {/* ===== CUSTOMIZATION OPTIONS ===== */}
          <AccordionSection
            icon={<Palette className="h-4 w-4" />}
            title="Customization Options"
            open={openPanels.has('customization')}
            onToggle={() => togglePanel('customization')}
          >
            <div className="space-y-4">
              {/* Color Presets */}
              <div>
                <Label className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">Color Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_PRESETS.map(preset => (
                    <button key={preset.name} className="text-left p-2 rounded-lg border border-border/50 hover:border-primary/50 transition-all" onClick={() => applyPreset(preset)}>
                      <div className="flex gap-1 mb-1">
                        {[preset.colors.primary, preset.colors.background, preset.colors.accent, preset.colors.card].map((c, i) => (
                          <div key={i} className="w-3.5 h-3.5 rounded-full border border-border/30" style={{ backgroundColor: hslToHex(c) }} />
                        ))}
                      </div>
                      <p className="text-[10px] font-medium truncate">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              {COLOR_GROUPS.map(group => (
                <div key={group.title}>
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">{group.title}</Label>
                  {group.items.map(({ key, label }) => (
                    <ColorField key={key} label={label} value={(theme.colors as any)[key] || '0 0% 0%'} onChange={v => updateTheme(`colors.${key}`, v)} />
                  ))}
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* ===== WEBSITE LOGO ===== */}
          <AccordionSection
            icon={<ImageIcon className="h-4 w-4" />}
            title="Website Logo"
            open={openPanels.has('logo')}
            onToggle={() => togglePanel('logo')}
          >
            <div className="space-y-3">
              {theme.logo.url ? (
                <div className="rounded-lg border border-border/50 p-3 flex flex-col items-center gap-3 bg-background/30">
                  <img src={theme.logo.url} alt="Logo" style={{ height: `${theme.logo.height}px` }} className="object-contain" />
                  <Button variant="outline" size="sm" onClick={() => updateTheme('logo.url', '')} className="text-xs h-7">Remove Logo</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-lg border border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-background/20">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload Logo</span>
                  <span className="text-[10px] text-muted-foreground/60">PNG, SVG, JPG</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </label>
              )}
              <div>
                <Label className="text-xs mb-1 block">Logo Height: {theme.logo.height}px</Label>
                <Slider value={[theme.logo.height]} min={20} max={80} step={2} onValueChange={([v]) => updateTheme('logo.height', v)} />
              </div>
            </div>
          </AccordionSection>

          {/* ===== HOMEPAGE SECTIONS ===== */}
          <AccordionSection
            icon={<Layers className="h-4 w-4" />}
            title="Homepage Sections"
            open={openPanels.has('sections')}
            onToggle={() => togglePanel('sections')}
          >
            <div className="space-y-1 mb-3">
              <p className="text-[10px] text-muted-foreground mb-2">Drag to reorder · Click to edit</p>
              {[...sections].sort((a, b) => a.order - b.order).map(section => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(section.id)}
                  onDragOver={(e) => handleDragOver(e, section.id)}
                  onDrop={(e) => handleDrop(e, section.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedId(selectedId === section.id ? null : section.id)}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm cursor-pointer transition-all ${
                    selectedId === section.id ? 'bg-primary/10 border border-primary/30 text-primary' : 'hover:bg-muted/20 border border-transparent'
                  } ${!section.enabled ? 'opacity-40' : ''}`}
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 cursor-grab" />
                  <span className="flex-1 truncate text-xs font-medium">{section.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleEnabled(section.id); }} className="flex-shrink-0">
                    {section.enabled ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Selected section editor */}
            {selectedSection && Object.keys(settingsDef).length > 0 && (
              <div className="border-t border-border/40 pt-3 mt-2 space-y-2">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <Pencil className="h-3 w-3 text-primary" />
                  Edit: <span className="text-primary">{selectedSection.label}</span>
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <Switch checked={selectedSection.enabled} onCheckedChange={() => toggleEnabled(selectedSection.id)} />
                  <Label className="text-[10px]">Visible</Label>
                </div>
                {Object.entries(settingsDef).map(([key, def]: [string, any]) => (
                  <div key={key}>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">{def.label}</Label>
                    {def.type === 'textarea' ? (
                      <Textarea value={selectedSection.settings[key] || ''} onChange={(e) => updateSetting(selectedSection.id, key, e.target.value)} rows={2} className="text-xs bg-background/30" />
                    ) : (
                      <Input type={def.type === 'number' ? 'number' : 'text'} value={selectedSection.settings[key] || ''} onChange={(e) => updateSetting(selectedSection.id, key, e.target.value)} className="text-xs h-8 bg-background/30" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>

          {/* ===== HOMEPAGE MAIN TEXT & BUTTONS ===== */}
          <AccordionSection
            icon={<Pencil className="h-4 w-4" />}
            title="Homepage Main Text & Buttons"
            open={openPanels.has('hero-text')}
            onToggle={() => togglePanel('hero-text')}
          >
            {(() => {
              const heroSection = sections.find(s => s.id === 'hero');
              if (!heroSection) return <p className="text-xs text-muted-foreground">No hero section found</p>;
              const heroDef = SECTION_SETTING_LABELS.hero;
              return (
                <div className="space-y-3">
                  {Object.entries(heroDef).map(([key, def]) => (
                    <div key={key}>
                      <Label className="text-[10px] mb-0.5 block text-muted-foreground">{def.label}</Label>
                      {def.type === 'textarea' ? (
                        <Textarea value={heroSection.settings[key] || ''} onChange={(e) => updateSetting('hero', key, e.target.value)} rows={2} className="text-xs bg-background/30" />
                      ) : (
                        <Input type="text" value={heroSection.settings[key] || ''} onChange={(e) => updateSetting('hero', key, e.target.value)} className="text-xs h-8 bg-background/30" />
                      )}
                    </div>
                  ))}

                  <div>
                    <Label className="text-xs mb-1 block">Text Color</Label>
                    <ColorField label="Foreground" value={theme.colors.foreground} onChange={v => updateTheme('colors.foreground', v)} />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={heroSection.enabled} onCheckedChange={() => toggleEnabled('hero')} />
                    <Label className="text-xs">Show Hero Section</Label>
                  </div>
                </div>
              );
            })()}
          </AccordionSection>

          {/* ===== FONTS & TYPOGRAPHY ===== */}
          <AccordionSection
            icon={<Type className="h-4 w-4" />}
            title="Fonts & Typography"
            open={openPanels.has('fonts')}
            onToggle={() => togglePanel('fonts')}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1 block">Heading Font</Label>
                <Select value={theme.fonts.heading} onValueChange={v => updateTheme('fonts.heading', v)}>
                  <SelectTrigger className="h-8 text-xs bg-background/30"><SelectValue /></SelectTrigger>
                  <SelectContent>{FONT_OPTIONS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span></SelectItem>)}</SelectContent>
                </Select>
                <p className="text-lg font-bold mt-2" style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}>Preview Heading</p>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Body Font</Label>
                <Select value={theme.fonts.body} onValueChange={v => updateTheme('fonts.body', v)}>
                  <SelectTrigger className="h-8 text-xs bg-background/30"><SelectValue /></SelectTrigger>
                  <SelectContent>{FONT_OPTIONS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span></SelectItem>)}</SelectContent>
                </Select>
                <p className="text-sm mt-2" style={{ fontFamily: `'${theme.fonts.body}', sans-serif` }}>Preview body text paragraph.</p>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Button Weight</Label>
                <Select value={theme.buttons?.primaryWeight || '600'} onValueChange={v => updateTheme('buttons.primaryWeight', v)}>
                  <SelectTrigger className="h-8 text-xs bg-background/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Regular</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semibold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                    <SelectItem value="800">Extra Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionSection>

          {/* ===== SEARCH BAR ===== */}
          <AccordionSection
            icon={<Search className="h-4 w-4" />}
            title="Search Bar"
            open={openPanels.has('search')}
            onToggle={() => togglePanel('search')}
          >
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] mb-0.5 block text-muted-foreground">Search Placeholder Text</Label>
                <Input
                  value={theme.searchPlaceholder || 'Search beats, sound kits...'}
                  onChange={(e) => updateTheme('searchPlaceholder', e.target.value)}
                  className="text-xs h-8 bg-background/30"
                  placeholder="What type of beat are you looking for?"
                />
              </div>
              <div className="rounded-lg border border-border/50 p-2 bg-background/20">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/20 border border-border/30">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{theme.searchPlaceholder || 'Search beats, sound kits...'}</span>
                </div>
                <p className="text-[9px] text-muted-foreground/60 mt-1.5 text-center">Preview</p>
              </div>
            </div>
          </AccordionSection>

          {/* ===== LAYOUT & SPACING ===== */}
          <AccordionSection
            icon={<Ruler className="h-4 w-4" />}
            title="Layout & Spacing"
            open={openPanels.has('layout')}
            onToggle={() => togglePanel('layout')}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1 block">Max Width</Label>
                <Select value={theme.spacing.containerMaxWidth} onValueChange={v => updateTheme('spacing.containerMaxWidth', v)}>
                  <SelectTrigger className="h-8 text-xs bg-background/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1200px">Narrow (1200px)</SelectItem>
                    <SelectItem value="1400px">Default (1400px)</SelectItem>
                    <SelectItem value="1600px">Wide (1600px)</SelectItem>
                    <SelectItem value="100%">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Section Padding</Label>
                <Select value={theme.spacing.sectionPadding} onValueChange={v => updateTheme('spacing.sectionPadding', v)}>
                  <SelectTrigger className="h-8 text-xs bg-background/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3rem">Compact</SelectItem>
                    <SelectItem value="5rem">Default</SelectItem>
                    <SelectItem value="7rem">Spacious</SelectItem>
                    <SelectItem value="10rem">Extra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Border Radius: {theme.spacing.borderRadius}</Label>
                <Slider value={[parseFloat(theme.spacing.borderRadius) * 16]} min={0} max={24} step={2} onValueChange={([v]) => updateTheme('spacing.borderRadius', `${v / 16}rem`)} />
                <div className="flex gap-3 mt-2">
                  <div className="w-12 h-12 bg-primary/20 border border-primary/30" style={{ borderRadius: theme.spacing.borderRadius }} />
                  <div className="flex-1 h-8 bg-primary/20 border border-primary/30" style={{ borderRadius: theme.spacing.borderRadius }} />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Button Radius: {theme.buttons?.primaryRadius || theme.spacing.borderRadius}</Label>
                <Slider value={[parseFloat(theme.buttons?.primaryRadius || theme.spacing.borderRadius) * 16]} min={0} max={32} step={2} onValueChange={([v]) => updateTheme('buttons.primaryRadius', `${v / 16}rem`)} />
                <div className="mt-2">
                  <div className="inline-block px-5 py-2 text-xs font-semibold text-white" style={{ backgroundColor: hslToHex(theme.colors.primary), borderRadius: theme.buttons?.primaryRadius || theme.spacing.borderRadius, fontWeight: theme.buttons?.primaryWeight || '600' }}>
                    Preview Button
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* ===== PAGES ===== */}
          <AccordionSection
            icon={<Globe className="h-4 w-4" />}
            title="Edit Pages"
            open={openPanels.has('pages')}
            onToggle={() => togglePanel('pages')}
          >
            <PagesContent />
          </AccordionSection>
        </div>

        {/* Live Preview */}
        <div className="flex-1 overflow-auto bg-muted/10 p-4">
          <div className="mx-auto transition-all duration-300 origin-top" style={{ width: viewportWidth, maxWidth: '100%', transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <HomepageLivePreview sections={sections} dragOverId={dragOverId} selectedId={selectedId} onSectionClick={(id) => { setSelectedId(id); if (!openPanels.has('sections')) togglePanel('sections'); }} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDrop={handleDrop} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Pages sub-content ---- */
function PagesContent() {
  const [aboutContent, setAboutContent] = useState({
    title: 'About Sonex Beats',
    intro: 'Sonex Beats is a modern beat marketplace and creative platform developed by Hit Chasers Collective — a group of producers with placements alongside major artists and experience working within the professional music industry.',
    body: 'Built by producers, for producers and artists, Sonex Beats was created to simplify how beats are sold, licensed, and discovered — while encouraging real collaboration instead of one-off transactions.',
    vision: 'Sonex Beats aims to become more than a marketplace. Our vision is to grow a trusted, community-driven platform where talented producers and serious artists can connect, collaborate, and create records that move culture forward.',
  });
  const [licensingContent, setLicensingContent] = useState({
    heroTitle: 'Simple, Transparent Licensing',
    heroSubtitle: 'Choose the license that fits your project. All licenses include instant digital delivery and a PDF with your usage rights.',
  });
  const [expandedPage, setExpandedPage] = useState<'about' | 'licensing' | null>('about');

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground mb-2">Edit content for your About and Licensing pages.</p>

      <button onClick={() => setExpandedPage(expandedPage === 'about' ? null : 'about')} className="w-full flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-muted/20 text-xs font-medium">
        About Page
        {expandedPage === 'about' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {expandedPage === 'about' && (
        <div className="space-y-2 pl-1">
          <div><Label className="text-[10px] mb-0.5 block">Page Title</Label><Input value={aboutContent.title} onChange={e => setAboutContent(p => ({ ...p, title: e.target.value }))} className="text-xs h-8 bg-background/30" /></div>
          <div><Label className="text-[10px] mb-0.5 block">Introduction</Label><Textarea value={aboutContent.intro} onChange={e => setAboutContent(p => ({ ...p, intro: e.target.value }))} rows={3} className="text-xs bg-background/30" /></div>
          <div><Label className="text-[10px] mb-0.5 block">Body Text</Label><Textarea value={aboutContent.body} onChange={e => setAboutContent(p => ({ ...p, body: e.target.value }))} rows={3} className="text-xs bg-background/30" /></div>
          <div><Label className="text-[10px] mb-0.5 block">Vision Statement</Label><Textarea value={aboutContent.vision} onChange={e => setAboutContent(p => ({ ...p, vision: e.target.value }))} rows={3} className="text-xs bg-background/30" /></div>
          <p className="text-[9px] text-muted-foreground/60 italic">Page content editing will be saved with the store config in a future update.</p>
        </div>
      )}

      <button onClick={() => setExpandedPage(expandedPage === 'licensing' ? null : 'licensing')} className="w-full flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-muted/20 text-xs font-medium">
        Licensing Page
        {expandedPage === 'licensing' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {expandedPage === 'licensing' && (
        <div className="space-y-2 pl-1">
          <div><Label className="text-[10px] mb-0.5 block">Hero Title</Label><Input value={licensingContent.heroTitle} onChange={e => setLicensingContent(p => ({ ...p, heroTitle: e.target.value }))} className="text-xs h-8 bg-background/30" /></div>
          <div><Label className="text-[10px] mb-0.5 block">Hero Subtitle</Label><Textarea value={licensingContent.heroSubtitle} onChange={e => setLicensingContent(p => ({ ...p, heroSubtitle: e.target.value }))} rows={2} className="text-xs bg-background/30" /></div>
          <p className="text-[9px] text-muted-foreground/60 italic">License tiers are managed in the License Templates tab.</p>
        </div>
      )}
    </div>
  );
}
