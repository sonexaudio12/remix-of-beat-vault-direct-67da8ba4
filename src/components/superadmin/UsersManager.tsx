import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Search, Shield, ShieldOff, Users } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  is_admin: boolean;
  tenant_name: string | null;
}

export function UsersManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load users');
      setLoading(false);
      return;
    }

    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const { data: tenants } = await supabase
      .from('tenants')
      .select('owner_user_id, name');

    const adminSet = new Set((adminRoles || []).map(r => r.user_id));
    const tenantMap = new Map((tenants || []).map(t => [t.owner_user_id, t.name]));

    const enriched: UserProfile[] = (profiles || []).map(p => ({
      ...p,
      is_admin: adminSet.has(p.id),
      tenant_name: tenantMap.get(p.id) || null,
    }));

    setUsers(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    setToggling(userId);
    try {
      if (currentlyAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
        toast.success('Admin role removed');
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
        toast.success('Admin role granted');
      }
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    } finally {
      setToggling(null);
    }
  };

  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" /> User Management
        </h2>
        <p className="text-muted-foreground text-sm">{users.length} registered users</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email || 'N/A'}</TableCell>
                  <TableCell>{u.display_name || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_admin ? 'default' : 'outline'}>
                      {u.is_admin ? 'Admin' : 'Customer'}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.tenant_name || '—'}</TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={toggling === u.id}
                          title={u.is_admin ? 'Remove admin' : 'Grant admin'}
                        >
                          {toggling === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.is_admin ? (
                            <ShieldOff className="h-4 w-4 text-destructive" />
                          ) : (
                            <Shield className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {u.is_admin ? 'Remove Admin Access?' : 'Grant Admin Access?'}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {u.is_admin
                              ? `This will revoke admin privileges for ${u.email}.`
                              : `This will grant admin privileges to ${u.email}.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => toggleAdmin(u.id, u.is_admin)}>
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
