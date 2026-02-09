import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Check, Loader2, Trash2, Power, PowerOff } from 'lucide-react';
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

const LICENSE_TYPES = [
  { type: 'mp3', name: 'MP3 Lease' },
  { type: 'wav', name: 'WAV Lease' },
  { type: 'stems', name: 'Trackout (Stems)' },
  { type: 'exclusive', name: 'Exclusive' },
  { type: 'sound_kit', name: 'Sound Kit License' },
];

export function LicenseTemplatesManager() {
  const [templates, setTemplates] = useState<LicenseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [togglingType, setTogglingType] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('license_templates')
        .select('*')
        .order('type');

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

      const { error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('license_templates')
        .update({ file_path: fileName, updated_at: new Date().toISOString() })
        .eq('type', type);

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
      const { error } = await supabase
        .from('license_templates')
        .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
        .eq('type', type);

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
      const { error: deleteError } = await supabase.storage
        .from('licenses')
        .remove([template.file_path]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('license_templates')
        .update({ file_path: null, updated_at: new Date().toISOString() })
        .eq('type', type);

      if (updateError) throw updateError;

      toast.success('Template removed');
      await fetchTemplates();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const getAssignedProducts = (type: string) => {
    switch (type) {
      case 'sound_kit': return 'Sound Kits';
      case 'exclusive': return 'Exclusive Beat Purchases';
      default: return `Beat ${LICENSE_TYPES.find(l => l.type === type)?.name || type} Purchases`;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold mb-2">License Templates</h3>
      <p className="text-muted-foreground text-sm mb-6">
        Upload PDF license templates for each tier. After a sale, buyer name and purchase date are automatically injected into the template and delivered with the order.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {LICENSE_TYPES.map(({ type, name }) => {
          const template = templates.find(t => t.type === type);
          const hasFile = !!template?.file_path;
          const isUploading = uploadingType === type;
          const isActive = template?.is_active ?? true;

          return (
            <div
              key={type}
              className={`p-4 rounded-lg border transition-colors ${
                isActive
                  ? 'bg-secondary/50 border-border'
                  : 'bg-muted/30 border-border/50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium">{name}</p>
                <div className="flex items-center gap-2">
                  {hasFile && isActive && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {hasFile && !isActive && (
                    <Badge variant="outline" className="text-muted-foreground text-xs">
                      Disabled
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-1">
                Assigned to: {getAssignedProducts(type)}
              </p>

              {hasFile ? (
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {template.file_path?.split('/').pop()}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">No PDF uploaded yet</p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  ref={(el) => (fileInputRefs.current[type] = el)}
                  onChange={(e) => handleFileSelect(type, e)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUploadClick(type)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {hasFile ? 'Replace PDF' : 'Upload PDF'}
                </Button>

                {hasFile && (
                  <>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => handleToggleActive(type, isActive)}
                        disabled={togglingType === type}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(type)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
