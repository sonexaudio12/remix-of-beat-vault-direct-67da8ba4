import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export function CTASection({
  title = 'Ready to Create?',
  subtitle = 'Browse our catalog and find the perfect beat for your next project.',
  ctaText = 'Get Started',
  ctaLink = '/beats',
}: CTASectionProps) {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="relative rounded-2xl border border-border bg-card/50 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)_/_0.08)_0%,transparent_70%)]" />
          <div className="relative text-center px-6 py-16 md:py-24">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{title}</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">{subtitle}</p>
            <Button variant="hero" size="xl" onClick={() => navigate(ctaLink)}>
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
