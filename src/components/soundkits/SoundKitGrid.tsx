import { SoundKit } from '@/types/soundKit';
import { SoundKitCard } from './SoundKitCard';
import { Archive } from 'lucide-react';

interface SoundKitGridProps {
  soundKits: SoundKit[];
  onAddToCart: (soundKit: SoundKit) => void;
}

export function SoundKitGrid({ soundKits, onAddToCart }: SoundKitGridProps) {
  if (soundKits.length === 0) {
    return (
      <div className="text-center py-12">
        <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display text-lg font-semibold mb-2">No sound kits found</h3>
        <p className="text-muted-foreground">
          Check back later for new releases!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {soundKits.map((kit) => (
        <SoundKitCard
          key={kit.id}
          soundKit={kit}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
