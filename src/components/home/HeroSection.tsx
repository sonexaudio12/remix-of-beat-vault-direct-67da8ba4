import { Play, Headphones, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(187_100%_42%_/_0.1)_0%,transparent_50%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-3xl rounded-full" />

      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium">New beats every week</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
            Premium Beats for
            <span className="block text-gradient">Your Next Hit</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            Discover studio-quality instrumentals with instant digital delivery. 
            Choose your license, pay once, and start creating immediately.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              <Play className="h-5 w-5" />
              Browse Beats
            </Button>
            <Button variant="outline" size="xl" className="w-full sm:w-auto">
              View Licensing
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <Headphones className="h-5 w-5" />
              </div>
              <div className="font-display text-2xl md:text-3xl font-bold">100+</div>
              <div className="text-sm text-muted-foreground">Premium Beats</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <Download className="h-5 w-5" />
              </div>
              <div className="font-display text-2xl md:text-3xl font-bold">Instant</div>
              <div className="text-sm text-muted-foreground">Delivery</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <span className="text-xl">🎵</span>
              </div>
              <div className="font-display text-2xl md:text-3xl font-bold">MP3/WAV</div>
              <div className="text-sm text-muted-foreground">+ Stems</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
