import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, BarChart3, Shield, Globe, Zap, Palette } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 49,
    features: [
      'Your own beat store',
      'Custom subdomain',
      'Up to 50 beats',
      'Stripe & PayPal payments',
      'License PDF generation',
    ],
  },
  {
    name: 'Pro',
    price: 99,
    popular: true,
    features: [
      'Everything in Starter',
      'Custom domain support',
      'Unlimited beats & sound kits',
      'Services (mixing/mastering)',
      'Advanced analytics',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 199,
    features: [
      'Everything in Pro',
      'White-label branding',
      'Multiple storefronts',
      'Dedicated support',
      'Custom integrations',
      'API access',
    ],
  },
];

const features = [
  { icon: Music, title: 'Beat Store', desc: 'Upload and sell beats with tiered licensing (MP3, WAV, Stems).' },
  { icon: Shield, title: 'Auto Licensing', desc: 'PDF licenses generated automatically for every purchase.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track plays, views, and revenue in real-time.' },
  { icon: Globe, title: 'Custom Domain', desc: 'Connect your own domain for a professional look.' },
  { icon: Zap, title: 'Instant Setup', desc: 'Get your store live in minutes, not days.' },
  { icon: Palette, title: 'Full Branding', desc: 'Customize colors, fonts, logo, and layout.' },
];

export default function SaasLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <span className="text-xl font-bold tracking-tight">Sonex</span>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <a href="#pricing">
              <Button size="sm">Get Started</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your Beat Store.{' '}
            <span className="text-primary">Your Brand.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Launch a professional beat selling website in minutes. Upload beats, set licenses, accept payments, and grow your music business — all under your own domain.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="#pricing">
              <Button size="lg" className="text-base px-8">
                Start Selling Today
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-base px-8">
                See Features
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-border bg-card">
                <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-muted-foreground mb-12">One-time payment. No monthly fees. Own it forever.</p>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 flex flex-col ${
                  plan.popular
                    ? 'border-primary ring-2 ring-primary/20 bg-card'
                    : 'border-border bg-card'
                }`}
              >
                {plan.popular && (
                  <span className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground ml-1">one-time</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Get {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Sonex. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
