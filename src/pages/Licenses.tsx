import { Check, Music, FileAudio, Archive, Mic, Users, Globe, Radio } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useThemeConfig } from "@/hooks/useStoreConfig";
import { DEFAULT_LICENSING, LicenseTierConfig } from "@/types/storeConfig";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Music, FileAudio, Archive, Mic, Users, Globe, Radio,
};

const Licenses = () => {
  const { data: themeConfig } = useThemeConfig();
  const licensing = themeConfig?.licensing || DEFAULT_LICENSING;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(187_100%_42%_/_0.1)_0%,transparent_50%)]" />
          <div className="container relative">
            <div className="max-w-2xl mx-auto text-center bg-background">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{licensing.heroTitle}</h1>
              <p className="text-lg text-muted-foreground">{licensing.heroSubtitle}</p>
            </div>
          </div>
        </section>

        {/* License Cards */}
        <section className="py-16 md:py-24">
          <div className="container bg-background">
            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto bg-background">
              {licensing.tiers.map((license) => {
                const Icon = ICON_MAP[license.icon] || Music;
                const colorClass =
                  license.color === "primary"
                    ? "border-primary/30 hover:border-primary"
                    : `border-${license.color}/30 hover:border-${license.color}`;
                return (
                  <div
                    key={license.id}
                    className={`relative flex flex-col rounded-2xl border-2 p-6 md:p-8 transition-all bg-background ${colorClass} ${
                      license.popular ? "md:-mt-4 md:mb-4 shadow-glow" : ""
                    }`}
                  >
                    {license.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-tier-premium text-xs font-bold uppercase tracking-wider text-primary-foreground">
                        Most Popular
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl bg-${license.color === 'primary' ? 'primary' : license.color}/10`}>
                        <Icon className={`h-6 w-6 text-${license.color === 'primary' ? 'primary' : license.color}`} />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold bg-background">{license.name}</h3>
                        <p className="text-sm text-muted-foreground">{license.priceNote}</p>
                      </div>
                    </div>

                    <div className={`text-4xl font-bold mb-4 text-${license.color === 'primary' ? 'primary' : license.color}`}>
                      {license.price}
                    </div>

                    <p className="text-muted-foreground mb-6">{license.description}</p>

                    {/* Includes */}
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        What's Included
                      </h4>
                      <ul className="space-y-2.5 mb-6 bg-background">
                        {license.includes.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Use Cases */}
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Ideal For
                      </h4>
                      <div className="flex gap-2">
                        {license.useCases.map((use, i) => {
                          const UseIcon = ICON_MAP[use.icon] || Music;
                          return (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm">
                              <UseIcon className="h-3.5 w-3.5" />
                              {use.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container">
            <h2 className="font-display text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {licensing.faq.map((faq, i) => (
                <div key={i} className="p-6 rounded-xl border border-border bg-card">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Licenses;
