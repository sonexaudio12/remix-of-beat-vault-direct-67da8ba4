import { Check, Music, FileAudio, Archive, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Beat, License } from '@/types/beat';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

interface LicenseModalProps {
  beat: Beat;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const licenseIcons = {
  mp3: Music,
  wav: FileAudio,
  stems: Archive,
};

const variantMap = {
  basic: 'tier' as const,
  premium: 'tierPremium' as const,
  exclusive: 'tierExclusive' as const,
};

export function LicenseModal({ beat, open, onOpenChange }: LicenseModalProps) {
  const { addItem } = useCart();

  const handleAddToCart = (license: License) => {
    addItem(beat, license);
    toast.success(`Added "${beat.title}" (${license.name}) to cart`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Choose License for "{beat.title}"
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 md:grid-cols-3">
          {beat.licenses.map((license) => {
            const Icon = licenseIcons[license.type];
            const colorClass = {
              basic: 'text-primary border-primary/30 hover:border-primary',
              premium: 'text-tier-premium border-tier-premium/30 hover:border-tier-premium',
              exclusive: 'text-tier-exclusive border-tier-exclusive/30 hover:border-tier-exclusive',
            }[license.color];

            return (
              <div
                key={license.id}
                className={`relative flex flex-col rounded-xl border-2 p-5 transition-all ${colorClass} bg-background/50`}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-${license.color === 'basic' ? 'primary' : `tier-${license.color}`}/10`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold">{license.name}</h4>
                    <p className="text-2xl font-bold mt-0.5">${license.price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Includes */}
                <div className="flex-1 space-y-2 mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Includes:
                  </p>
                  <ul className="space-y-1.5">
                    {license.includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Add to Cart Button */}
                <Button
                  variant={variantMap[license.color]}
                  className="w-full mt-auto"
                  onClick={() => handleAddToCart(license)}
                >
                  Add to Cart
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <FileText className="inline h-4 w-4 mr-1" />
          All licenses include a PDF with terms and usage rights
        </div>
      </DialogContent>
    </Dialog>
  );
}
