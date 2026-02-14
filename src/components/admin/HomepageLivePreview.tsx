import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Headphones, Download, ArrowRight, Sliders, Disc3, Music, Loader2 } from 'lucide-react';
import { SectionConfig } from '@/types/sectionConfig';
import { useBeats } from '@/hooks/useBeats';
import { useSoundKits } from '@/hooks/useSoundKits';
import { mockBeats } from '@/data/mockBeats';
import { supabase } from '@/integrations/supabase/client';

interface Service {
  id: string;
  title: string;
  type: string;
  description: string | null;
  price: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  mixing: <Sliders className="h-6 w-6" />,
  mastering: <Disc3 className="h-6 w-6" />,
  mixing_mastering: <Headphones className="h-6 w-6" />,
  custom_beat: <Music className="h-6 w-6" />,
};

interface Props {
  sections: SectionConfig[];
  dragOverId: string | null;
  selectedId: string | null;
  onSectionClick: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}

export function HomepageLivePreview({
  sections,
  dragOverId,
  selectedId,
  onSectionClick,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: Props) {
  const { data: beats } = useBeats();
  const { data: soundKits } = useSoundKits();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    supabase
      .from('services')
      .select('id, title, type, description, price')
      .eq('is_active', true)
      .order('sort_order')
      .limit(4)
      .then(({ data }) => setServices((data as Service[]) || []));
  }, []);

  const displayBeats = beats && beats.length > 0 ? beats : mockBeats;
  const enabledSections = sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);

  const sectionRenderers: Record<string, (s: SectionConfig) => React.ReactNode> = {
    hero: (s) => <HeroPreview settings={s.settings} />,
    beats: (s) => <BeatsPreview settings={s.settings} beats={displayBeats} />,
    beat_player: (s) => <BeatPlayerPreview settings={s.settings} beats={displayBeats} />,
    soundkits: (s) => <SoundKitsPreview settings={s.settings} soundKits={soundKits || []} />,
    services: (s) => <ServicesPreview settings={s.settings} services={services} />,
    cta: (s) => <CTAPreview settings={s.settings} />,
  };

  return (
    <div className="bg-background min-h-[600px] rounded-lg overflow-hidden border border-border">
      {/* Simulated Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/50">
        <span className="font-bold text-lg text-primary">Sonex Beats</span>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Beats</span><span>Sound Kits</span><span>Services</span><span>About</span>
        </div>
      </div>

      {/* Sections */}
      {enabledSections.map((section) => (
        <div
          key={section.id}
          draggable
          onDragStart={() => onDragStart(section.id)}
          onDragOver={(e) => onDragOver(e, section.id)}
          onDragEnd={onDragEnd}
          onDrop={(e) => onDrop(e, section.id)}
          onClick={(e) => { e.stopPropagation(); onSectionClick(section.id); }}
          className={`relative group cursor-pointer transition-all duration-200 ${
            selectedId === section.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
          } ${
            dragOverId === section.id ? 'border-t-4 border-primary' : ''
          }`}
        >
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            {section.label} — Click to edit · Drag to reorder
          </div>

          {/* Actual section content */}
          <div className="pointer-events-none">
            {sectionRenderers[section.id]?.(section)}
          </div>
        </div>
      ))}

      {/* Disabled sections indicator */}
      {sections.filter(s => !s.enabled).length > 0 && (
        <div className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-dashed border-border">
          {sections.filter(s => !s.enabled).map(s => s.label).join(', ')} — hidden (enable in panel)
        </div>
      )}

      {/* Simulated Footer */}
      <div className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/30">
        Made by Sonex Studio
      </div>
    </div>
  );
}

/* ---- Section Previews ---- */

