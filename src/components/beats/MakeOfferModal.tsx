import { useState } from 'react';
import { Loader2, DollarSign, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Beat } from '@/types/beat';

interface MakeOfferModalProps {
  beat: Beat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MakeOfferModal({ beat, open, onOpenChange }: MakeOfferModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beat) return;

    if (!name.trim() || !email.trim() || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const offerAmount = parseFloat(amount);
    if (isNaN(offerAmount) || offerAmount <= 0) {
      toast.error('Please enter a valid offer amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('exclusive_offers')
        .insert({
          beat_id: beat.id,
          customer_name: name.trim(),
          customer_email: email.trim().toLowerCase(),
          offer_amount: offerAmount,
          message: message.trim() || null,
        });

      if (error) throw error;

      // Send notification email to admin
      await supabase.functions.invoke('send-offer-notification', {
        body: {
          beatId: beat.id,
          beatTitle: beat.title,
          customerName: name.trim(),
          customerEmail: email.trim(),
          offerAmount,
          message: message.trim(),
        },
      });

      toast.success('Your offer has been submitted! We\'ll get back to you soon.');
      onOpenChange(false);
      setName('');
      setEmail('');
      setAmount('');
      setMessage('');
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast.error('Failed to submit offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!beat) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Make an Offer for Exclusive Rights</DialogTitle>
          <DialogDescription>
            Submit your offer for exclusive rights to "{beat.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary flex items-center gap-4">
            <img 
              src={beat.coverUrl} 
              alt={beat.title} 
              className="w-16 h-16 rounded-lg object-cover" 
            />
            <div>
              <h4 className="font-semibold">{beat.title}</h4>
              <p className="text-sm text-muted-foreground">{beat.bpm} BPM • {beat.genre}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-name">Your Name *</Label>
            <Input
              id="offer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-email">Email Address *</Label>
            <Input
              id="offer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-amount">Your Offer Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="offer-amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-message">Message (optional)</Label>
            <Textarea
              id="offer-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your project or why you want exclusive rights..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Offer
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We'll review your offer and respond via email within 24-48 hours.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
