import { useRef } from 'react';
import { Play, Pause, X, Volume2, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Slider } from '@/components/ui/slider';
export function NowPlayingBar() {
  const {
    currentBeat,
    isPlaying,
    progress,
    duration,
    toggle,
    seek,
    pause,
    skipForward,
    skipBackward
  } = useAudioPlayer();
  const progressBarRef = useRef<HTMLDivElement>(null);
  if (!currentBeat) return null;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const progressPercent = duration > 0 ? progress / duration * 100 : 0;
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    seek(Math.max(0, Math.min(newTime, duration)));
  };
  return <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl">
      {/* Progress Bar - Clickable */}
      <div ref={progressBarRef} className="h-2 w-full bg-muted cursor-pointer group hover:h-3 transition-all" onClick={handleProgressClick}>
        <div className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-100 relative" style={{
        width: `${progressPercent}%`
      }}>
          {/* Seek handle - visible on hover */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
        </div>
      </div>

      <div className="container flex h-20 items-center gap-4 bg-[sidebar-accent-foreground] bg-background">
        {/* Beat Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img src={currentBeat.coverUrl} alt={currentBeat.title} className="h-12 w-12 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="font-medium truncate">{currentBeat.title}</p>
            <p className="text-sm text-muted-foreground">
              {currentBeat.bpm} BPM • {currentBeat.genre}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block w-10 text-right">
            {formatTime(progress)}
          </span>
          
          {/* Rewind Button */}
          <Button variant="ghost" size="iconSm" onClick={() => skipBackward(10)} className="text-muted-foreground hover:text-foreground" title="Rewind 10 seconds">
            <SkipBack className="h-4 w-4" />
          </Button>

          {/* Play/Pause Button */}
          <Button variant="player" size="icon" onClick={() => toggle(currentBeat)}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          {/* Forward Button */}
          <Button variant="ghost" size="iconSm" onClick={() => skipForward(10)} className="text-muted-foreground hover:text-foreground" title="Forward 10 seconds">
            <SkipForward className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground hidden sm:block w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume & Close */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider defaultValue={[100]} max={100} step={1} className="w-24" />
          <Button variant="ghost" size="iconSm" onClick={pause} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}