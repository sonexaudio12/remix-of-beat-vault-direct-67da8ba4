import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { BeatGrid } from '@/components/beats/BeatGrid';
import { NowPlayingBar } from '@/components/beats/NowPlayingBar';
import { SoundKitGrid } from '@/components/soundkits/SoundKitGrid';
import { useBeats } from '@/hooks/useBeats';
import { useSoundKits } from '@/hooks/useSoundKits';
import { useCart } from '@/hooks/useCart';
import { mockBeats } from '@/data/mockBeats';
import { supabase } from '@/integrations/supabase/client';
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
  custom_beat: <Music className="h-6 w-6" />
};
const Index = () => {
  const {
    data: beats,
    isLoading,
    error
  } = useBeats();
  const {
    data: soundKits,
    isLoading: soundKitsLoading
  } = useSoundKits();
  const {
    addSoundKit
  } = useCart();
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      const {
        data
      } = await supabase.from('services').select('id, title, type, description, price').eq('is_active', true).order('sort_order').limit(4);
      setServices(data as Service[] || []);
      setServicesLoading(false);
    };
    load();
  }, []);
  const displayBeats = beats && beats.length > 0 ? beats : mockBeats;
  const latestBeats = useMemo(() => displayBeats.slice(0, 5), [displayBeats]);
  const latestSoundKits = useMemo(() => (soundKits || []).slice(0, 5), [soundKits]);
  return <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroSection />

        {/* Latest Beats Section */}
        <section className="py-16 md:py-24">
          <div className="container text-secondary bg-sidebar">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 text-primary-foreground">
                  Latest Beats
                </h2>
                <p className="text-muted-foreground">
                  {isLoading ? <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading beats...
                    </span> : `${latestBeats.length} newest beats`}
                </p>
              </div>
              <Link to="/beats">
                <Button variant="outline" className="gap-2">
                  View All Beats <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div> : error ? <div className="text-center py-20">
                <p className="text-muted-foreground">Error loading beats. Showing sample catalog.</p>
                <BeatGrid beats={mockBeats.slice(0, 5)} />
              </div> : <BeatGrid beats={latestBeats} />}
          </div>
        </section>

        {/* Sound Kits Section */}
        <section className="py-16 md:py-24 bg-slate-100">
          <div className="container">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Sound Kits
                </h2>
                <p className="text-muted-foreground">
                  {soundKitsLoading ? <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading sound kits...
                    </span> : `${latestSoundKits.length} newest kits`}
                </p>
              </div>
              <Link to="/sound-kits">
                <Button variant="outline" className="gap-2">
                  View All Kits <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {soundKitsLoading ? <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div> : <SoundKitGrid soundKits={latestSoundKits} onAddToCart={addSoundKit} />}
          </div>
        </section>

        {/* Services Summary Section */}
        <section className="py-16 md:py-24">
          <div className="container text-secondary bg-primary-foreground">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 text-secondary-foreground">
                  Studio Services
                </h2>
                <p className="text-muted-foreground">
                  Professional mixing, mastering & custom production
                </p>
              </div>
              <Link to="/services">
                <Button variant="outline" className="gap-2">
                  View All Services <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {servicesLoading ? <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div> : services.length === 0 ? <p className="text-center text-muted-foreground py-12">No services available yet.</p> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {services.map(service => <div key={service.id} className="rounded-xl border border-border p-6 flex flex-col hover:border-primary/30 transition-all duration-300 bg-accent-foreground">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                      {typeIcons[service.type] || <Music className="h-6 w-6" />}
                    </div>
                    <h3 className="font-display text-lg font-bold mb-1">{service.title}</h3>
                    <p className="text-xl font-bold mb-3 text-secondary-foreground bg-accent-foreground">${service.price}</p>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {service.description}
                    </p>
                  </div>)}
              </div>}
          </div>
        </section>
      </main>

      <Footer />
      <NowPlayingBar />
    </div>;
};
export default Index;