import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { BeatGrid } from '@/components/beats/BeatGrid';
import { BeatFilters } from '@/components/beats/BeatFilters';
import { NowPlayingBar } from '@/components/beats/NowPlayingBar';
import { mockBeats } from '@/data/mockBeats';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState('all');

  const genres = useMemo(() => 
    [...new Set(mockBeats.map((beat) => beat.genre))],
    []
  );
  
  const moods = useMemo(() => 
    [...new Set(mockBeats.map((beat) => beat.mood))],
    []
  );

  const filteredBeats = useMemo(() => {
    return mockBeats.filter((beat) => {
      const matchesSearch = beat.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesGenre = genreFilter === 'all' || beat.genre === genreFilter;
      const matchesMood = moodFilter === 'all' || beat.mood === moodFilter;
      return matchesSearch && matchesGenre && matchesMood;
    });
  }, [searchQuery, genreFilter, moodFilter]);

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
                  {filteredBeats.length} beat{filteredBeats.length !== 1 ? 's' : ''} available
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

            <BeatGrid beats={filteredBeats} />
          </div>
        </section>
      </main>

      <Footer />
      <NowPlayingBar />
    </div>
  );
};

export default Index;
