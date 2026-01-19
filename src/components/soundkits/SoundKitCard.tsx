import { ShoppingCart, Archive, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SoundKit } from '@/types/soundKit';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

interface SoundKitCardProps {
  soundKit: SoundKit;
  onAddToCart: (soundKit: SoundKit) => void;
}

export function SoundKitCard({ soundKit, onAddToCart }: SoundKitCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = () => {
    if (!soundKit.previewUrl) {
      toast.info('No preview available for this sound kit');
      return;
    }
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(soundKit.previewUrl);
        audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(soundKit);
    toast.success(`${soundKit.title} added to cart`);
  };

  return (
    <div className="group relative rounded-2xl bg-card border border-border overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Cover Image */}
      <div className="relative aspect-square">
        {soundKit.coverUrl ? (
          <img
            src={soundKit.coverUrl}
            alt={soundKit.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <Archive className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Play Overlay */}
        {soundKit.previewUrl && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary/90 backdrop-blur-sm">
            {soundKit.category}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold truncate mb-1">{soundKit.title}</h3>
        {soundKit.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {soundKit.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            ${soundKit.price.toFixed(2)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCart}
            className="gap-1.5"
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
