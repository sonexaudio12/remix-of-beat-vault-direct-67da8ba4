import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FileText, Globe, Mail, BarChart3, Zap, Tag,
  Smartphone, DollarSign, ArrowRight, Check, X,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

const painPoints = [
  'Monthly subscriptions eat margin before you sell.',
  'Marketplace fees take a cut from every beat.',
  'Algorithm shifts can bury your catalog overnight.',
];

const valueProps = [
  {
    title: 'Keep your revenue',
    desc: 'Sonex gives you a private store where your money flows directly through your own Stripe account.',
  },
  {
    title: 'Own your audience',
    desc: 'Capture buyer emails and build long-term customer relationships without platform lock-in.',
  },
  {
    title: 'Control your brand',
    desc: 'Run your own branded beat storefront with custom domain support and flexible layout options.',
  },
];

const steps = [
  { step: 1, title: 'Purchase plan', desc: 'Pick the Sonex plan that fits your current growth stage.' },
  { step: 2, title: 'Connect Stripe', desc: 'Link Stripe once and get paid directly with no marketplace cuts.' },
  { step: 3, title: 'Customize store', desc: 'Upload beats, configure licenses, and publish your branded storefront.' },
];

const coreFeatures = [
  { icon: FileText, label: 'License automation' },
  { icon: Globe, label: 'Custom domain support' },
  { icon: Mail, label: 'Email capture' },
  { icon: BarChart3, label: 'Analytics dashboard' },
  { icon: Zap, label: 'Instant beat delivery' },
  { icon: Tag, label: 'Discount code support' },
  { icon: Smartphone, label: 'Mobile-optimized storefront' },
  { icon: DollarSign, label: 'No marketplace commission' },
];

const plans = [
  {
    name: 'Launch',
    price: 99,
    desc: 'Start selling from your own private beat store.',
    features: ['Single store', 'Stripe checkout', 'Core store customization', 'License automation'],
  },
  {
    name: 'Pro',
    price: 249,
    popular: true,
    desc: 'For producers growing volume and recurring buyers.',
    features: ['Everything in Launch', 'Advanced branding', 'Email capture flows', 'Enhanced analytics'],
  },
  {
    name: 'Studio',
    price: 499,
    desc: 'For teams and high-volume catalogs that need full control.',
    features: ['Everything in Pro', 'Priority support', 'Expanded automation', 'Team-oriented setup'],
  },
];

const sonexVsMarketplace = {
  sonex: [
    'Keep 100% of revenue (minus Stripe processing).',
    'Own your buyer data and email list.',
    'Brand-first storefront and custom domain.',
    'Direct control over catalog and promotions.',
  ],
  marketplace: [
    'Recurring platform fees and revenue cuts.',
    'Limited access to buyer relationship data.',
    'Generic profile pages with weak differentiation.',
    'Sales volatility from algorithm changes.',
  ],
};

const faqs = [
  {
    q: 'Is this a one-time payment?',
    a: 'Yes. Plans are sold as one-time purchases based on your selected package.',
  },
  {
    q: 'Do I need hosting renewal?',
    a: 'Hosting renewal depends on your selected setup. Sonex provides clear terms before checkout.',
  },
  {
    q: 'Do I keep all my revenue?',
    a: 'Yes. You keep 100% of your revenue from Sonex sales, minus Stripe processing fees.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-semibold text-foreground">{q}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground">{a}</div>
      )}
    </div>
  );
}

export default function SaasLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <span className="text-xl font-bold tracking-tight">Sonex</span>
          <div className="flex items-center gap-3">
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
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container text-center max-w-3xl mx-auto">
          <span className="inline-block text-xs font-medium tracking-wider uppercase text-muted-foreground border border-border rounded-full px-4 py-1.5 mb-6">
            Private SaaS Beat Selling Platform
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Own Your Beat Store. For Real.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Keep 100% of your revenue with no marketplace cuts. Sonex gives producers full ownership of their storefront, customers, and growth.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#pricing">
              <Button size="lg" className="text-base px-8 gap-2">
                Launch My Store <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="text-base px-8">
              View Demo Store
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Marketplace pain is real</h2>
          <p className="text-muted-foreground mb-10">You cannot build durable income on borrowed platforms.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {painPoints.map((p) => (
              <div key={p} className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground text-left">
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-secondary/20">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Sonex fixes the core problem</h2>
          <p className="text-muted-foreground mb-12">You stop renting shelf space and run your own store infrastructure.</p>
          <div className="grid gap-8 md:grid-cols-3">
            {valueProps.map((v) => (
              <div key={v.title} className="text-left">
                <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="text-left">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step {s.step}</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-secondary/20">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Core Features</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {coreFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <f.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Pricing</h2>
          <p className="text-center text-muted-foreground mb-12">Pick the package that matches your stage.</p>
          <div className="grid gap-8 md:grid-cols-3">
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
                <div className="mt-4 mb-3">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground ml-1 text-sm">one-time</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  Choose {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 bg-secondary/20">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Sonex vs Marketplaces</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-primary/30 bg-card p-8">
              <h3 className="text-xl font-bold mb-6 text-primary">Sonex</h3>
              <ul className="space-y-4">
                {sonexVsMarketplace.sonex.map((s) => (
                  <li key={s} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="text-xl font-bold mb-6 text-muted-foreground">Typical Marketplaces</h3>
              <ul className="space-y-4">
                {sonexVsMarketplace.marketplace.map((s) => (
                  <li key={s} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <FAQItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-secondary/20">
        <div className="container text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Build a store you actually own</h2>
          <p className="text-muted-foreground mb-8">
            Launch Sonex and turn your beat business into a direct, independent revenue channel.
          </p>
          <a href="#pricing">
            <Button size="lg" className="text-base px-8 gap-2">
              Launch My Store <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
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
