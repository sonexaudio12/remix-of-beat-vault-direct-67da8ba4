import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search, Pencil, Store } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  custom_domain: string | null;
  owner_user_id: string;
  created_at: string;
  owner_email?: string;
}

export function TenantsManager() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load tenants');
      setLoading(false);
      return;
    }

    // Get owner emails
    const enriched: Tenant[] = [];
    for (const t of data || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', t.owner_user_id)
        .single();
      enriched.push({ ...t, owner_email: profile?.email || 'Unknown' });
    }
    setTenants(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleEdit = (tenant: Tenant) => {
    setEditing(tenant);
    setEditPlan(tenant.plan);
    setEditStatus(tenant.status);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from('tenants')
      .update({ plan: editPlan, status: editStatus })
      .eq('id', editing.id);

    if (error) {
      toast.error('Failed to update tenant');
    } else {
      toast.success(`Updated ${editing.name}`);
      setEditing(null);
      fetchTenants();
    }
    setSaving(false);
  };

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    (t.owner_email || '').toLowerCase().includes(search.toLowerCase())
  );

  const planColor = (plan: string) => {
    switch (plan) {
      case 'studio': return 'default';
      case 'pro': return 'secondary';
      default: return 'outline';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'setup': return 'secondary';
      default: return 'destructive';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" /> Tenant Management
          </h2>
          <p className="text-muted-foreground text-sm">{tenants.length} tenants registered</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, slug or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No tenants found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                  <TableCell>{t.owner_email}</TableCell>
                  <TableCell>
                    <Badge variant={planColor(t.plan)}>{t.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(t.status)}>{t.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant: {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Launch ($199)</SelectItem>
                  <SelectItem value="pro">Pro ($499)</SelectItem>
                  <SelectItem value="studio">Studio ($999)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="setup">Setup</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Owner:</strong> {editing?.owner_email}</p>
              <p><strong>Slug:</strong> {editing?.slug}</p>
              <p><strong>Domain:</strong> {editing?.custom_domain || 'None'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
