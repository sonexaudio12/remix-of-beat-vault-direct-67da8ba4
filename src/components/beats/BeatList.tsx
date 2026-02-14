import { useEffect } from 'react';
import { Beat } from '@/types/beat';
import { BeatListRow } from './BeatListRow';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useThemeConfig } from '@/hooks/useStoreConfig';
import { BeatPlayerConfig, DEFAULT_BEAT_PLAYER } from '@/types/storeConfig';

interface BeatListProps {
  beats: Beat[];
}

export function BeatList({ beats }: BeatListProps) {
  const { setPlaylist } = useAudioPlayer();
  const { data: themeConfig } = useThemeConfig();
  const playerConfig: BeatPlayerConfig = { ...DEFAULT_BEAT_PLAYER, ...themeConfig?.beatPlayer };

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
    <div className="space-y-1">
      {beats.map((beat, index) => (
        <BeatListRow key={beat.id} beat={beat} index={index} config={playerConfig} />
      ))}
    </div>
  );
}
