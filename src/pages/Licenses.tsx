import { Check, Music, FileAudio, Archive, Mic, Users, Globe, Radio } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
const licenses = [{
  name: 'MP3 Lease',
  price: '$24.99',
  priceNote: 'starting at',
  color: 'primary',
  icon: Music,
  description: 'Perfect for demos and online distribution',
  includes: ['High-quality MP3 file (320kbps)', 'License PDF with terms', 'Unlimited personal use', 'Up to 5,000 streams', 'Non-exclusive rights'],
  useCases: [{
    icon: Mic,
    label: 'Demos & Mixtapes'
  }, {
    icon: Globe,
    label: 'Social Media'
  }]
}, {
  name: 'WAV Lease',
  price: '$49.99',
  priceNote: 'starting at',
  color: 'tier-premium',
  icon: FileAudio,
  description: 'Studio-quality for professional releases',
  includes: ['Uncompressed WAV file', 'High-quality MP3 file', 'License PDF with terms', 'Up to 50,000 streams', 'Radio broadcasting rights', 'Music video rights'],
  useCases: [{
    icon: Radio,
    label: 'Radio Play'
  }, {
    icon: Users,
    label: 'Live Performances'
  }],
  popular: true
}, {
  name: 'Trackout (Stems)',
  price: '$99.99',
  priceNote: 'starting at',
  color: 'tier-exclusive',
  icon: Archive,
  description: 'Full creative control with individual tracks',
  includes: ['Individual stem files (ZIP)', 'Uncompressed WAV file', 'High-quality MP3 file', 'License PDF with terms', 'Up to 500,000 streams', 'Full commercial rights', 'Keep beat after exclusive sold'],
  useCases: [{
    icon: Mic,
    label: 'Major Releases'
  }, {
    icon: Globe,
    label: 'Commercial Use'
  }]
}];
const Licenses = () => {
  return <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(187_100%_42%_/_0.1)_0%,transparent_50%)]" />
          <div className="container relative">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Simple, Transparent Licensing
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose the license that fits your project. All licenses include instant digital
                delivery and a PDF with your usage rights.
              </p>
            </div>
          </div>
        </section>

        {/* License Cards */}
        <section className="py-16 md:py-24">
          <div className="container bg-slate-200">
            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              {licenses.map(license => {
              const Icon = license.icon;
              const colorClass = license.color === 'primary' ? 'border-primary/30 hover:border-primary' : `border-${license.color}/30 hover:border-${license.color}`;
              return <div key={license.name} className={`relative flex flex-col rounded-2xl border-2 p-6 md:p-8 transition-all bg-card ${colorClass} ${license.popular ? 'md:-mt-4 md:mb-4 shadow-glow' : ''}`}>
                    {license.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-tier-premium text-xs font-bold uppercase tracking-wider text-primary-foreground">
                        Most Popular
                      </div>}

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl bg-${license.color}/10`}>
                        <Icon className={`h-6 w-6 text-${license.color}`} />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold">{license.name}</h3>
                        <p className="text-sm text-muted-foreground">{license.priceNote}</p>
                      </div>
                    </div>

                    <div className={`text-4xl font-bold mb-4 text-${license.color}`}>
                      {license.price}
                    </div>

                    <p className="text-muted-foreground mb-6">{license.description}</p>

                    {/* Includes */}
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        What's Included
                      </h4>
                      <ul className="space-y-2.5 mb-6">
                        {license.includes.map((item, i) => <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>)}
                      </ul>
                    </div>

                    {/* Use Cases */}
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Ideal For
                      </h4>
                      <div className="flex gap-2">
                        {license.useCases.map((use, i) => {
                      const UseIcon = use.icon;
                      return <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm">
                              <UseIcon className="h-3.5 w-3.5" />
                              {use.label}
                            </div>;
                    })}
                      </div>
                    </div>
                  </div>;
            })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24 bg-slate-200">
          <div className="container">
            <h2 className="font-display text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {[{
              q: 'Can I upgrade my license later?',
              a: 'Yes! You can upgrade to a higher license tier at any time. Just contact us and we\'ll arrange the upgrade.'
            }, {
              q: 'What happens when a beat sells exclusively?',
              a: 'If you purchased a lease before the exclusive sale, you keep your rights. New leases won\'t be available after an exclusive sale.'
            }, {
              q: 'Do I need to credit the producer?',
              a: 'Yes, all leases require producer credit (prod. by SonexLite). Exclusive licenses have flexible credit terms.'
            }, {
              q: 'Are the licenses royalty-free?',
              a: 'Our licenses grant you usage rights within the specified terms. Royalties may apply for commercial streaming beyond your tier\'s limits.'
            }].map((faq, i) => <div key={i} className="p-6 rounded-xl border border-border bg-secondary">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>;
};
export default Licenses;