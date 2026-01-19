import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { BeatGrid } from '@/components/beats/BeatGrid';
import { BeatFilters } from '@/components/beats/BeatFilters';
import { NowPlayingBar } from '@/components/beats/NowPlayingBar';
import { SoundKitGrid } from '@/components/soundkits/SoundKitGrid';
import { useBeats } from '@/hooks/useBeats';
import { useSoundKits } from '@/hooks/useSoundKits';
import { useCart } from '@/hooks/useCart';
import { mockBeats } from '@/data/mockBeats';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState('all');

  const { data: beats, isLoading, error } = useBeats();
  const { data: soundKits, isLoading: soundKitsLoading } = useSoundKits();
  const { addSoundKit } = useCart();

  // Use real beats if available, fallback to mock data
  const displayBeats = beats && beats.length > 0 ? beats : mockBeats;

  const genres = useMemo(() => 
    [...new Set(displayBeats.map((beat) => beat.genre))],
    [displayBeats]
  );
  
  const moods = useMemo(() => 
    [...new Set(displayBeats.map((beat) => beat.mood))],
    [displayBeats]
  );

  const filteredBeats = useMemo(() => {
    return displayBeats.filter((beat) => {
      const matchesSearch = beat.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesGenre = genreFilter === 'all' || beat.genre === genreFilter;
      const matchesMood = moodFilter === 'all' || beat.mood === moodFilter;
      return matchesSearch && matchesGenre && matchesMood;
    });
  }, [displayBeats, searchQuery, genreFilter, moodFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        
        {/* Beat Catalog Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Latest Beats
                </h2>
                <p className="text-muted-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading beats...
                    </span>
                  ) : (
                    `${filteredBeats.length} beat${filteredBeats.length !== 1 ? 's' : ''} available`
                  )}
                </p>
              </div>
              <BeatFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                genreFilter={genreFilter}
                onGenreChange={setGenreFilter}
                moodFilter={moodFilter}
                onMoodChange={setMoodFilter}
                genres={genres}
                moods={moods}
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Error loading beats. Showing sample catalog.</p>
                <BeatGrid beats={mockBeats} />
              </div>
            ) : (
              <BeatGrid beats={filteredBeats} />
            )}
          </div>
        </section>

        {/* Sound Kits Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mb-8">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Sound Kits
              </h2>
              <p className="text-muted-foreground">
                {soundKitsLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading sound kits...
                  </span>
                ) : (
                  `${soundKits?.length || 0} kit${(soundKits?.length || 0) !== 1 ? 's' : ''} available`
                )}
              </p>
            </div>

            {soundKitsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <SoundKitGrid 
                soundKits={soundKits || []} 
                onAddToCart={addSoundKit} 
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
      <NowPlayingBar />
    </div>
  );
};

export default Index;
