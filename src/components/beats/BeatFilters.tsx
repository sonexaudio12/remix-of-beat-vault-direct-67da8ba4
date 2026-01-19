import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BeatFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  genreFilter: string;
  onGenreChange: (value: string) => void;
  moodFilter: string;
  onMoodChange: (value: string) => void;
  genres: string[];
  moods: string[];
}

export function BeatFilters({
  searchQuery,
  onSearchChange,
  genreFilter,
  onGenreChange,
  moodFilter,
  onMoodChange,
  genres,
  moods,
}: BeatFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search beats..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-secondary border-border"
        />
      </div>

      {/* Genre Filter */}
      <Select value={genreFilter} onValueChange={onGenreChange}>
        <SelectTrigger className="w-full sm:w-40 bg-secondary border-border">
          <SelectValue placeholder="Genre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Genres</SelectItem>
          {genres.map((genre) => (
            <SelectItem key={genre} value={genre}>
              {genre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Mood Filter */}
      <Select value={moodFilter} onValueChange={onMoodChange}>
        <SelectTrigger className="w-full sm:w-40 bg-secondary border-border">
          <SelectValue placeholder="Mood" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Moods</SelectItem>
          {moods.map((mood) => (
            <SelectItem key={mood} value={mood}>
              {mood}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
