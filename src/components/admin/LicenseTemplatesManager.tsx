import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Check, Loader2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface LicenseTemplate {
  id: string;
  type: string;
  name: string;
  file_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
const LICENSE_TYPES = [{
  type: 'mp3',
  name: 'MP3 Lease'
}, {
  type: 'wav',
  name: 'WAV Lease'
}, {
  type: 'stems',
  name: 'Trackout (Stems)'
}, {
  type: 'exclusive',
  name: 'Exclusive'
}, {
  type: 'sound_kit',
  name: 'Sound Kit License'
}];
const PLACEHOLDERS = [{
  key: '{CONTRACT_DATE}',
  desc: 'Date of purchase'
}, {
  key: '{CURRENT_YEAR}',
  desc: 'Current year'
}, {
  key: '{CUSTOMER_FULLNAME}',
  desc: 'Customer name'
}, {
  key: '{CUSTOMER_EMAIL}',
  desc: 'Customer email'
}, {
  key: '{CUSTOMER_ADDRESS}',
  desc: 'Customer address (optional)'
}, {
  key: '{PRODUCT_TITLE}',
  desc: 'Beat / kit title'
}, {
  key: '{LICENSE_NAME}',
  desc: 'License tier name'
}, {
  key: '{FILE_TYPE}',
  desc: 'MP3 / WAV / STEMS'
}, {
  key: '{PRODUCT_PRICE}',
  desc: 'Purchase price'
}, {
  key: '{ORDER_ID}',
  desc: 'Order reference'
}, {
  key: '{PRODUCT_OWNER_FULLNAME}',
  desc: 'Producer legal name (from Settings)'
}, {
  key: '{PRODUCER_ALIAS}',
  desc: 'Producer brand name (from Settings)'
}, {
  key: '{STATE_PROVINCE_COUNTRY}',
  desc: 'Governing law (from Settings)'
}];
export function LicenseTemplatesManager() {
  const [templates, setTemplates] = useState<LicenseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [togglingType, setTogglingType] = useState<string | null>(null);
  const [previewingType, setPreviewingType] = useState<string | null>(null);
  const fileInputRefs = useRef<{
    [key: string]: HTMLInputElement | null;
  }>({});
  useEffect(() => {
    fetchTemplates();
  }, []);
  const fetchTemplates = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('license_templates').select('*').order('type');
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load license templates');
    } finally {
      setIsLoading(false);
    }
  };
  const handleUploadClick = (type: string) => {
    fileInputRefs.current[type]?.click();
  };
  const handleFileSelect = async (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setUploadingType(type);
    try {
      const fileName = `${type}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const existingTemplate = templates.find(t => t.type === type);
      const {
        error: uploadError
      } = await supabase.storage.from('licenses').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (uploadError) throw uploadError;
      const {
        error: updateError
      } = await supabase.from('license_templates').update({
        file_path: fileName,
        updated_at: new Date().toISOString()
      }).eq('type', type);
      if (updateError) throw updateError;
      if (existingTemplate?.file_path) {
        await supabase.storage.from('licenses').remove([existingTemplate.file_path]);
      }
      toast.success(`${LICENSE_TYPES.find(l => l.type === type)?.name} template uploaded!`);
      await fetchTemplates();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload template');
    } finally {
      setUploadingType(null);
      if (fileInputRefs.current[type]) {
        fileInputRefs.current[type]!.value = '';
      }
    }
  };
  const handleToggleActive = async (type: string, currentActive: boolean) => {
    setTogglingType(type);
    try {
      const {
        error
      } = await supabase.from('license_templates').update({
        is_active: !currentActive,
        updated_at: new Date().toISOString()
      }).eq('type', type);
      if (error) throw error;
      toast.success(`Template ${!currentActive ? 'enabled' : 'disabled'}`);
      await fetchTemplates();
    } catch (error: any) {
      console.error('Toggle error:', error);
      toast.error(error.message || 'Failed to update template');
    } finally {
      setTogglingType(null);
    }
  };
  const handleDelete = async (type: string) => {
    const template = templates.find(t => t.type === type);
    if (!template?.file_path) return;
    try {
      const {
        error: deleteError
      } = await supabase.storage.from('licenses').remove([template.file_path]);
      if (deleteError) throw deleteError;
      const {
        error: updateError
      } = await supabase.from('license_templates').update({
        file_path: null,
        updated_at: new Date().toISOString()
      }).eq('type', type);
      if (updateError) throw updateError;
      toast.success('Template removed');
      await fetchTemplates();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete template');
    }
  };
  const handlePreview = async (type: string) => {
    const template = templates.find(t => t.type === type);
    if (!template?.file_path) {
      toast.error('No PDF uploaded for this template');
      return;
    }
    setPreviewingType(type);
    try {
      const licenseName = LICENSE_TYPES.find(l => l.type === type)?.name || type;
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-license-pdf', {
        body: {
          orderId: 'PREVIEW-001',
          orderItemId: 'preview-item-001',
          itemType: type === 'sound_kit' ? 'sound_kit' : 'beat',
          itemTitle: 'Sample Beat Title',
          licenseName,
          licenseType: type,
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
          customerAddress: '123 Main Street, Los Angeles, CA 90001',
          purchaseDate: new Date().toISOString(),
          price: 49.99,
          bpm: 140,
          genre: 'Trap',
          preview: true
        }
      });
      if (error) throw error;

      // data should be a blob/arraybuffer for preview mode
      if (data instanceof Blob) {
        const url = URL.createObjectURL(data);
        window.open(url, '_blank');
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        // If the function returned JSON instead of PDF, it might be because
        // the edge function invoke doesn't return raw bytes properly
        // Fall back to signed URL preview
        const {
          data: signedData,
          error: signedError
        } = await supabase.storage.from('licenses').createSignedUrl(template.file_path, 300);
        if (signedError) throw signedError;
        window.open(signedData.signedUrl, '_blank');
        toast.info('Showing raw template (placeholder preview requires deployment)');
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error(error.message || 'Failed to preview template');
    } finally {
      setPreviewingType(null);
    }
  };
  const getAssignedProducts = (type: string) => {
    switch (type) {
      case 'sound_kit':
        return 'Sound Kits';
      case 'exclusive':
        return 'Exclusive Beat Purchases';
      default:
        return `Beat ${LICENSE_TYPES.find(l => l.type === type)?.name || type} Purchases`;
    }
  };
  if (isLoading) {
    return <div className="rounded-xl bg-card border border-border p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>;
  }
  return <div className="space-y-6">
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-display font-semibold mb-2">License Templates</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Upload PDF license templates for each tier. Use placeholders like <code className="text-xs px-1.5 py-0.5 rounded text-secondary bg-primary-foreground">{'{CUSTOMER_FULLNAME}'}</code> in your PDFs — they'll be automatically replaced with real data after each purchase.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {LICENSE_TYPES.map(({
          type,
          name
        }) => {
          const template = templates.find(t => t.type === type);
          const hasFile = !!template?.file_path;
          const isUploading = uploadingType === type;
          const isActive = template?.is_active ?? true;
          return <div key={type} className={`p-4 rounded-lg border transition-colors ${isActive ? 'bg-secondary/50 border-border' : 'bg-muted/30 border-border/50 opacity-70'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{name}</p>
                  <div className="flex items-center gap-2">
                    {hasFile && isActive && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>}
                    {hasFile && !isActive && <Badge variant="outline" className="text-muted-foreground text-xs">
                        Disabled
                      </Badge>}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-1">
                  Assigned to: {getAssignedProducts(type)}
                </p>

                {hasFile ? <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {template.file_path?.split('/').pop()}
                  </p> : <p className="text-xs text-muted-foreground mb-3">No PDF uploaded yet</p>}

                <div className="flex items-center gap-2">
                  <input type="file" accept=".pdf,application/pdf" className="hidden" ref={el => fileInputRefs.current[type] = el} onChange={e => handleFileSelect(type, e)} />
                  <Button variant="outline" size="sm" onClick={() => handleUploadClick(type)} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {hasFile ? 'Replace PDF' : 'Upload PDF'}
                  </Button>

                  {hasFile && <>
                      <Button variant="outline" size="sm" onClick={() => handlePreview(type)} disabled={previewingType === type} title="Preview with sample data">
                        {previewingType === type ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Switch checked={isActive} onCheckedChange={() => handleToggleActive(type, isActive)} disabled={togglingType === type} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(type)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>}
                </div>
              </div>;
        })}
        </div>
      </div>

      {/* Placeholder Reference */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-display font-semibold mb-2">Available Placeholders</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Use these placeholders in your PDF templates. They will be replaced with real data when a license is generated after purchase.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {PLACEHOLDERS.map(({
          key,
          desc
        }) => <div key={key} className="flex items-center gap-3 py-1.5">
              <code className="text-xs px-2 py-1 rounded font-mono shrink-0 text-secondary bg-primary-foreground">{key}</code>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </div>)}
        </div>
      </div>
    </div>;
}