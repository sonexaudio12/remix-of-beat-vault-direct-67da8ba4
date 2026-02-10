import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Headphones, Music, Sliders, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
interface Service {
  id: string;
  title: string;
  type: string;
  description: string | null;
  price: number;
  is_active: boolean;
}
const typeIcons: Record<string, React.ReactNode> = {
  mixing: <Sliders className="h-8 w-8" />,
  mastering: <Disc3 className="h-8 w-8" />,
  mixing_mastering: <Headphones className="h-8 w-8" />,
  custom_beat: <Music className="h-8 w-8" />
};
export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const load = async () => {
      const {
        data
      } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order');
      setServices(data as Service[] || []);
      setLoading(false);
    };
    load();
  }, []);
  return <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 bg-background">Studio Services</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Professional mixing, mastering, and custom production — tailored to your sound.
            </p>
          </div>

          {loading ? <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div> : <div className="grid gap-6 md:grid-cols-2">
              {services.map(service => <div key={service.id} className="rounded-xl border border-border p-8 flex flex-col hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 bg-sidebar-border">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      {typeIcons[service.type] || <Music className="h-8 w-8" />}
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold">{service.title}</h2>
                      <p className="text-2xl font-bold text-primary">${service.price}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm flex-1 mb-6">
                    {service.description}
                  </p>
                  <Button variant="hero" className="w-full" onClick={() => navigate(`/service-order/${service.id}`)}>
                    Order Now
                  </Button>
                </div>)}
            </div>}
        </div>
      </main>
      <Footer />
    </div>;
}