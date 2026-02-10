import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { CTASection } from '@/components/home/CTASection';
import { BeatGrid } from '@/components/beats/BeatGrid';
import { NowPlayingBar } from '@/components/beats/NowPlayingBar';
import { SoundKitGrid } from '@/components/soundkits/SoundKitGrid';
import { useBeats } from '@/hooks/useBeats';
import { useSoundKits } from '@/hooks/useSoundKits';
import { useCart } from '@/hooks/useCart';
import { mockBeats } from '@/data/mockBeats';
import { supabase } from '@/integrations/supabase/client';
import { useSectionsPublished } from '@/hooks/useSectionConfig';
import { SectionConfig, DEFAULT_SECTIONS } from '@/types/sectionConfig';
import { Loader2, ArrowRight, Sliders, Disc3, Headphones, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const Index = () => {
  const { data: beats, isLoading, error } = useBeats();
  const { data: soundKits, isLoading: soundKitsLoading } = useSoundKits();
  const { addSoundKit } = useCart();
  const { data: publishedSections } = useSectionsPublished();
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const sections = useMemo(() => {
    const s = publishedSections || DEFAULT_SECTIONS;
    return [...s].sort((a, b) => a.order - b.order).filter(sec => sec.enabled);
  }, [publishedSections]);

  useEffect(() => {
    const load = async () => {
      const svcSection = sections.find(s => s.id === 'services');
      const limit = parseInt(svcSection?.settings?.count || '4', 10);
      const { data } = await supabase
        .from('services')
        .select('id, title, type, description, price')
        .eq('is_active', true)
        .order('sort_order')
        .limit(limit);
      setServices((data as Service[]) || []);
      setServicesLoading(false);
    };
    load();
  }, [sections]);

  const displayBeats = beats && beats.length > 0 ? beats : mockBeats;

  const getCount = (sectionId: string, fallback: number) => {
    const sec = sections.find(s => s.id === sectionId);
    return parseInt(sec?.settings?.count || String(fallback), 10);
  };

  const latestBeats = useMemo(() => displayBeats.slice(0, getCount('beats', 5)), [displayBeats, sections]);
  const latestSoundKits = useMemo(() => (soundKits || []).slice(0, getCount('soundkits', 5)), [soundKits, sections]);

  const renderSection = (section: SectionConfig) => {
    const s = section.settings;

    switch (section.id) {
      case 'hero':
        return (
          <HeroSection
            key={section.id}
            title={s.title}
            titleHighlight={s.titleHighlight}
            subtitle={s.subtitle}
            badgeText={s.badgeText}
            ctaText={s.ctaText}
            ctaLink={s.ctaLink}
            secondaryCtaText={s.secondaryCtaText}
            secondaryCtaLink={s.secondaryCtaLink}
          />
        );

      case 'beats':
        return (
          <section key={section.id} className="py-16 md:py-24">
            <div className="container">
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 text-secondary">
                    {s.title || 'Latest Beats'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading beats...
                      </span>
                    ) : (
                      s.subtitle || `${latestBeats.length} newest beats`
                    )}
                  </p>
                </div>
                <Link to="/beats">
                  <Button variant="outline" className="gap-2">
                    View All Beats <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Error loading beats. Showing sample catalog.</p>
                  <BeatGrid beats={mockBeats.slice(0, 5)} />
                </div>
              ) : (
                <BeatGrid beats={latestBeats} />
              )}
            </div>
          </section>
        );

      case 'soundkits':
        return (
          <section key={section.id} className="py-16 md:py-24 bg-muted/30">
            <div className="container">
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                    {s.title || 'Sound Kits'}
                  </h2>
                  <p className="text-muted-foreground">
                    {soundKitsLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading sound kits...
                      </span>
                    ) : (
                      s.subtitle || `${latestSoundKits.length} newest kits`
                    )}
                  </p>
                </div>
                <Link to="/sound-kits">
                  <Button variant="outline" className="gap-2">
                    View All Kits <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {soundKitsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <SoundKitGrid soundKits={latestSoundKits} onAddToCart={addSoundKit} />
              )}
            </div>
          </section>
        );

      case 'services':
        return (
          <section key={section.id} className="py-16 md:py-24">
            <div className="container">
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 text-secondary">
                    {s.title || 'Studio Services'}
                  </h2>
                  <p className="text-muted-foreground">
                    {s.subtitle || 'Professional mixing, mastering & custom production'}
                  </p>
                </div>
                <Link to="/services">
                  <Button variant="outline" className="gap-2">
                    View All Services <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {servicesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : services.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No services available yet.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="rounded-xl bg-card border border-border p-6 flex flex-col hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                        {typeIcons[service.type] || <Music className="h-6 w-6" />}
                      </div>
                      <h3 className="font-display text-lg font-bold mb-1">{service.title}</h3>
                      <p className="text-xl font-bold text-primary mb-3">${service.price}</p>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );

      case 'cta':
        return (
          <CTASection
            key={section.id}
            title={s.title}
            subtitle={s.subtitle}
            ctaText={s.ctaText}
            ctaLink={s.ctaLink}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {sections.map(renderSection)}
      </main>
      <Footer />
      <NowPlayingBar />
    </div>
  );
};

export default Index;
