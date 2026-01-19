import { Beat } from '@/types/beat';
import { BeatCard } from './BeatCard';

interface BeatGridProps {
  beats: Beat[];
}

export function BeatGrid({ beats }: BeatGridProps) {
  if (beats.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">No beats found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {beats.map((beat) => (
        <BeatCard key={beat.id} beat={beat} />
      ))}
    </div>
  );
}
