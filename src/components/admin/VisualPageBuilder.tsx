import { useState, useEffect, useCallback, useRef } from 'react';
import { GripVertical, Eye, EyeOff, Save, Check, Loader2, RotateCcw, LayoutTemplate, ChevronDown, ChevronRight, ZoomIn, ZoomOut, Monitor, Tablet, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SectionConfig, DEFAULT_SECTIONS } from '@/types/sectionConfig';
import { useSectionsDraft, useSaveSectionsDraft, usePublishSections } from '@/hooks/useSectionConfig';
import { SECTION_TEMPLATES } from '@/data/sectionTemplates';
import { HomepageLivePreview } from './HomepageLivePreview';
import { toast } from 'sonner';

const SECTION_SETTING_LABELS: Record<string, Record<string, { label: string; type: 'text' | 'textarea' | 'number' }>> = {
  hero: {
    title: { label: 'Title', type: 'text' },
    titleHighlight: { label: 'Highlighted Text', type: 'text' },
    subtitle: { label: 'Subtitle', type: 'textarea' },
    badgeText: { label: 'Badge Text', type: 'text' },
    ctaText: { label: 'Primary Button Text', type: 'text' },
    ctaLink: { label: 'Primary Button Link', type: 'text' },
    secondaryCtaText: { label: 'Secondary Button Text', type: 'text' },
    secondaryCtaLink: { label: 'Secondary Button Link', type: 'text' },
  },
  beats: {
    title: { label: 'Section Title', type: 'text' },
    subtitle: { label: 'Subtitle', type: 'text' },
    count: { label: 'Number of Beats', type: 'number' },
  },
  soundkits: {
    title: { label: 'Section Title', type: 'text' },
    subtitle: { label: 'Subtitle', type: 'text' },
    count: { label: 'Number of Kits', type: 'number' },
  },
  services: {
    title: { label: 'Section Title', type: 'text' },
    subtitle: { label: 'Subtitle', type: 'text' },
    count: { label: 'Number of Services', type: 'number' },
  },
  cta: {
    title: { label: 'Title', type: 'text' },
    subtitle: { label: 'Subtitle', type: 'textarea' },
    ctaText: { label: 'Button Text', type: 'text' },
    ctaLink: { label: 'Button Link', type: 'text' },
  },
};

