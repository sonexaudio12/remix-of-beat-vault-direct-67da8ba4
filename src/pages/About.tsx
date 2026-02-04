import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Music2 } from 'lucide-react';
export default function About() {
  return <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Music2 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-display">
            About Sonex Beats
          </h1>
        </div>

        <p className="text-muted-foreground text-lg mb-6">
          Sonex Beats is a modern beat marketplace and creative platform developed
          by <span className="font-medium text-foreground">Hit Chasers Collective</span> —
          a group of producers with placements alongside major artists
          and experience working within the professional music industry.
        </p>

        <p className="text-muted-foreground mb-8">
          Built by producers, for producers and artists, Sonex Beats was created
          to simplify how beats are sold, licensed, and discovered — while
          encouraging real collaboration instead of one-off transactions.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-2">Hit Chasers Collective</h3>
            <p className="text-sm text-muted-foreground">
              Hit Chasers is a collective of producers focused on quality,
              originality, and results. With industry placements and real-world
              experience, the collective understands what artists actually
              need when choosing beats and collaborators.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-2">Why Sonex Beats Exists</h3>
            <p className="text-sm text-muted-foreground">
              Traditional beat stores focus on volume. Sonex Beats focuses on
              connection — allowing artists to contact producers, request
              custom work, and build long-term creative relationships.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-6">
          <h3 className="font-semibold mb-2 text-primary-foreground">Our Vision</h3>
          <p className="text-sm text-primary-foreground">
            Sonex Beats aims to become more than a marketplace. Our vision is to
            grow a trusted, community-driven platform where talented producers
            and serious artists can connect, collaborate, and create records
            that move culture forward.
          </p>
        </div>
      </div>
      <Footer />
    </div>;
}