function HeroPreview({ settings }: { settings: Record<string, string> }) {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(187_100%_42%_/_0.1)_0%,transparent_50%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-3xl rounded-full" />
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm font-medium text-primary-foreground">{settings.badgeText || 'New beats every week'}</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {settings.title || 'Premium Beats for'}
            <span className="block text-gradient">{settings.titleHighlight || 'Your Next Hit'}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {settings.subtitle || 'Discover studio-quality instrumentals with instant digital delivery.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
              <Play className="h-5 w-5" />
              {settings.ctaText || 'Browse Beats'}
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg border border-border font-semibold text-sm">
              {settings.secondaryCtaText || 'View Licensing'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50">
            <div className="text-center">
              <Headphones className="h-5 w-5 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">100+</div>
              <div className="text-sm text-muted-foreground">Premium Beats</div>
            </div>
            <div className="text-center">
              <Download className="h-5 w-5 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">Instant</div>
              <div className="text-sm text-muted-foreground">Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-xl mb-2">🎵</div>
              <div className="text-2xl font-bold">MP3 / WAV</div>
              <div className="text-sm text-muted-foreground">+ Stems</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BeatsPreview({ settings, beats }: { settings: Record<string, string>; beats: any[] }) {
  const count = parseInt(settings.count || '5', 10);
  const display = beats.slice(0, count);
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">{settings.title || 'Latest Beats'}</h2>
            <p className="text-muted-foreground">{display.length} newest beats</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium">
            View All Beats <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {display.map((beat, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <div className="aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                {beat.cover_url && <img src={beat.cover_url} alt={beat.title} className="w-full h-full object-cover" />}
              </div>
              <p className="font-semibold text-sm truncate">{beat.title}</p>
              <p className="text-xs text-muted-foreground">{beat.bpm} BPM · {beat.genre}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SoundKitsPreview({ settings, soundKits }: { settings: Record<string, string>; soundKits: any[] }) {
  const count = parseInt(settings.count || '5', 10);
  const display = soundKits.slice(0, count);
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">{settings.title || 'Sound Kits'}</h2>
            <p className="text-muted-foreground">{display.length} newest kits</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium">
            View All Kits <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {display.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No sound kits yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {display.map((kit, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <div className="aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                  {kit.cover_url && <img src={kit.cover_url} alt={kit.title} className="w-full h-full object-cover" />}
                </div>
                <p className="font-semibold text-sm truncate">{kit.title}</p>
                <p className="text-xs text-muted-foreground">{kit.category}</p>
                <p className="text-xs font-bold text-primary mt-1">${kit.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ServicesPreview({ settings, services }: { settings: Record<string, string>; services: Service[] }) {
  const count = parseInt(settings.count || '4', 10);
  const display = services.slice(0, count);
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">{settings.title || 'Studio Services'}</h2>
            <p className="text-muted-foreground">{settings.subtitle || 'Professional mixing, mastering & custom production'}</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium">
            View All Services <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {display.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No services available yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {display.map((service) => (
              <div key={service.id} className="rounded-xl border border-border p-6 flex flex-col hover:border-primary/30 transition-all bg-card">
                <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                  {typeIcons[service.type] || <Music className="h-6 w-6" />}
                </div>
                <h3 className="font-display text-lg font-bold mb-1">{service.title}</h3>
                <p className="text-xl font-bold mb-3">${service.price}</p>
                <p className="text-muted-foreground text-sm line-clamp-2">{service.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BeatPlayerPreview({ settings, beats }: { settings: Record<string, string>; beats: any[] }) {
  const count = parseInt(settings.count || '6', 10);
  const display = beats.slice(0, count);
  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">{settings.title || 'Listen & Explore'}</h2>
          <p className="text-muted-foreground">{settings.subtitle || 'Preview our beats with the built-in player'}</p>
        </div>
        <div className="space-y-1 max-w-4xl mx-auto">
          {display.map((beat, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:bg-card/80 hover:border-border/50 transition-all">
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                <span className="text-sm text-muted-foreground font-mono">{i + 1}</span>
              </div>
              <div className="w-10 h-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                {beat.cover_url && <img src={beat.cover_url} alt={beat.title} className="w-full h-full object-cover" />}
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Play className="h-3.5 w-3.5 text-primary ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{beat.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{beat.genre}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">{beat.mood}</span>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded hidden md:inline">
                {beat.bpm} BPM
              </span>
              <div className="hidden lg:flex items-end gap-px h-6 w-28 flex-shrink-0">
                {Array.from({ length: 32 }).map((_, j) => (
                  <div key={j} className="flex-1 bg-muted-foreground/15 rounded-sm" style={{ height: `${20 + Math.sin(j * 0.5 + i) * 40 + Math.random() * 30}%` }} />
                ))}
              </div>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium flex-shrink-0">
                <span>$24.99</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTAPreview({ settings }: { settings: Record<string, string> }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="relative rounded-2xl border border-border bg-card/50 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)_/_0.08)_0%,transparent_70%)]" />
          <div className="relative text-center px-6 py-16 md:py-24">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{settings.title || 'Ready to Create?'}</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">{settings.subtitle || 'Browse our catalog and find the perfect beat.'}</p>
            <button className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
              {settings.ctaText || 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