export function VisualPageBuilder({ onClose }: { onClose?: () => void }) {
  const { data: draft, isLoading } = useSectionsDraft();
  const saveDraft = useSaveSectionsDraft();
  const publishSections = usePublishSections();

  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoom, setZoom] = useState(0.55);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (draft?.sections) {
      const merged = DEFAULT_SECTIONS.map(def => {
        const saved = draft.sections.find(s => s.id === def.id);
        return saved ? { ...def, ...saved, settings: { ...def.settings, ...saved.settings } } : def;
      });
      setSections(merged.sort((a, b) => a.order - b.order));
    }
  }, [draft]);

  const toggleEnabled = useCallback((id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  }, []);

  const updateSetting = useCallback((id: string, key: string, value: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, [key]: value } } : s));
  }, []);

  const handleDragStart = (id: string) => setDragId(id);

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!dragId || dragId === id) return;
    setDragOverId(id);
  };

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

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

  const applyTemplate = useCallback((templateId: string) => {
    const template = SECTION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    setSections(template.sections);
    setShowTemplates(false);
    toast.success(`"${template.name}" template applied`);
  }, []);

  const handleSave = () => {
    saveDraft.mutate({ sections, existingId: draft?.id ?? null, version: draft?.version ?? 0 });
  };

  const handlePublish = () => {
    if (!draft?.id) {
      saveDraft.mutate({ sections, existingId: null, version: 0 }, {
        onSuccess: () => toast.info('Saved. Click publish again to go live.'),
      });
      return;
    }
    publishSections.mutate({ existingId: draft.id });
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTIONS);
    setSelectedId(null);
    toast.info('Reset to defaults');
  };

  const selectedSection = sections.find(s => s.id === selectedId);
  const settingsDef = selectedId ? SECTION_SETTING_LABELS[selectedId] || {} : {};

  const viewportWidth = viewport === 'mobile' ? '390px' : viewport === 'tablet' ? '768px' : '100%';

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-wrap">
        <h2 className="text-xl font-bold mr-auto">Visual Page Builder</h2>

        {/* Viewport controls */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
          <Button size="sm" variant={viewport === 'desktop' ? 'default' : 'ghost'} onClick={() => setViewport('desktop')} className="h-7 w-7 p-0">
            <Monitor className="h-4 w-4" />
          </Button>
          <Button size="sm" variant={viewport === 'tablet' ? 'default' : 'ghost'} onClick={() => setViewport('tablet')} className="h-7 w-7 p-0">
            <Tablet className="h-4 w-4" />
          </Button>
          <Button size="sm" variant={viewport === 'mobile' ? 'default' : 'ghost'} onClick={() => setViewport('mobile')} className="h-7 w-7 p-0">
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="h-7 w-7 p-0">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(1, z + 0.1))} className="h-7 w-7 p-0">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
          <LayoutTemplate className="h-4 w-4 mr-1" /> Templates
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave} disabled={saveDraft.isPending}>
          {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save
        </Button>
        <Button size="sm" onClick={handlePublish} disabled={publishSections.isPending}>
          {publishSections.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} Publish
        </Button>
        {onClose && (
          <div className="w-px h-6 bg-border mx-1" />
        )}
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="grid grid-cols-4 gap-3 px-4 py-3">
          {SECTION_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t.id)}
              className="text-left rounded-xl border border-border bg-card p-3 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="font-semibold text-xs">{t.name}</div>
              <div className="text-[10px] text-muted-foreground">{t.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Main split: Sidebar + Preview */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Left: Section list + editing panel */}
        <div className="w-80 flex-shrink-0 flex flex-col overflow-y-auto border-r border-border bg-card">
          {/* Section list */}
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold mb-2">Sections</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Drag in the list or on the preview to reorder. Click to edit.</p>
            <div className="space-y-1">
              {sections.sort((a, b) => a.order - b.order).map((section) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(section.id)}
                  onDragOver={(e) => handleDragOver(e, section.id)}
                  onDrop={(e) => handleDrop(e, section.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedId(section.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${
                    selectedId === section.id
                      ? 'bg-primary/10 border border-primary/30 text-primary'
                      : 'hover:bg-muted/50 border border-transparent'
                  } ${!section.enabled ? 'opacity-50' : ''}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" />
                  <span className="flex-1 truncate font-medium">{section.label}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleEnabled(section.id); }}
                    className="flex-shrink-0"
                  >
                    {section.enabled ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Edit panel for selected section */}
          {selectedSection && Object.keys(settingsDef).length > 0 && (
            <div className="p-3 flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Editing: <span className="text-primary">{selectedSection.label}</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Switch
                    checked={selectedSection.enabled}
                    onCheckedChange={() => toggleEnabled(selectedSection.id)}
                  />
                  <Label className="text-xs">Visible on page</Label>
                </div>
                {Object.entries(settingsDef).map(([key, def]) => (
                  <div key={key}>
                    <Label className="text-xs mb-1 block">{def.label}</Label>
                    {def.type === 'textarea' ? (
                      <Textarea
                        value={selectedSection.settings[key] || ''}
                        onChange={e => updateSetting(selectedSection.id, key, e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        type={def.type === 'number' ? 'number' : 'text'}
                        value={selectedSection.settings[key] || ''}
                        onChange={e => updateSetting(selectedSection.id, key, e.target.value)}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedSection && (
            <div className="p-6 flex-1 flex items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">Click a section in the preview or the list above to edit its content.</p>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
          <div
            className="mx-auto transition-all duration-300 origin-top"
            style={{
              width: viewportWidth,
              maxWidth: '100%',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            <HomepageLivePreview
              sections={sections}
              dragOverId={dragOverId}
              selectedId={selectedId}
              onSectionClick={setSelectedId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
