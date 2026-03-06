import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Collaborator {
  id?: string;
  collaborator_user_id: string;
  split_percentage: number;
  role: string;
  status: string;
  display_name?: string;
  email?: string;
}

interface BeatCollaboratorsProps {
  beatId?: string; // null for new beats
  tenantId?: string;
  collaborators: Collaborator[];
  ownerSplitPercentage: number;
  onCollaboratorsChange: (collaborators: Collaborator[]) => void;
  onOwnerSplitChange: (split: number) => void;
}

const roles = ['co-producer', 'producer', 'engineer', 'songwriter', 'vocalist'];

export function BeatCollaborators({
  beatId,
  tenantId,
  collaborators,
  ownerSplitPercentage,
  onCollaboratorsChange,
  onOwnerSplitChange,
}: BeatCollaboratorsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; display_name: string | null; email: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  const totalCollabSplit = collaborators.reduce((sum, c) => sum + c.split_percentage, 0);
  const totalSplit = ownerSplitPercentage + totalCollabSplit;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;

      // Filter out already-added collaborators
      const existingIds = collaborators.map(c => c.collaborator_user_id);
      setSearchResults((data || []).filter(p => !existingIds.includes(p.id)));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const addCollaborator = (profile: { id: string; display_name: string | null; email: string | null }) => {
    const newCollab: Collaborator = {
      collaborator_user_id: profile.id,
      split_percentage: 0,
      role: 'co-producer',
      status: 'pending',
      display_name: profile.display_name || undefined,
      email: profile.email || undefined,
    };
    onCollaboratorsChange([...collaborators, newCollab]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeCollaborator = (index: number) => {
    const removed = collaborators[index];
    const updated = collaborators.filter((_, i) => i !== index);
    onCollaboratorsChange(updated);
    // Add the removed split back to owner
    onOwnerSplitChange(ownerSplitPercentage + removed.split_percentage);
  };

  const updateCollaboratorSplit = (index: number, value: string) => {
    const newSplit = parseFloat(value) || 0;
    const oldSplit = collaborators[index].split_percentage;
    const diff = newSplit - oldSplit;

    if (ownerSplitPercentage - diff < 0) {
      toast.error('Owner split cannot go below 0%');
      return;
    }

    const updated = [...collaborators];
    updated[index] = { ...updated[index], split_percentage: newSplit };
    onCollaboratorsChange(updated);
    onOwnerSplitChange(ownerSplitPercentage - diff);
  };

  const updateCollaboratorRole = (index: number, role: string) => {
    const updated = [...collaborators];
    updated[index] = { ...updated[index], role };
    onCollaboratorsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <Label className="text-base font-semibold">Collaborators</Label>
      </div>

      {/* Owner split */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
        <span className="font-medium text-sm flex-1">You (Owner)</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            max="100"
            value={ownerSplitPercentage}
            onChange={(e) => {
              const newOwner = parseFloat(e.target.value) || 0;
              if (newOwner + totalCollabSplit > 100) {
                toast.error('Total split cannot exceed 100%');
                return;
              }
              onOwnerSplitChange(newOwner);
            }}
            className="w-20 text-center"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      {/* Collaborator list */}
      {collaborators.map((collab, index) => (
        <div key={collab.collaborator_user_id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {collab.display_name || collab.email || 'Unknown'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Select value={collab.role} onValueChange={(v) => updateCollaboratorRole(index, v)}>
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant={collab.status === 'accepted' ? 'default' : collab.status === 'declined' ? 'destructive' : 'secondary'} className="text-[10px]">
                {collab.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              value={collab.split_percentage}
              onChange={(e) => updateCollaboratorSplit(index, e.target.value)}
              className="w-20 text-center"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeCollaborator(index)} className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Total indicator */}
      <div className={`text-sm font-medium ${totalSplit === 100 ? 'text-green-500' : 'text-destructive'}`}>
        Total: {totalSplit}% {totalSplit !== 100 && '(must equal 100%)'}
      </div>

      {/* Search to add */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
        </div>

        {searchResults.length > 0 && (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {searchResults.map(profile => (
              <button
                key={profile.id}
                type="button"
                onClick={() => addCollaborator(profile)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <UserPlus className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{profile.display_name || 'No name'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
