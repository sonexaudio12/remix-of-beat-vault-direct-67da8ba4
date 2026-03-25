import { Link } from 'react-router-dom';
import { Play, Pause, ExternalLink, Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { downloadFileFromUrl, sanitizeFilename } from '@/lib/download';

interface MarketplaceBeat {
  id: string;
  title: string;
  bpm: number;
  genre: string;
  mood: string;
  cover_url: string | null;
  preview_url: string | null;
  is_free: boolean | null;
  tenants: {
    name: string;
    slug: string;
    custom_domain: string | null;
  } | null;
  license_tiers: {price: number;}[];
}

interface MarketplaceBeatCardProps {
  beat: MarketplaceBeat;
}

function getStoreUrl(tenant: MarketplaceBeat['tenants']): string {
  if (!tenant) return '#';
  if (tenant.custom_domain) return `https://${tenant.custom_domain}`;
  return `https://${tenant.slug}.sonexbeats.shop`;
}

export function MarketplaceBeatCard({ beat }: MarketplaceBeatCardProps) {
  const { currentBeat, isPlaying, toggle } = useAudioPlayer();
  const [downloading, setDownloading] = useState(false);

  const isCurrentlyPlaying = currentBeat?.id === beat.id && isPlaying;

  const lowestPrice = beat.license_tiers?.length ?
  Math.min(...beat.license_tiers.map((l) => l.price)) :
  null;

  const storeUrl = getStoreUrl(beat.tenants);

  const handlePlay = () => {
    if (!beat.preview_url) return;
    // Create a minimal beat object for the audio player
    toggle({
      id: beat.id,
      title: beat.title,
      bpm: beat.bpm,
      genre: beat.genre,
      mood: beat.mood,
      coverUrl: beat.cover_url || '/placeholder.svg',
      previewUrl: beat.preview_url,
      licenses: [],
      isExclusiveAvailable: false,
      createdAt: new Date()
    });
  };

  return (
    <div className="group rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
      {/* Cover */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={beat.cover_url || '/placeholder.svg'}
          alt={beat.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy" />
        
        {/* Play overlay */}
        {beat.preview_url &&
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-background/40 border-muted-foreground">
            <Button variant="player" size="iconLg" onClick={handlePlay}>
              {isCurrentlyPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </Button>
          </div>
        }
        {/* Playing indicator */}
        {isCurrentlyPlaying &&
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5">
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) =>
            <div key={i} className="w-0.5 bg-primary-foreground rounded-full animate-waveform" style={{ height: '12px', animationDelay: `${i * 0.15}s` }} />
            )}
            </div>
            <span className="text-xs font-medium text-primary-foreground">Playing</span>
          </div>
        }
        {/* Free badge */}
        {beat.is_free &&
        <div className="absolute top-3 right-3 rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            Free
          </div>
        }
      </div>

      {/* Info */}
      <div className="p-3 md:p-4 bg-background">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <Link to={`/beat/${beat.id}`} className="font-semibold text-sm md:text-base leading-tight truncate text-accent hover:text-primary transition-colors block">
              {beat.title}
            </Link>
            {beat.tenants &&
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline truncate block mt-0.5">
              
                {beat.tenants.name}
              </a>
            }
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <span>{beat.bpm} BPM</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>{beat.genre}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {beat.is_free ?
            <div className="text-sm font-bold text-green-500">FREE</div> :
            lowestPrice !== null ?
            <>
                <div className="text-sm font-bold text-primary">${lowestPrice.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground hidden sm:block">from</div>
              </> :
            null}
          </div>
        </div>

        {/* Visit store */}
        <a
          href={`${storeUrl}/beats`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          
          <ExternalLink className="h-3 w-3" />
          Visit Store
        </a>
      </div>
    </div>);

}