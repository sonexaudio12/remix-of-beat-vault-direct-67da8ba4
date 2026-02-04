import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, DollarSign, CheckCircle, XCircle, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Offer {
  id: string;
  beat_id: string;
  customer_name: string;
  customer_email: string;
  offer_amount: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  admin_response: string | null;
  counter_amount: number | null;
  created_at: string;
  beat?: { title: string; cover_url: string | null };
}

export function ExclusiveOffersManager() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [responseText, setResponseText] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('exclusive_offers')
        .select(`
          *,
          beat:beats(title, cover_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers((data as Offer[]) || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleResponse = async (status: 'accepted' | 'rejected' | 'countered') => {
    if (!selectedOffer) return;

    if (status === 'countered' && !counterAmount) {
      toast.error('Please enter a counter amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: any = {
        status,
        admin_response: responseText || null,
      };

      if (status === 'countered') {
        updateData.counter_amount = parseFloat(counterAmount);
      }

      const { error } = await supabase
        .from('exclusive_offers')
        .update(updateData)
        .eq('id', selectedOffer.id);

      if (error) throw error;

      // Send email notification
      await supabase.functions.invoke('send-offer-response', {
        body: {
          offerId: selectedOffer.id,
          customerEmail: selectedOffer.customer_email,
          customerName: selectedOffer.customer_name,
          beatTitle: selectedOffer.beat?.title,
          status,
          adminResponse: responseText,
          counterAmount: status === 'countered' ? parseFloat(counterAmount) : null,
          originalAmount: selectedOffer.offer_amount,
        },
      });

      toast.success(`Offer ${status === 'countered' ? 'countered' : status}!`);
      setSelectedOffer(null);
      setResponseText('');
      setCounterAmount('');
      fetchOffers();
    } catch (error: any) {
      console.error('Error updating offer:', error);
      toast.error('Failed to update offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    accepted: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    countered: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {offers.length} offer{offers.length !== 1 ? 's' : ''} total
        </p>
        <Button variant="outline" size="sm" onClick={fetchOffers}>
          Refresh
        </Button>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-xl bg-card border p-8 text-center">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No exclusive offers yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-xl bg-card border p-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedOffer(offer);
                setResponseText(offer.admin_response || '');
                setCounterAmount(offer.counter_amount?.toString() || '');
              }}
            >
              <div className="flex items-start gap-4">
                {/* Beat Cover */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {offer.beat?.cover_url ? (
                    <img src={offer.beat.cover_url} alt={offer.beat.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">?</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{offer.beat?.title || 'Unknown Beat'}</h3>
                    <Badge variant="outline" className={statusColors[offer.status]}>
                      {offer.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From: <span className="text-foreground">{offer.customer_name}</span> ({offer.customer_email})
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-lg font-bold text-primary">${offer.offer_amount.toFixed(2)}</span>
                    {offer.counter_amount && (
                      <span className="text-sm text-blue-500">
                        Counter: ${offer.counter_amount.toFixed(2)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(offer.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={!!selectedOffer} onOpenChange={(open) => !open && setSelectedOffer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Offer</DialogTitle>
          </DialogHeader>

          {selectedOffer && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-card">
                    {selectedOffer.beat?.cover_url ? (
                      <img src={selectedOffer.beat.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">?</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedOffer.beat?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Offer: <span className="text-primary font-bold">${selectedOffer.offer_amount.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">From:</span> {selectedOffer.customer_name} ({selectedOffer.customer_email})
                </p>
                {selectedOffer.message && (
                  <div className="mt-3 p-3 rounded bg-card">
                    <p className="text-sm text-muted-foreground mb-1">Message:</p>
                    <p className="text-sm">{selectedOffer.message}</p>
                  </div>
                )}
              </div>

              {selectedOffer.status === 'pending' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Response Message (optional)</label>
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Add a message to the customer..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Counter Amount (for counter offer)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        placeholder="Enter counter amount"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 text-green-500 border-green-500/20 hover:bg-green-500/10"
                      onClick={() => handleResponse('accepted')}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-blue-500 border-blue-500/20 hover:bg-blue-500/10"
                      onClick={() => handleResponse('countered')}
                      disabled={isSubmitting || !counterAmount}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Counter
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-500 border-red-500/20 hover:bg-red-500/10"
                      onClick={() => handleResponse('rejected')}
                      disabled={isSubmitting}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </>
              )}

              {selectedOffer.status !== 'pending' && (
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-2">Response sent:</p>
                  <Badge variant="outline" className={statusColors[selectedOffer.status]}>
                    {selectedOffer.status}
                  </Badge>
                  {selectedOffer.admin_response && (
                    <p className="mt-2 text-sm">{selectedOffer.admin_response}</p>
                  )}
                  {selectedOffer.counter_amount && (
                    <p className="mt-2 text-sm text-blue-500">
                      Counter offer: ${selectedOffer.counter_amount.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
