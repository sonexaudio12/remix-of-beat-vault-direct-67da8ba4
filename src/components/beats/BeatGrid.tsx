import { useEffect } from 'react';
import { Beat } from '@/types/beat';
import { BeatCard } from './BeatCard';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface BeatGridProps {
  beats: Beat[];
}

export function BeatGrid({ beats }: BeatGridProps) {
  const { setPlaylist } = useAudioPlayer();

  useEffect(() => {
    if (beats.length > 0) {
      setPlaylist(beats);
    }
  }, [beats, setPlaylist]);

  if (beats.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">No beats found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-background">
      {beats.map((beat) => (
        <BeatCard key={beat.id} beat={beat} />
      ))}
    </div>
  );
}
