import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Tag, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

export function DiscountCodesManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 0,
    max_uses: '',
    expires_at: '',
  });

  useEffect(() => { loadCodes(); }, []);

  const loadCodes = async () => {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load discount codes');
      console.error(error);
    } else {
      setCodes((data as DiscountCode[]) || []);
    }
    setLoading(false);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm(p => ({ ...p, code }));
  };

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error('Code is required'); return; }
    if (form.discount_value <= 0) { toast.error('Discount value must be greater than 0'); return; }
    if (form.discount_type === 'percentage' && form.discount_value > 100) { toast.error('Percentage cannot exceed 100'); return; }

    setSaving(true);
    const { error } = await supabase.from('discount_codes').insert({
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_amount: form.min_order_amount || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
    });

    if (error) {
      if (error.code === '23505') toast.error('A code with this name already exists');
      else toast.error('Failed to create discount code');
      console.error(error);
    } else {
      toast.success('Discount code created');
      setForm({ code: '', discount_type: 'percentage', discount_value: 10, min_order_amount: 0, max_uses: '', expires_at: '' });
      setShowForm(false);
      loadCodes();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('discount_codes').update({ is_active: !isActive }).eq('id', id);
    if (error) toast.error('Failed to update');
    else { toast.success(isActive ? 'Code deactivated' : 'Code activated'); loadCodes(); }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Code deleted'); loadCodes(); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Discount Codes</h2>
          <p className="text-sm text-muted-foreground">Create and manage promotional discount codes</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Code
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Discount Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Code</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. SAVE20"
                    value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="font-mono"
                  />
                  <Button variant="outline" size="sm" onClick={generateCode} type="button">
                    Generate
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(p => ({ ...p, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  min={0}
                  max={form.discount_type === 'percentage' ? 100 : undefined}
                  value={form.discount_value}
                  onChange={e => setForm(p => ({ ...p, discount_value: parseFloat(e.target.value) || 0 }))}
                />
                <p className="text-xs text-muted-foreground">
                  {form.discount_type === 'percentage' ? 'Percentage off (0-100)' : 'Dollar amount off'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Min Order Amount ($)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_order_amount}
                  onChange={e => setForm(p => ({ ...p, min_order_amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Uses (leave blank for unlimited)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={form.max_uses}
                  onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                Create Code
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {codes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No discount codes yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map(code => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {code.discount_type === 'percentage'
                      ? `${code.discount_value}%`
                      : `$${code.discount_value.toFixed(2)}`}
                  </TableCell>
                  <TableCell>{code.min_order_amount > 0 ? `$${code.min_order_amount}` : '—'}</TableCell>
                  <TableCell>{code.current_uses}{code.max_uses ? ` / ${code.max_uses}` : ''}</TableCell>
                  <TableCell>
                    {code.expires_at
                      ? new Date(code.expires_at).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={code.is_active}
                      onCheckedChange={() => toggleActive(code.id, code.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="iconSm" onClick={() => deleteCode(code.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
