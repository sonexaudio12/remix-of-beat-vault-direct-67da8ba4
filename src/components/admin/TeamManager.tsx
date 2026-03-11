import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Loader2, Trash2, Shield, Crown, Eye, Music } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TeamMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  invited_email: string | null;
  status: string;
  created_at: string;
  profile?: { email: string | null; display_name: string | null };
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  owner: {
    label: 'Owner',
    icon: <Crown className="h-4 w-4" />,
    color: 'text-yellow-500',
    description: 'Full access. Can manage team, billing, and all settings.',
  },
  manager: {
    label: 'Manager',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-blue-500',
    description: 'Can manage beats, orders, services, and team members.',
  },
  producer: {
    label: 'Producer',
    icon: <Music className="h-4 w-4" />,
    color: 'text-green-500',
    description: 'Can upload/manage beats and sound kits.',
  },
  viewer: {
    label: 'Viewer',
    icon: <Eye className="h-4 w-4" />,
    color: 'text-muted-foreground',
    description: 'Read-only access to dashboard and analytics.',
  },
};

export function TeamManager() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('producer');
  const [inviting, setInviting] = useState(false);

  const isStudioPlan = tenant?.plan === 'studio';
  const isOwner = tenant?.owner_user_id === user?.id;

  useEffect(() => {
    if (!tenant || !isStudioPlan) return;
    loadMembers();
  }, [tenant]);

  const loadMembers = async () => {
    if (!tenant) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('tenant_members' as any)
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading team:', error);
      toast.error('Failed to load team members');
      setLoading(false);
      return;
    }

    const memberData = (data as any[]) || [];

    // Fetch profiles for each member
    const userIds = memberData.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const enriched = memberData.map((m) => ({
      ...m,
      profile: profileMap.get(m.user_id) || null,
    }));

    setMembers(enriched as TeamMember[]);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!tenant || !inviteEmail.trim()) return;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setInviting(true);

    // Look up user by email in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail.trim().toLowerCase())
      .maybeSingle();

    if (!profile) {
      toast.error('No account found with that email. The user must sign up first.');
      setInviting(false);
      return;
    }

    // Check if already a member
    const existing = members.find((m) => m.user_id === profile.id);
    if (existing) {
      toast.error('This user is already a team member');
      setInviting(false);
      return;
    }

    const { error } = await supabase
      .from('tenant_members' as any)
      .insert({
        tenant_id: tenant.id,
        user_id: profile.id,
        role: inviteRole,
        invited_by: user?.id,
        invited_email: inviteEmail.trim().toLowerCase(),
        status: 'active',
      } as any);

    if (error) {
      console.error('Invite error:', error);
      if (error.code === '23505') {
        toast.error('This user is already on the team');
      } else {
        toast.error('Failed to add team member');
      }
    } else {
      toast.success(`${inviteEmail} added as ${ROLE_CONFIG[inviteRole]?.label}`);
      setInviteEmail('');
      setInviteRole('producer');
      setInviteOpen(false);
      loadMembers();
    }
    setInviting(false);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member?.role === 'owner') {
      toast.error('Cannot change the owner role');
      return;
    }

    const { error } = await supabase
      .from('tenant_members' as any)
      .update({ role: newRole } as any)
      .eq('id', memberId);

    if (error) {
      toast.error('Failed to update role');
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      toast.success('Role updated');
    }
  };

  const handleRemove = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member?.role === 'owner') {
      toast.error('Cannot remove the owner');
      return;
    }

    const { error } = await supabase
      .from('tenant_members' as any)
      .delete()
      .eq('id', memberId);

    if (error) {
      toast.error('Failed to remove member');
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('Member removed');
    }
  };

  if (!isStudioPlan) {
    return (
      <div className="text-center py-16">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Label Mode — Team Management</h3>
        <p className="text-muted-foreground mb-2 max-w-md mx-auto">
          Add multiple producers and team members to your store. Assign roles like Producer, Manager, or Viewer.
        </p>
        <p className="text-sm text-muted-foreground mb-6">Available on the Studio plan.</p>
        <Button variant="outline" asChild>
          <a href="/upgrade">Upgrade to Studio</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-lg">Team Members</h3>
            <p className="text-sm text-muted-foreground">
              {members.filter((m) => m.status === 'active').length} active members
            </p>
          </div>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="producer@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground">
                  The user must already have a Sonex account.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG)
                      .filter(([key]) => key !== 'owner')
                      .map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span className={config.color}>{config.icon}</span>
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role description */}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  {ROLE_CONFIG[inviteRole]?.description}
                </p>
              </div>

              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="w-full gap-2"
              >
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Add to Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(ROLE_CONFIG).map(([key, config]) => (
          <div key={key} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={config.color}>{config.icon}</span>
              <span className="font-medium text-sm">{config.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        ))}
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No team members yet</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
                const displayName =
                  member.profile?.display_name ||
                  member.profile?.email ||
                  member.invited_email ||
                  'Unknown';
                const displayEmail = member.profile?.email || member.invited_email || '';

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{displayName}</p>
                        {displayEmail && displayName !== displayEmail && (
                          <p className="text-xs text-muted-foreground">{displayEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.role === 'owner' || !isOwner ? (
                        <div className="flex items-center gap-2">
                          <span className={roleConfig.color}>{roleConfig.icon}</span>
                          <span className="text-sm">{roleConfig.label}</span>
                        </div>
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleRoleChange(member.id, val)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_CONFIG)
                              .filter(([key]) => key !== 'owner')
                              .map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <span className={config.color}>{config.icon}</span>
                                    <span>{config.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(member.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {member.role !== 'owner' && isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
