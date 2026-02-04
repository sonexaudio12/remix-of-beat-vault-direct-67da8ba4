import { Play, Pause, ShoppingCart, Download, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Beat } from '@/types/beat';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useState } from 'react';
import { LicenseModal } from './LicenseModal';
import { MakeOfferModal } from './MakeOfferModal';
import { useBeatPlayTracking } from '@/hooks/useAnalyticsTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BeatCardProps {
  beat: Beat & { isFree?: boolean };
}

export function BeatCard({ beat }: BeatCardProps) {
  const { currentBeat, isPlaying, toggle } = useAudioPlayer();
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const { trackPlay } = useBeatPlayTracking();

  const isCurrentlyPlaying = currentBeat?.id === beat.id && isPlaying;
  const lowestPrice = Math.min(...beat.licenses.map((l) => l.price));

  const handlePlay = () => {
    if (!isCurrentlyPlaying) {
      trackPlay(beat.id);
    }
    toggle(beat);
  };

  const handleFreeDownload = async () => {
    try {
      // Get download URL from edge function
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

  return (
    <>
      <div className="beat-card group border border-border/50">
        {/* Cover Image */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={beat.coverUrl}
            alt={beat.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Button
              variant="player"
              size="iconLg"
              onClick={handlePlay}
              className="transform scale-90 group-hover:scale-100 transition-transform"
            >
              {isCurrentlyPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </Button>
          </div>

          {/* Now Playing Indicator */}
          {isCurrentlyPlaying && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5">
              <div className="flex gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-primary-foreground rounded-full animate-waveform"
                    style={{
                      height: '12px',
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-primary-foreground">Playing</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {beat.isFree && (
              <div className="license-badge bg-green-500 text-white">
                Free
              </div>
            )}
            {beat.isExclusiveAvailable && (
              <div className="license-badge license-badge-exclusive">
                Exclusive
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-display font-semibold text-lg leading-tight truncate">
                {beat.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{beat.bpm} BPM</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span>{beat.genre}</span>
              </div>
            </div>
            <div className="text-right">
              {beat.isFree ? (
                <>
                  <div className="text-lg font-bold text-green-500">FREE</div>
                  <div className="text-xs text-muted-foreground">download</div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-primary">
                    ${lowestPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">starting at</div>
                </>
              )}
            </div>
          </div>

          {/* Mood Tag & Actions */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-secondary text-secondary-foreground">
              {beat.mood}
            </span>
            
            <div className="flex gap-2">
              {beat.isExclusiveAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOfferModal(true)}
                  className="gap-1 text-xs"
                  title="Make an offer for exclusive rights"
                >
                  <DollarSign className="h-3 w-3" />
                  Offer
                </Button>
              )}
              
              {beat.isFree ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleFreeDownload}
                  className="gap-1.5 bg-green-500 hover:bg-green-600"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowLicenseModal(true)}
                  className="gap-1.5"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Buy
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <LicenseModal
        beat={beat}
        open={showLicenseModal}
        onOpenChange={setShowLicenseModal}
      />

      <MakeOfferModal
        beat={beat}
        open={showOfferModal}
        onOpenChange={setShowOfferModal}
      />
    </>
  );
}
