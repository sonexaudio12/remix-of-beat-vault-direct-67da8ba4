import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { Beat } from '@/types/beat';

interface AudioPlayerContextType {
  currentBeat: Beat | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playlist: Beat[];
  play: (beat: Beat) => void;
  pause: () => void;
  toggle: (beat: Beat) => void;
  seek: (time: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setPlaylist: (beats: Beat[]) => void;
  playNext: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<Beat[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const clearProgressInterval = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const play = (beat: Beat) => {
    if (currentBeat?.id !== beat.id) {
      // Switch to new beat
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(beat.previewUrl);
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        clearProgressInterval();
      });
      setCurrentBeat(beat);
      setProgress(0);
    }

    audioRef.current?.play();
    setIsPlaying(true);

    clearProgressInterval();
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    }, 100);
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    clearProgressInterval();
  };

  const toggle = (beat: Beat) => {
    if (currentBeat?.id === beat.id && isPlaying) {
      pause();
    } else {
      play(beat);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const skipForward = (seconds: number = 10) => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.currentTime + seconds, duration);
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const skipBackward = (seconds: number = 10) => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - seconds, 0);
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const playNext = () => {
    if (!currentBeat || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(b => b.id === currentBeat.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    play(playlist[nextIndex]);
  };

  return (
    <AudioPlayerContext.Provider
      value={{ currentBeat, isPlaying, progress, duration, playlist, play, pause, toggle, seek, skipForward, skipBackward, setPlaylist, playNext }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
