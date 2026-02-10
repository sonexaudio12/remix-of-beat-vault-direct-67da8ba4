import { useState, useEffect, useCallback } from 'react';
import {
  GripVertical, Eye, EyeOff, Save, Check, Loader2, RotateCcw,
  LayoutTemplate, ZoomIn, ZoomOut, Monitor, Tablet, Smartphone, X,
  Palette, Type, Upload, Ruler, Layers, Sparkles, Image,
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

/* ---- Helpers ---- */
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
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={hslToHex(value)}
        onChange={e => onChange(hexToHsl(e.target.value))}
        className="w-8 h-8 rounded border border-border cursor-pointer flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <span className="text-xs block">{label}</span>
      </div>
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

type SidebarTab = 'sections' | 'presets' | 'colors' | 'fonts' | 'logo' | 'layout';

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
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('sections');
  const [showTemplates, setShowTemplates] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  /* ---- Sidebar tab icons ---- */
  const tabs: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
    { id: 'sections', icon: <Layers className="h-4 w-4" />, label: 'Sections' },
    { id: 'presets', icon: <Sparkles className="h-4 w-4" />, label: 'Presets' },
    { id: 'colors', icon: <Palette className="h-4 w-4" />, label: 'Colors' },
    { id: 'fonts', icon: <Type className="h-4 w-4" />, label: 'Fonts' },
    { id: 'logo', icon: <Image className="h-4 w-4" />, label: 'Logo' },
    { id: 'layout', icon: <Ruler className="h-4 w-4" />, label: 'Layout' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* ---- Top Toolbar ---- */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-bold mr-auto">Page Builder</h2>

        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
          {(['desktop', 'tablet', 'mobile'] as const).map(v => (
            <Button key={v} size="sm" variant={viewport === v ? 'default' : 'ghost'} onClick={() => setViewport(v)} className="h-7 w-7 p-0">
              {v === 'desktop' ? <Monitor className="h-4 w-4" /> : v === 'tablet' ? <Tablet className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="h-7 w-7 p-0"><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(1, z + 0.1))} className="h-7 w-7 p-0"><ZoomIn className="h-4 w-4" /></Button>
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
          <LayoutTemplate className="h-4 w-4 mr-1" /> Templates
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        <Button variant="outline" size="sm" onClick={handleSaveAll} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save All
        </Button>
        <Button size="sm" onClick={handlePublishAll} disabled={isPublishing}>
          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} Publish All
        </Button>
        {onClose && <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0"><X className="h-5 w-5" /></Button>
        </>}
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-border">
          {SECTION_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => applyTemplate(t.id)} className="text-left rounded-xl border border-border bg-card p-3 hover:border-primary hover:shadow-md transition-all">
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="font-semibold text-xs">{t.name}</div>
              <div className="text-[10px] text-muted-foreground">{t.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* ---- Main body ---- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tab strip */}
        <div className="w-14 flex-shrink-0 border-r border-border bg-card/50 flex flex-col items-center py-2 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setSidebarTab(t.id)}
              className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[9px] transition-colors ${
                sidebarTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
              }`}
              title={t.label}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Sidebar panel content */}
        <div className="w-72 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
          {sidebarTab === 'sections' && <SectionsPanel sections={sections} selectedId={selectedId} selectedSection={selectedSection} settingsDef={settingsDef} onSelect={setSelectedId} onToggle={toggleEnabled} onUpdateSetting={updateSetting} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} />}
          {sidebarTab === 'presets' && <PresetsPanel onApply={applyPreset} />}
          {sidebarTab === 'colors' && <ColorsPanel theme={theme} onUpdate={updateTheme} />}
          {sidebarTab === 'fonts' && <FontsPanel theme={theme} onUpdate={updateTheme} />}
          {sidebarTab === 'logo' && <LogoPanel theme={theme} onUpdate={updateTheme} onUpload={handleLogoUpload} uploading={uploading} />}
          {sidebarTab === 'layout' && <LayoutPanel theme={theme} onUpdate={updateTheme} />}
        </div>

        {/* Live Preview */}
        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          <div className="mx-auto transition-all duration-300 origin-top" style={{ width: viewportWidth, maxWidth: '100%', transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <HomepageLivePreview sections={sections} dragOverId={dragOverId} selectedId={selectedId} onSectionClick={(id) => { setSelectedId(id); setSidebarTab('sections'); }} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDrop={handleDrop} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================== */
/* Sidebar sub-panels                                             */
/* ============================================================== */

function SectionsPanel({ sections, selectedId, selectedSection, settingsDef, onSelect, onToggle, onUpdateSetting, onDragStart, onDragOver, onDrop, onDragEnd }: any) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold mb-1">Sections</h3>
        <p className="text-[10px] text-muted-foreground">Drag to reorder · Click to edit</p>
      </div>
      <div className="p-2 space-y-1 border-b border-border">
        {[...sections].sort((a: SectionConfig, b: SectionConfig) => a.order - b.order).map((section: SectionConfig) => (
          <div key={section.id} draggable onDragStart={() => onDragStart(section.id)} onDragOver={(e: React.DragEvent) => onDragOver(e, section.id)} onDrop={(e: React.DragEvent) => onDrop(e, section.id)} onDragEnd={onDragEnd} onClick={() => onSelect(section.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${selectedId === section.id ? 'bg-primary/10 border border-primary/30 text-primary' : 'hover:bg-muted/50 border border-transparent'} ${!section.enabled ? 'opacity-50' : ''}`}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 cursor-grab" />
            <span className="flex-1 truncate text-xs font-medium">{section.label}</span>
            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggle(section.id); }} className="flex-shrink-0">
              {section.enabled ? <Eye className="h-3 w-3 text-primary" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
            </button>
          </div>
        ))}
      </div>
      {selectedSection && Object.keys(settingsDef).length > 0 ? (
        <div className="p-3 flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold mb-2">Edit: <span className="text-primary">{selectedSection.label}</span></h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Switch checked={selectedSection.enabled} onCheckedChange={() => onToggle(selectedSection.id)} />
              <Label className="text-[10px]">Visible</Label>
            </div>
            {Object.entries(settingsDef).map(([key, def]: [string, any]) => (
              <div key={key}>
                <Label className="text-[10px] mb-0.5 block">{def.label}</Label>
                {def.type === 'textarea' ? (
                  <Textarea value={selectedSection.settings[key] || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdateSetting(selectedSection.id, key, e.target.value)} rows={2} className="text-xs" />
                ) : (
                  <Input type={def.type === 'number' ? 'number' : 'text'} value={selectedSection.settings[key] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateSetting(selectedSection.id, key, e.target.value)} className="text-xs h-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center">Click a section to edit</p>
        </div>
      )}
    </div>
  );
}

function PresetsPanel({ onApply }: { onApply: (preset: typeof COLOR_PRESETS[number]) => void }) {
  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold mb-2">Color Presets</h3>
      <p className="text-[10px] text-muted-foreground mb-3">Pick a theme, then fine-tune in Colors tab.</p>
      <div className="grid grid-cols-1 gap-2">
        {COLOR_PRESETS.map(preset => (
          <button key={preset.name} className="text-left p-2.5 rounded-lg border border-border hover:border-primary/50 transition-all group" onClick={() => onApply(preset)}>
            <div className="flex gap-1 mb-1.5">
              {[preset.colors.primary, preset.colors.background, preset.colors.accent, preset.colors.card].map((c, i) => (
                <div key={i} className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: hslToHex(c) }} />
              ))}
            </div>
            <p className="text-xs font-medium group-hover:text-primary transition-colors">{preset.name}</p>
            <p className="text-[10px] text-muted-foreground">{preset.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorsPanel({ theme, onUpdate }: { theme: ThemeConfig; onUpdate: (path: string, value: any) => void }) {
  return (
    <div className="p-3 space-y-4">
      <h3 className="text-sm font-semibold">Colors</h3>
      {COLOR_GROUPS.map(group => (
        <div key={group.title}>
          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">{group.title}</Label>
          <div className="space-y-1.5">
            {group.items.map(({ key, label }) => (
              <ColorField key={key} label={label} value={(theme.colors as any)[key] || '0 0% 0%'} onChange={v => onUpdate(`colors.${key}`, v)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FontsPanel({ theme, onUpdate }: { theme: ThemeConfig; onUpdate: (path: string, value: any) => void }) {
  return (
    <div className="p-3 space-y-4">
      <h3 className="text-sm font-semibold">Fonts</h3>
      <div>
        <Label className="text-xs mb-1 block">Heading Font</Label>
        <Select value={theme.fonts.heading} onValueChange={v => onUpdate('fonts.heading', v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{FONT_OPTIONS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span></SelectItem>)}</SelectContent>
        </Select>
        <p className="text-lg font-bold mt-2" style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}>Preview Heading</p>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Body Font</Label>
        <Select value={theme.fonts.body} onValueChange={v => onUpdate('fonts.body', v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{FONT_OPTIONS.map(f => <SelectItem key={f} value={f}><span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span></SelectItem>)}</SelectContent>
        </Select>
        <p className="text-sm mt-2" style={{ fontFamily: `'${theme.fonts.body}', sans-serif` }}>Preview body text paragraph.</p>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Button Weight</Label>
        <Select value={theme.buttons?.primaryWeight || '600'} onValueChange={v => onUpdate('buttons.primaryWeight', v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
  );
}

function LogoPanel({ theme, onUpdate, onUpload, uploading }: { theme: ThemeConfig; onUpdate: (path: string, value: any) => void; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; uploading: boolean }) {
  return (
    <div className="p-3 space-y-4">
      <h3 className="text-sm font-semibold">Logo</h3>
      {theme.logo.url ? (
        <div className="rounded-lg border border-border p-3 flex flex-col items-center gap-3">
          <img src={theme.logo.url} alt="Logo" style={{ height: `${theme.logo.height}px` }} className="object-contain" />
          <Button variant="outline" size="sm" onClick={() => onUpdate('logo.url', '')} className="text-xs">Remove</Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Click to upload</span>
          <span className="text-[10px] text-muted-foreground">PNG, SVG, JPG</span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </label>
      )}
      <div>
        <Label className="text-xs mb-1 block">Logo Height: {theme.logo.height}px</Label>
        <Slider value={[theme.logo.height]} min={20} max={80} step={2} onValueChange={([v]) => onUpdate('logo.height', v)} />
      </div>
    </div>
  );
}

function LayoutPanel({ theme, onUpdate }: { theme: ThemeConfig; onUpdate: (path: string, value: any) => void }) {
  return (
    <div className="p-3 space-y-4">
      <h3 className="text-sm font-semibold">Layout</h3>
      <div>
        <Label className="text-xs mb-1 block">Max Width</Label>
        <Select value={theme.spacing.containerMaxWidth} onValueChange={v => onUpdate('spacing.containerMaxWidth', v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
        <Select value={theme.spacing.sectionPadding} onValueChange={v => onUpdate('spacing.sectionPadding', v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
        <Slider value={[parseFloat(theme.spacing.borderRadius) * 16]} min={0} max={24} step={2} onValueChange={([v]) => onUpdate('spacing.borderRadius', `${v / 16}rem`)} />
        <div className="flex gap-3 mt-2">
          <div className="w-12 h-12 bg-primary/20 border border-primary/30" style={{ borderRadius: theme.spacing.borderRadius }} />
          <div className="flex-1 h-8 bg-primary/20 border border-primary/30" style={{ borderRadius: theme.spacing.borderRadius }} />
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Button Radius: {theme.buttons?.primaryRadius || theme.spacing.borderRadius}</Label>
        <Slider value={[parseFloat(theme.buttons?.primaryRadius || theme.spacing.borderRadius) * 16]} min={0} max={32} step={2} onValueChange={([v]) => onUpdate('buttons.primaryRadius', `${v / 16}rem`)} />
        <div className="mt-2">
          <div className="inline-block px-5 py-2 text-xs font-semibold text-white" style={{ backgroundColor: hslToHex(theme.colors.primary), borderRadius: theme.buttons?.primaryRadius || theme.spacing.borderRadius, fontWeight: theme.buttons?.primaryWeight || '600' }}>
            Preview Button
          </div>
        </div>
      </div>
    </div>
  );
}
