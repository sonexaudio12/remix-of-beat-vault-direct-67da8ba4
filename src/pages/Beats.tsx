import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NowPlayingBar } from '@/components/beats/NowPlayingBar';
import { BeatGrid } from '@/components/beats/BeatGrid';
import { BeatList } from '@/components/beats/BeatList';
import { useBeats } from '@/hooks/useBeats';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useThemeConfig } from '@/hooks/useStoreConfig';
import { Search, Music, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Beats() {
  const { data: beats = [], isLoading } = useBeats();
  const { currentBeat } = useAudioPlayer();
  const { data: themeConfig } = useThemeConfig();
  const defaultLayout = themeConfig?.beatPlayer?.layout || 'list';

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState('all');
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 200]);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(defaultLayout);

  // Extract unique genres and moods from beats
  const { genres, moods, bpmMin, bpmMax } = useMemo(() => {
    const uniqueGenres = [...new Set(beats.map((b) => b.genre))].sort();
    const uniqueMoods = [...new Set(beats.map((b) => b.mood))].sort();
    const bpms = beats.map((b) => b.bpm);
    return {
      genres: uniqueGenres,
      moods: uniqueMoods,
      bpmMin: bpms.length > 0 ? Math.min(...bpms) : 60,
      bpmMax: bpms.length > 0 ? Math.max(...bpms) : 200,
    };
  }, [beats]);

  // Filter beats based on all criteria
  const filteredBeats = useMemo(() => {
    return beats.filter((beat) => {
      const matchesSearch = beat.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = genreFilter === 'all' || beat.genre === genreFilter;
      const matchesMood = moodFilter === 'all' || beat.mood === moodFilter;
      const matchesBpm = beat.bpm >= bpmRange[0] && beat.bpm <= bpmRange[1];
      return matchesSearch && matchesGenre && matchesMood && matchesBpm;
    });
  }, [beats, searchQuery, genreFilter, moodFilter, bpmRange]);

  const resetFilters = () => {
    setSearchQuery('');
    setGenreFilter('all');
    setMoodFilter('all');
    setBpmRange([bpmMin, bpmMax]);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    genreFilter !== 'all' ||
    moodFilter !== 'all' ||
    bpmRange[0] !== bpmMin ||
    bpmRange[1] !== bpmMax;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Music className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Beat Catalog</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground">
                Find Your Perfect{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Beat
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Browse our collection of premium beats. Filter by genre, vibe, and tempo to find the perfect sound for your next hit.
              </p>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-8 border-b border-border bg-secondary/30">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {isLoading ? 'Loading...' : `${filteredBeats.length} Beats`}
                </h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                <div className="flex items-center border border-border rounded-lg p-0.5 bg-background/50">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-7 w-7 p-0"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7 w-7 p-0"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Search by Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background border-border"
                    />
                  </div>
                </div>

                {/* Genre Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Genre</label>
                  <Select value={genreFilter} onValueChange={setGenreFilter}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="All Genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mood/Vibe Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Vibe</label>
                  <Select value={moodFilter} onValueChange={setMoodFilter}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="All Vibes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vibes</SelectItem>
                      {moods.map((mood) => (
                        <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tempo/BPM Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Tempo: {bpmRange[0]} - {bpmRange[1]} BPM
                  </label>
                  <div className="pt-2 px-1">
                    <Slider
                      value={bpmRange}
                      onValueChange={(value) => setBpmRange(value as [number, number])}
                      min={bpmMin}
                      max={bpmMax}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{bpmMin} BPM</span>
                    <span>{bpmMax} BPM</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Beats */}
        <section className="py-12">
          <div className="container">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : viewMode === 'list' ? (
              <BeatList beats={filteredBeats} />
            ) : (
              <BeatGrid beats={filteredBeats} />
            )}
          </div>
        </section>
      </main>

      <Footer />

      {currentBeat && <NowPlayingBar />}
    </div>
  );
}
