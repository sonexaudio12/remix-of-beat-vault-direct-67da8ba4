import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Check, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LicenseTemplate {
  id: string;
  type: string;
  name: string;
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

const LICENSE_TYPES = [
  { type: 'mp3', name: 'MP3 Lease' },
  { type: 'wav', name: 'WAV Lease' },
  { type: 'stems', name: 'Trackout (Stems)' },
  { type: 'exclusive', name: 'Exclusive' },
];

export function LicenseTemplatesManager() {
  const [templates, setTemplates] = useState<LicenseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
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
      
      // Get existing template to check for old file
      const existingTemplate = templates.find(t => t.type === type);
      
      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Update database record
      const { error: updateError } = await supabase
        .from('license_templates')
        .update({ 
          file_path: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('type', type);

      if (updateError) throw updateError;

      // Delete old file if it exists
      if (existingTemplate?.file_path) {
        await supabase.storage
          .from('licenses')
          .remove([existingTemplate.file_path]);
      }

      toast.success(`${LICENSE_TYPES.find(l => l.type === type)?.name} template uploaded!`);
      await fetchTemplates();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload template');
    } finally {
      setUploadingType(null);
      // Reset the input
      if (fileInputRefs.current[type]) {
        fileInputRefs.current[type]!.value = '';
      }
    }
  };

  const handleDelete = async (type: string) => {
    const template = templates.find(t => t.type === type);
    if (!template?.file_path) return;

    try {
      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('licenses')
        .remove([template.file_path]);

      if (deleteError) throw deleteError;

      // Update database record
      const { error: updateError } = await supabase
        .from('license_templates')
        .update({ 
          file_path: null,
          updated_at: new Date().toISOString()
        })
        .eq('type', type);

      if (updateError) throw updateError;

      toast.success('Template removed');
      await fetchTemplates();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete template');
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
      <h3 className="font-display font-semibold mb-4">License Templates</h3>
      <p className="text-muted-foreground text-sm mb-4">
        Upload PDF license templates for each tier. These will be automatically included with purchases.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2">
        {LICENSE_TYPES.map(({ type, name }) => {
          const template = templates.find(t => t.type === type);
          const hasFile = !!template?.file_path;
          const isUploading = uploadingType === type;

          return (
            <div key={type} className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{name}</p>
                {hasFile && (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <Check className="h-3 w-3" />
                    Uploaded
                  </div>
                )}
              </div>
              
              {hasFile ? (
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {template.file_path?.split('/').pop()}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">No PDF uploaded yet</p>
              )}

              <div className="flex gap-2">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
