import { useState, useEffect, useCallback } from 'react';
import { GripVertical, Eye, EyeOff, Save, Check, Loader2, RotateCcw, ChevronDown, ChevronRight, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SectionConfig, DEFAULT_SECTIONS } from '@/types/sectionConfig';
import { useSectionsDraft, useSaveSectionsDraft, usePublishSections } from '@/hooks/useSectionConfig';
import { SECTION_TEMPLATES } from '@/data/sectionTemplates';
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

export function SectionEditor() {
  const { data: draft, isLoading } = useSectionsDraft();
  const saveDraft = useSaveSectionsDraft();
  const publishSections = usePublishSections();
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const applyTemplate = useCallback((templateId: string) => {
    const template = SECTION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    setSections(template.sections);
    setShowTemplates(false);
    toast.success(`"${template.name}" template applied — save to keep changes`);
  }, []);

  useEffect(() => {
    if (draft?.sections) {
      // Merge defaults for any new sections not in saved config
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
    setSections(prev =>
      prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, [key]: value } } : s)
    );
  }, []);

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setSections(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next.map((s, i) => ({ ...s, order: i }));
    });
    setDragIdx(idx);
  };

  const handleDragEnd = () => setDragIdx(null);

  const handleSave = () => {
    saveDraft.mutate({
      sections,
      existingId: draft?.id ?? null,
      version: draft?.version ?? 0,
    });
  };

  const handlePublish = () => {
    if (!draft?.id) {
      saveDraft.mutate(
        { sections, existingId: null, version: 0 },
        { onSuccess: () => toast.info('Saved. Click publish again to go live.') }
      );
      return;
    }
    publishSections.mutate({ existingId: draft.id });
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTIONS);
    toast.info('Reset to defaults (save to apply)');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold">Section Editor</h2>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
            <LayoutTemplate className="h-4 w-4 mr-1" /> Templates
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saveDraft.isPending}>
            {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save Draft
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishSections.isPending}>
            {publishSections.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
            Publish
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">Drag to reorder, toggle to enable/disable, and expand to customize each section.</p>

      {showTemplates && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SECTION_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t.id)}
              className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="font-semibold text-sm">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {sections.map((section, idx) => {
          const isExpanded = expandedId === section.id;
          const settingsDef = SECTION_SETTING_LABELS[section.id] || {};

          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`rounded-xl border bg-card transition-all ${
                dragIdx === idx ? 'border-primary shadow-lg scale-[1.02]' : 'border-border'
              } ${!section.enabled ? 'opacity-60' : ''}`}
            >
              {/* Header row */}
              <div className="flex items-center gap-3 p-4 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                <button
                  onClick={() => setExpandedId(isExpanded ? null : section.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">{section.label}</span>
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                </button>

                <div className="flex items-center gap-2">
                  {section.enabled ? (
                    <Eye className="h-4 w-4 text-primary" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={section.enabled}
                    onCheckedChange={() => toggleEnabled(section.id)}
                  />
                </div>
              </div>

              {/* Expanded settings */}
              {isExpanded && Object.keys(settingsDef).length > 0 && (
                <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
                  {Object.entries(settingsDef).map(([key, def]) => (
                    <div key={key}>
                      <Label className="text-sm mb-1 block">{def.label}</Label>
                      {def.type === 'textarea' ? (
                        <Textarea
                          value={section.settings[key] || ''}
                          onChange={(e) => updateSetting(section.id, key, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <Input
                          type={def.type === 'number' ? 'number' : 'text'}
                          value={section.settings[key] || ''}
                          onChange={(e) => updateSetting(section.id, key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
