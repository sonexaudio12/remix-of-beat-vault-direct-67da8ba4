import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Service {
  id: string;
  title: string;
  type: string;
  description: string | null;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'mixing', description: '', price: '0', sort_order: '0' });
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('sort_order');
    setServices((data as Service[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    const { error } = await supabase.from('services').insert({
      title: form.title,
      type: form.type,
      description: form.description || null,
      price: parseFloat(form.price),
      sort_order: parseInt(form.sort_order),
    });
    if (error) toast.error('Failed to create service');
    else { toast.success('Service created'); setCreating(false); fetchServices(); }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from('services').update({
      title: form.title,
      type: form.type,
      description: form.description || null,
      price: parseFloat(form.price),
      sort_order: parseInt(form.sort_order),
    }).eq('id', editing.id);
    if (error) toast.error('Failed to update');
    else { toast.success('Updated'); setEditing(null); fetchServices(); }
    setSaving(false);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from('services').update({ is_active: active }).eq('id', id);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchServices(); }
  };

  const startEdit = (s: Service) => {
    setEditing(s);
    setForm({ title: s.title, type: s.type, description: s.description || '', price: String(s.price), sort_order: String(s.sort_order) });
  };

  const startCreate = () => {
    setCreating(true);
    setForm({ title: '', type: 'mixing', description: '', price: '0', sort_order: '0' });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Services ({services.length})</h2>
        <Button size="sm" onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> Add Service</Button>
      </div>

      {(creating || editing) && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold">{editing ? 'Edit Service' : 'New Service'}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixing">Mixing</SelectItem>
                  <SelectItem value="mastering">Mastering</SelectItem>
                  <SelectItem value="mixing_mastering">Mixing + Mastering</SelectItem>
                  <SelectItem value="custom_beat">Custom Beat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={editing ? handleUpdate : handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Save</>}
            </Button>
            <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); }}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {services.map(s => (
          <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-4">
              <Switch checked={s.is_active} onCheckedChange={v => handleToggleActive(s.id, v)} />
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.type.replace('_', ' ')} • ${s.price}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
