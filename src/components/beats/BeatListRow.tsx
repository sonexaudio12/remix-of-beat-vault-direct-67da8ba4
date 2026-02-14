import { useState, useMemo } from 'react';
import { Play, Pause, ShoppingCart, Share2, Download, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Beat } from '@/types/beat';
import { BeatPlayerConfig } from '@/types/storeConfig';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { LicenseModal } from './LicenseModal';
import { MakeOfferModal } from './MakeOfferModal';
import { useBeatPlayTracking } from '@/hooks/useAnalyticsTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BeatListRowProps {
  beat: Beat & { isFree?: boolean };
  index: number;
  config: BeatPlayerConfig;
}

export function BeatListRow({ beat, index, config }: BeatListRowProps) {
  const { currentBeat, isPlaying, toggle, progress, duration } = useAudioPlayer();
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { trackPlay } = useBeatPlayTracking();

  const isCurrentlyPlaying = currentBeat?.id === beat.id && isPlaying;
  const isCurrent = currentBeat?.id === beat.id;
  const lowestPrice = Math.min(...beat.licenses.map(l => l.price));
  const progressPercent = isCurrent && duration > 0 ? (progress / duration) * 100 : 0;

  // Generate stable waveform heights
  const waveformBars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => 
      20 + Math.sin(i * 0.5 + index) * 40 + ((i * 7 + index * 13) % 30)
    );
  }, [index]);

  const handlePlay = () => {
    if (!isCurrentlyPlaying) trackPlay(beat.id);
    toggle(beat);
  };

  const handleFreeDownload = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-download-urls', {
        body: { beatId: beat.id, licenseType: 'mp3', isFree: true },
      });
      if (error) throw error;
      if (data?.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast.success('Download started!');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to start download');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/beats?track=${beat.id}`);
      toast.success('Link copied!');
    } catch {
      toast.info('Could not copy link');
    }
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg transition-all duration-200 ${
          isCurrent
            ? 'bg-primary/8 border border-primary/20'
            : 'hover:bg-card/80 border border-transparent hover:border-border/50'
        }`}
      >
        {/* Track number / Play button */}
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          {isHovered || isCurrent ? (
            <button
              onClick={handlePlay}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isCurrentlyPlaying
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              {isCurrentlyPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 ml-0.5" />
              )}
            </button>
          ) : (
            <span className="text-sm text-muted-foreground font-mono">{index + 1}</span>
          )}
        </div>

        {/* Cover art */}
        {config.showCover && (
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-md overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={beat.coverUrl}
              alt={beat.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title + Tags */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm truncate ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
              {beat.title}
            </p>
            {isCurrentlyPlaying && (
              <div className="flex gap-0.5 items-end">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-primary rounded-full animate-waveform"
                    style={{ height: '10px', animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
          {config.showTags && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{beat.genre}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">{beat.mood}</span>
            </div>
          )}
        </div>

        {/* BPM */}
        {config.showBpm && (
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
              {beat.bpm} BPM
            </span>
          </div>
        )}

        {/* Waveform / Progress */}
        {config.showWaveform && (
          isCurrent ? (
            <div className="hidden lg:flex items-center flex-shrink-0 w-32">
              <div className="flex items-end gap-px h-6 w-full">
                {waveformBars.map((h, i) => {
                  const barProgress = (i / waveformBars.length) * 100;
                  const isPlayed = barProgress <= progressPercent;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-all duration-150 ${
                        isPlayed ? 'bg-primary' : 'bg-muted-foreground/20'
                      } ${isCurrentlyPlaying && isPlayed ? 'animate-waveform' : ''}`}
                      style={{
                        height: `${h}%`,
                        animationDelay: isCurrentlyPlaying && isPlayed ? `${(i % 5) * 0.1}s` : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex items-center flex-shrink-0 w-32">
              <div className="flex items-end gap-px h-6 w-full">
                {waveformBars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-muted-foreground/15 rounded-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          )
        )}

        {/* Share button */}
        {config.showShareButton && (
          <button
            onClick={handleShare}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Offer button */}
        {beat.isExclusiveAvailable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOfferModal(true)}
            className="hidden sm:inline-flex gap-1 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 h-8 px-2"
          >
            <DollarSign className="h-3 w-3" />
            <span className="hidden xl:inline">Offer</span>
          </Button>
        )}

        {/* Price + Buy */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {beat.isFree ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleFreeDownload}
              className="gap-1.5 bg-green-500 hover:bg-green-600 h-8 text-xs px-3"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Free</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowLicenseModal(true)}
              className="gap-1.5 h-8 text-xs px-3"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="font-bold">${lowestPrice.toFixed(2)}</span>
            </Button>
          )}
        </div>

        {/* Badges */}
        <div className="flex gap-1 flex-shrink-0">
          {beat.isFree && (
            <span className="text-[10px] font-bold bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded">
              FREE
            </span>
          )}
          {beat.isExclusiveAvailable && (
            <span className="hidden sm:inline text-[10px] font-bold bg-tier-exclusive/20 text-tier-exclusive px-1.5 py-0.5 rounded">
              EXCL
            </span>
          )}
        </div>
      </div>

      <LicenseModal beat={beat} open={showLicenseModal} onOpenChange={setShowLicenseModal} />
      <MakeOfferModal beat={beat} open={showOfferModal} onOpenChange={setShowOfferModal} />
    </>
  );
}
