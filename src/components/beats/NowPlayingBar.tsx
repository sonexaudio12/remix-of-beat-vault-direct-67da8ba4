import { useRef, useState, useCallback } from 'react';
import { Play, Pause, X, Volume2, VolumeX, SkipBack, SkipForward, ShoppingCart, Share2, Repeat, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Slider } from '@/components/ui/slider';
import { LicenseModal } from './LicenseModal';
import { toast } from 'sonner';

export function NowPlayingBar() {
  const {
    currentBeat,
    isPlaying,
    progress,
    duration,
    toggle,
    seek,
    pause,
    playNext,
    playPrevious,
    playlist
  } = useAudioPlayer();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    seek(Math.max(0, Math.min(newTime, duration)));
  }, [duration, seek]);

  const handleShare = async () => {
    if (!currentBeat) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/beats?track=${currentBeat.id}`);
      toast.success('Link copied!');
    } catch {
      toast.info('Could not copy link');
    }
  };

  if (!currentBeat) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? progress / duration * 100 : 0;
  const lowestPrice = Math.min(...currentBeat.licenses.map((l) => l.price));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-border shadow-2xl bg-background">
      {/* Progress Bar */}
      <div
        ref={progressBarRef}
        className="h-1 w-full bg-muted/50 cursor-pointer group hover:h-1.5 transition-all relative"
        onClick={handleProgressClick}>

        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-100 relative"
          style={{ width: `${progressPercent}%` }}>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-primary/30" />
        </div>
      </div>

      <div className="container flex h-[72px] items-center gap-3 md:gap-4 bg-background">
        {/* Beat Info - Left */}
        <div className="flex items-center gap-3 min-w-0 w-[30%]">
          <div className="relative flex-shrink-0">
            <img
              src={currentBeat.coverUrl}
              alt={currentBeat.title}
              className={`h-12 w-12 rounded-lg object-cover shadow-md ${isPlaying ? 'ring-2 ring-primary/30' : ''}`} />

            {isPlaying &&
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-card animate-pulse" />
            }
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{currentBeat.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {currentBeat.bpm} BPM • {currentBeat.genre} • {currentBeat.mood}
            </p>
          </div>
        </div>

        {/* Controls - Center */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="flex items-center gap-1 sm:gap-3">
            <Button
              variant="ghost"
              size="iconSm"
              onClick={playPrevious}
              className="text-muted-foreground hover:text-foreground h-8 w-8"
              disabled={playlist.length === 0}>

              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="player"
              size="icon"
              onClick={() => toggle(currentBeat)}
              className="h-10 w-10 rounded-full">

              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>

            <Button
              variant="ghost"
              size="iconSm"
              onClick={playNext}
              className="text-muted-foreground hover:text-foreground h-8 w-8"
              disabled={playlist.length === 0}>

              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Time display - mobile only */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground sm:hidden">
            <span>{formatTime(progress)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Time display - desktop */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="w-8 text-right font-mono">{formatTime(progress)}</span>
            <span>/</span>
            <span className="w-8 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-2 w-[30%] justify-end">
          {/* Buy button */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowLicenseModal(true)}
            className="gap-1.5 h-8 text-xs">

            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-bold">${lowestPrice.toFixed(2)}</span>
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={handleShare}
            className="hidden md:inline-flex text-muted-foreground hover:text-foreground h-8 w-8">

            <Share2 className="h-3.5 w-3.5" />
          </Button>

          {/* Volume */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setMuted(!muted)}
              className="text-muted-foreground hover:text-foreground transition-colors">

              {muted || volume === 0 ?
              <VolumeX className="h-4 w-4" /> :

              <Volume2 className="h-4 w-4" />
              }
            </button>
            <Slider
              value={[muted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={([v]) => {setVolume(v);setMuted(v === 0);}}
              className="w-20" />

          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={pause}
            className="text-muted-foreground hover:text-foreground h-8 w-8">

            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <LicenseModal beat={currentBeat} open={showLicenseModal} onOpenChange={setShowLicenseModal} />
    </div>);

}