import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useTenant } from '@/hooks/useTenant';
import { NowPlayingBar } from '@/components/beats/NowPlayingBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LicenseModal } from '@/components/beats/LicenseModal';
import { MakeOfferModal } from '@/components/beats/MakeOfferModal';
import { useState } from 'react';
import {
  Play, Pause, ShoppingCart, Download, DollarSign, Share2, Copy,
  Music, ArrowLeft, Loader2, Check, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Beat } from '@/types/beat';

export default function BeatDetail() {
  const { beatId } = useParams<{ beatId: string }>();
  const { currentBeat, isPlaying, toggle } = useAudioPlayer();
  const { tenant, isSaasLanding } = useTenant();
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: beatData, isLoading, error } = useQuery({
    queryKey: ['beat-detail', beatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id, title, bpm, genre, mood, cover_url, preview_url, 
          is_free, is_exclusive_available, is_active, created_at,
          tenant_id,
          tenants(name, slug, custom_domain),
          license_tiers(id, name, type, price, includes, is_active),
          beat_collaborators(id, role, split_percentage, status,
            profiles:collaborator_user_id(display_name, email)
          )
        `)
        .eq('id', beatId!)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!beatId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !beatData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <Music className="h-16 w-16 text-muted-foreground opacity-40" />
        <h1 className="text-2xl font-bold">Beat not found</h1>
        <p className="text-muted-foreground">This beat may have been removed or is no longer available.</p>
        <Link to={isSaasLanding ? '/' : '/beats'}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Browse Beats
          </Button>
        </Link>
      </div>
    );
  }

  // Build Beat object for player/modals
  const activeTiers = (beatData.license_tiers || []).filter((t: any) => t.is_active !== false);
  const beat: Beat = {
    id: beatData.id,
    title: beatData.title,
    bpm: beatData.bpm,
    genre: beatData.genre,
    mood: beatData.mood,
    coverUrl: beatData.cover_url || '/placeholder.svg',
    previewUrl: beatData.preview_url || '',
    isExclusiveAvailable: beatData.is_exclusive_available ?? false,
    createdAt: new Date(beatData.created_at),
    licenses: activeTiers.map((t: any) => ({
      id: t.id,
      type: t.type as 'mp3' | 'wav' | 'stems',
      name: t.name,
      price: t.price,
      includes: t.includes || [],
      color: t.type === 'stems' ? 'exclusive' as const : t.type === 'wav' ? 'premium' as const : 'basic' as const,
    })),
  };

  const isCurrentlyPlaying = currentBeat?.id === beat.id && isPlaying;
  const lowestPrice = beat.licenses.length ? Math.min(...beat.licenses.map(l => l.price)) : null;
  const tenantInfo = beatData.tenants as any;
  const collaborators = ((beatData.beat_collaborators || []) as any[]).filter((c: any) => c.status === 'accepted');

  const shareUrl = window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handlePlay = () => {
    toggle(beat);
  };

  const handleFreeDownload = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-download-urls', {
        body: { beatId: beat.id, licenseType: 'mp3', isFree: true },
      });
      if (error) throw error;
      if (data?.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast.success('Download started!');
      }
    } catch {
      toast.error('Failed to start download');
    }
  };

  function getStoreUrl(): string {
    if (!tenantInfo) return '#';
    if (tenantInfo.custom_domain) return `https://${tenantInfo.custom_domain}`;
    return `https://${tenantInfo.slug}.sonexbeats.shop`;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isSaasLanding && <Header />}

      {/* SaaS header for marketplace context */}
      {isSaasLanding && (
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src="/lovable-uploads/db65a914-2de4-4b0b-8ad2-99b00fbd856a.png" alt="Sonex" className="h-8" />
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to="/landing">
                <Button variant="hero" size="sm" className="gap-1.5">
                  Start Selling <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-14">
        {/* Back link */}
        <Link
          to={isSaasLanding ? '/' : '/beats'}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to beats
        </Link>

        <div className="grid md:grid-cols-[minmax(0,1.2fr)_1fr] gap-8 md:gap-12">
          {/* Left – Artwork & Player */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 shadow-lg">
              <img
                src={beat.coverUrl}
                alt={beat.title}
                className="h-full w-full object-cover"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 hover:opacity-100 transition-opacity">
                <Button variant="player" size="iconLg" onClick={handlePlay}>
                  {isCurrentlyPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
              </div>
              {/* Playing indicator */}
              {isCurrentlyPlaying && (
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-0.5 bg-primary-foreground rounded-full animate-waveform" style={{ height: '14px', animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-primary-foreground">Playing</span>
                </div>
              )}
            </div>

            {/* Share section */}
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 flex-1">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out "${beat.title}" 🔥`)}`, '_blank')}
                className="gap-1.5"
              >
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>

          {/* Right – Info & Licensing */}
          <div className="flex flex-col gap-6">
            {/* Title & Meta */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {(beatData as any).is_free && (
                  <Badge className="bg-green-500 text-white border-0">Free</Badge>
                )}
                {beat.isExclusiveAvailable && (
                  <Badge variant="outline" className="border-primary text-primary">Exclusive Available</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {beat.title}
              </h1>

              {/* Producer / store info */}
              {tenantInfo && isSaasLanding && (
                <a
                  href={getStoreUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-sm text-primary hover:underline"
                >
                  by {tenantInfo.name} <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {collaborators.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Produced by: {collaborators.map((c: any) => c.profiles?.display_name || 'Unknown').join(' × ')}
                </p>
              )}

              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-medium">{beat.bpm} BPM</span>
                <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-medium">{beat.genre}</span>
                <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-medium">{beat.mood}</span>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="rounded-xl border border-border bg-card p-5">
              {(beatData as any).is_free ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-500">FREE</div>
                    <p className="text-sm text-muted-foreground">Download this beat for free</p>
                  </div>
                  <Button onClick={handleFreeDownload} className="gap-1.5 bg-green-500 hover:bg-green-600">
                    <Download className="h-5 w-5" /> Download
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {lowestPrice !== null && (
                        <>
                          <div className="text-2xl font-bold text-primary">${lowestPrice.toFixed(2)}</div>
                          <p className="text-sm text-muted-foreground">Starting price</p>
                        </>
                      )}
                    </div>
                    <Button onClick={() => setShowLicenseModal(true)} className="gap-1.5">
                      <ShoppingCart className="h-5 w-5" /> Buy License
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* License tiers preview */}
            {!((beatData as any).is_free) && beat.licenses.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Available Licenses</h3>
                <div className="space-y-2">
                  {beat.licenses.sort((a, b) => a.price - b.price).map((license) => (
                    <button
                      key={license.id}
                      onClick={() => setShowLicenseModal(true)}
                      className="w-full flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors text-left"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{license.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {license.includes.slice(0, 3).join(' • ')}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">${license.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Make an Offer */}
            {beat.isExclusiveAvailable && !((beatData as any).is_free) && (
              <Button
                variant="outline"
                onClick={() => setShowOfferModal(true)}
                className="gap-2 w-full"
              >
                <DollarSign className="h-4 w-4" /> Make an Offer for Exclusive Rights
              </Button>
            )}

            {/* Visit store (marketplace context) */}
            {isSaasLanding && tenantInfo && (
              <a
                href={`${getStoreUrl()}/beats`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors border border-border rounded-lg p-3"
              >
                <ExternalLink className="h-4 w-4" /> Visit {tenantInfo.name}'s Store
              </a>
            )}
          </div>
        </div>
      </main>

      {!isSaasLanding && <Footer />}

      {currentBeat && <NowPlayingBar />}

      <LicenseModal beat={beat} open={showLicenseModal} onOpenChange={setShowLicenseModal} />
      <MakeOfferModal beat={beat} open={showOfferModal} onOpenChange={setShowOfferModal} />
    </div>
  );
}
