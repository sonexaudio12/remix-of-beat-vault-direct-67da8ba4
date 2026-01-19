import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SoundKitGrid } from '@/components/soundkits/SoundKitGrid';
import { SoundKitFilters } from '@/components/soundkits/SoundKitFilters';
import { NowPlayingBar } from '@/components/beats/NowPlayingBar';
import { useSoundKits } from '@/hooks/useSoundKits';
import { useCart } from '@/hooks/useCart';
import { Loader2, Package } from 'lucide-react';

const SoundKits = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: soundKits, isLoading, error } = useSoundKits();
  const { addSoundKit } = useCart();

  const categories = useMemo(() => 
    [...new Set((soundKits || []).map((kit) => kit.category))],
    [soundKits]
  );

  const filteredSoundKits = useMemo(() => {
    return (soundKits || []).filter((kit) => {
      const matchesSearch = kit.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        (kit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesCategory = categoryFilter === 'all' || kit.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [soundKits, searchQuery, categoryFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-background">
          <div className="container text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Sound Kits
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Premium sample packs and sound collections to elevate your productions.
              Royalty-free sounds ready for your next hit.
            </p>
          </div>
        </section>

        {/* Sound Kits Catalog Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Browse Kits
                </h2>
                <p className="text-muted-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading sound kits...
                    </span>
                  ) : (
                    `${filteredSoundKits.length} kit${filteredSoundKits.length !== 1 ? 's' : ''} available`
                  )}
                </p>
              </div>
              <SoundKitFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                categories={categories}
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Error loading sound kits. Please try again later.</p>
              </div>
            ) : (
              <SoundKitGrid soundKits={filteredSoundKits} onAddToCart={addSoundKit} />
            )}
          </div>
        </section>
      </main>

      <Footer />
      <NowPlayingBar />
    </div>
  );
};

export default SoundKits;
