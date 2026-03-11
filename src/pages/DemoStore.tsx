import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, ShoppingCart, Search, Music, Sliders, Disc3, Headphones, Star, ArrowRight } from 'lucide-react';

const demoBranding = {
  storeName: 'VEXO BEATS',
  tagline: 'Premium Beats for Your Next Hit',
  subtitle: 'Discover studio-quality instrumentals with instant digital delivery. Choose your license, pay once, and start creating immediately.',
};

const demoBeats = [
  { id: '1', title: 'Midnight Dreams', bpm: 140, genre: 'Trap', mood: 'Dark', price: 29.99, cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
  { id: '2', title: 'Neon Lights', bpm: 128, genre: 'Hip Hop', mood: 'Energetic', price: 24.99, cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop' },
  { id: '3', title: 'Summer Vibes', bpm: 95, genre: 'R&B', mood: 'Chill', price: 29.99, cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop' },
  { id: '4', title: 'Street Anthem', bpm: 150, genre: 'Drill', mood: 'Aggressive', price: 34.99, cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
  { id: '5', title: 'Cloud Nine', bpm: 85, genre: 'Lo-Fi', mood: 'Dreamy', price: 19.99, cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop' },
  { id: '6', title: 'Golden Hour', bpm: 110, genre: 'Pop', mood: 'Uplifting', price: 29.99, cover: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop' },
];

const demoServices = [
  { title: 'Mixing', price: 150, icon: Sliders, desc: 'Professional mixing to bring clarity, balance, and punch to your track.' },
  { title: 'Mastering', price: 75, icon: Disc3, desc: 'Industry-standard mastering for streaming platforms.' },
  { title: 'Mix + Master', price: 200, icon: Headphones, desc: 'Complete mixing and mastering bundle at a discounted price.' },
  { title: 'Custom Beat', price: 300, icon: Music, desc: 'A fully custom beat tailored to your creative vision.' },
];

const demoSoundKits = [
  { title: 'Dark Trap Vol. 1', category: 'Drum Kit', price: 24.99, cover: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop' },
  { title: 'Lo-Fi Essentials', category: 'Sample Pack', price: 19.99, cover: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop' },
  { title: 'Melody Loops Pack', category: 'Loop Kit', price: 29.99, cover: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop' },
];

export default function DemoStore() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2.5 px-4 text-sm font-medium relative z-50">
        <span>🎵 This is a demo store — </span>
        <Link to="/landing" className="underline font-semibold hover:text-white/90">
          Launch your own Sonex store →
        </Link>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/landing">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {demoBranding.storeName}
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#beats" className="hover:text-white transition-colors">Beats</a>
            <a href="#sound-kits" className="hover:text-white transition-colors">Sound Kits</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="container relative text-center max-w-3xl mx-auto px-5">
          <span className="inline-block text-xs font-medium tracking-wider uppercase text-purple-400 border border-purple-500/30 rounded-full px-4 py-1.5 mb-6">
            New beats every week
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            {demoBranding.tagline}
          </h1>
          <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
            {demoBranding.subtitle}
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <input
              type="text"
              placeholder="Search beats by name, genre, mood..."
              className="w-full h-12 pl-12 pr-4 rounded-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
              readOnly
            />
          </div>
        </div>
      </section>

      {/* Beats */}
      <section id="beats" className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold mb-2">Latest Beats</h2>
              <p className="text-white/40">{demoBeats.length} beats available</p>
            </div>
          </div>

          <div className="space-y-2">
            {demoBeats.map((beat, idx) => (
              <div
                key={beat.id}
                className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <span className="text-sm text-white/30 w-6 text-center">{idx + 1}</span>
                <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
                  <img src={beat.cover} alt={beat.title} className="h-full w-full object-cover" />
                  <button
                    onClick={() => setPlayingId(playingId === beat.id ? null : beat.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {playingId === beat.id ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white ml-0.5" />
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{beat.title}</p>
                  <p className="text-xs text-white/40">{beat.genre} • {beat.mood} • {beat.bpm} BPM</p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <span className="text-xs text-white/30 px-2 py-1 rounded bg-white/5">{beat.genre}</span>
                  <span className="text-xs text-white/30 px-2 py-1 rounded bg-white/5">{beat.bpm} BPM</span>
                </div>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 shrink-0">
                  <ShoppingCart className="h-3.5 w-3.5" /> ${beat.price}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sound Kits */}
      <section id="sound-kits" className="py-16 md:py-24 bg-white/[0.02]">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold mb-2">Sound Kits</h2>
              <p className="text-white/40">{demoSoundKits.length} kits available</p>
            </div>
          </div>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {demoSoundKits.map((kit) => (
              <div key={kit.title} className="rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all group">
                <div className="aspect-square relative overflow-hidden">
                  <img src={kit.cover} alt={kit.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-xs text-purple-400 uppercase tracking-wider">{kit.category}</span>
                    <h3 className="font-bold text-lg mt-1">{kit.title}</h3>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between bg-[#0a0a0f]">
                  <span className="text-lg font-bold">${kit.price}</span>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 md:py-24">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-2xl md:text-4xl font-bold mb-2">Studio Services</h2>
            <p className="text-white/40">Professional mixing, mastering & custom production</p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {demoServices.map((svc) => (
              <div key={svc.title} className="rounded-xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
                  <svc.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-1">{svc.title}</h3>
                <p className="text-xl font-bold mb-3 text-purple-400">${svc.price}</p>
                <p className="text-sm text-white/40 line-clamp-2">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="container text-center max-w-2xl mx-auto">
          <Star className="h-10 w-10 text-purple-400 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Want a store like this?</h2>
          <p className="text-white/50 mb-8">
            Launch your own branded beat store with Sonex. No monthly fees, no marketplace cuts.
          </p>
          <Link to="/landing#pricing">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white text-base px-8 gap-2">
              Launch My Store <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container text-center text-sm text-white/30">
          This is a demo store powered by <span className="text-purple-400 font-medium">Sonex</span>. © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
