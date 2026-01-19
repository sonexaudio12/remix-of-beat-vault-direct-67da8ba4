import { Play, Pause, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Slider } from '@/components/ui/slider';

export function NowPlayingBar() {
  const { currentBeat, isPlaying, progress, duration, toggle, seek, pause } = useAudioPlayer();

  if (!currentBeat) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl">
      {/* Progress Bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="container flex h-20 items-center gap-4">
        {/* Beat Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={currentBeat.coverUrl}
            alt={currentBeat.title}
            className="h-12 w-12 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="font-medium truncate">{currentBeat.title}</p>
            <p className="text-sm text-muted-foreground">
              {currentBeat.bpm} BPM • {currentBeat.genre}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {formatTime(progress)}
          </span>
          
          <Button
            variant="player"
            size="icon"
            onClick={() => toggle(currentBeat)}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <span className="text-sm text-muted-foreground hidden sm:block">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume & Close */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            defaultValue={[100]}
            max={100}
            step={1}
            className="w-24"
          />
          <Button
            variant="ghost"
            size="iconSm"
            onClick={pause}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
