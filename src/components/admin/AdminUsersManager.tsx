import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, UserPlus, Trash2, Shield } from 'lucide-react';

interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  created_at: string;
}

export function AdminUsersManager() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Get all admin roles with profile info
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, created_at')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      // Get profile info for each admin
      const adminList: AdminUser[] = [];
      for (const role of roles || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', role.user_id)
          .single();

        adminList.push({
          id: role.id,
          user_id: role.user_id,
          email: profile?.email || 'Unknown',
          created_at: role.created_at,
        });
      }

      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setAdding(true);
    try {
      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAdminEmail.trim().toLowerCase())
        .single();

      if (profileError || !profile) {
        toast.error('User not found. They must sign up first.');
        return;
      }

      // Check if already admin
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.id)
        .eq('role', 'admin')
        .single();

      if (existingRole) {
        toast.error('User is already an admin');
        return;
      }

      // Add admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.id, role: 'admin' });

      if (insertError) throw insertError;

      toast.success('Admin added successfully');
      setNewAdminEmail('');
      fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, email: string | null) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast.success(`Removed admin: ${email}`);
      fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add Admin Form */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Add New Admin</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the email of a registered user to grant them admin access.
        </p>
        <form onSubmit={handleAddAdmin} className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="admin-email" className="sr-only">
              Email Address
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              disabled={adding}
            />
          </div>
          <Button type="submit" disabled={adding || !newAdminEmail.trim()}>
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Admin List */}
      <div className="rounded-xl border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Current Admins</h2>
          <p className="text-sm text-muted-foreground">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} with dashboard access
          </p>
        </div>

        {admins.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No admins found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.email}</TableCell>
                  <TableCell>
                    {new Date(admin.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={admins.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Admin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will revoke admin access for {admin.email}. They
                            will no longer be able to access the dashboard.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
