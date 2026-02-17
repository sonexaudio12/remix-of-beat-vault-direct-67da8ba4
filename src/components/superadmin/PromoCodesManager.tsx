import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Tag } from 'lucide-react';

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  current_uses: number;
  max_uses: number | null;
  expires_at: string | null;
  tenant_id: string | null;
  created_at: string;
}

export function PromoCodesManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState('percentage');
  const [newValue, setNewValue] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newExpires, setNewExpires] = useState('');

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load promo codes');
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async () => {
    if (!newCode.trim() || !newValue) return;
    setSaving(true);

    const { error } = await supabase.from('discount_codes').insert({
      code: newCode.trim().toUpperCase(),
      discount_type: newType,
      discount_value: parseFloat(newValue),
      max_uses: newMaxUses ? parseInt(newMaxUses) : null,
      expires_at: newExpires || null,
    });

    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Code already exists' : 'Failed to create code');
    } else {
      toast.success('Promo code created');
      setShowCreate(false);
      setNewCode('');
      setNewValue('');
      setNewMaxUses('');
      setNewExpires('');
      fetchCodes();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('discount_codes')
      .update({ is_active: !current })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchCodes();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Promo code deleted');
      fetchCodes();
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
            <Tag className="h-6 w-6" /> Platform Promo Codes
          </h2>
          <p className="text-muted-foreground text-sm">{codes.length} codes created</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Code
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No promo codes yet
                </TableCell>
              </TableRow>
            ) : (
              codes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.discount_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`}
                  </TableCell>
                  <TableCell>
                    {c.current_uses}{c.max_uses ? ` / ${c.max_uses}` : ''}
                  </TableCell>
                  <TableCell>
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={() => toggleActive(c.id, c.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {c.code}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This promo code will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground">
                            Delete
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                placeholder="e.g. SUMMER25"
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  placeholder={newType === 'percentage' ? '25' : '10.00'}
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Uses (optional)</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={newMaxUses}
                  onChange={e => setNewMaxUses(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expires (optional)</Label>
                <Input
                  type="date"
                  value={newExpires}
                  onChange={e => setNewExpires(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !newCode.trim() || !newValue}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
