import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Music, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceBeatCard } from '@/components/marketplace/MarketplaceBeatCard';
import { NowPlayingBar } from '@/components/beats/NowPlayingBar';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const GENRES = ['All', 'Hip Hop', 'Trap', 'R&B', 'Pop', 'Drill', 'Afrobeats', 'Lo-Fi', 'Soul'];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const { currentBeat } = useAudioPlayer();

  const { data: beats = [], isLoading } = useQuery({
    queryKey: ['marketplace-beats'],
    queryFn: async () => {
      const { data, error } = await supabase.
      from('beats').
      select('id, title, bpm, genre, mood, cover_url, preview_url, is_free, tenants(name, slug, custom_domain), license_tiers(price)').
      eq('is_active', true).
      order('created_at', { ascending: false }).
      limit(60);
      if (error) throw error;
      return data || [];
    }
  });

  const filtered = useMemo(() => {
    let result = beats;
    if (activeGenre !== 'All') {
      result = result.filter((b: any) => b.genre?.toLowerCase() === activeGenre.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b: any) =>
      b.title?.toLowerCase().includes(q) ||
      b.genre?.toLowerCase().includes(q) ||
      b.mood?.toLowerCase().includes(q) ||
      (b.tenants as any)?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [beats, activeGenre, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/lovable-uploads/db65a914-2de4-4b0b-8ad2-99b00fbd856a.png" alt="Sonex" className="h-8" />
          </Link>

          <div className="hidden md:flex relative max-w-sm flex-1 mx-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search beats, genres, producers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border" />
            
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to="/landing">
              <Button variant="hero" size="sm" className="gap-1.5">
                Start Selling Beats <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-foreground">
            Discover & License <span className="text-primary">Beats</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse thousands of beats from independent producers. Find your sound, license instantly.
          </p>

          {/* Mobile search */}
          <div className="md:hidden relative max-w-md mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search beats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border" />
            
          </div>

          {/* Genre pills */}
          <div className="flex flex-wrap justify-center gap-2 bg-card-foreground bg-[sidebar-primary-foreground] border-secondary">
            {GENRES.map((genre) =>
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeGenre === genre ?
              'bg-primary text-primary-foreground shadow-md' :
              'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border'}`
              }>
              
                {genre}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Beats Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {activeGenre === 'All' ? 'Latest Beats' : activeGenre}
          </h2>
          <span className="text-sm text-muted-foreground">{filtered.length} beats</span>
        </div>

        {isLoading ?
        <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div> :
        filtered.length === 0 ?
        <div className="text-center py-20 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No beats found</p>
            <p className="text-sm mt-1">Try a different search or genre filter</p>
          </div> :

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {filtered.map((beat: any) =>
          <MarketplaceBeatCard key={beat.id} beat={beat} />
          )}
          </div>
        }
      </section>

      {/* CTA Banner */}
      <section className="border-t border-border/50 bg-background">
        <div className="max-w-4xl mx-auto text-center px-4 py-16 md:py-20">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-foreground">
            Ready to sell your beats?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Launch your own beat store in minutes. No monthly fees — just your music, your brand, your revenue.
          </p>
          <Link to="/landing">
            <Button variant="hero" size="xl" className="gap-2">
              Start Selling Beats <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            <span>© {new Date().getFullYear()} Sonex. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

      {/* Audio player bar */}
      {currentBeat && <NowPlayingBar />}
    </div>);

}