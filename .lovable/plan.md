

# Marketplace Homepage for SaaS Landing

## Overview
Build a BeatStars-style marketplace homepage that replaces (or augments) the current SaaS landing page. This page aggregates beats from **all active tenants** into a browsable, searchable catalog — giving visitors a taste of the platform while driving producers to sign up via a "Start Selling Beats" CTA.

## Architecture

The current flow: when `isSaasLanding` is true, `/` renders `SaasLanding.tsx`. We'll create a new `Marketplace.tsx` page that becomes the new `/` for the SaaS landing context, and move the current SaaS landing to `/landing` (already has a route in the tenant routes).

```text
Visitor hits root domain
  → isSaasLanding = true
  → "/" renders Marketplace (new)
  → "/landing" renders SaasLanding (existing)
  → "Start Selling Beats" links to /landing
```

## New Page: `src/pages/Marketplace.tsx`

A public-facing homepage with these sections:

1. **Hero** — Big headline ("Discover Beats"), search bar, genre quick-filters, and a prominent "Start Selling Beats →" link in the top nav/hero
2. **Trending/Latest Beats Grid** — Fetches beats across all tenants (`is_active = true`), displayed in a card grid with cover art, title, BPM, genre, and a play button (reuse `BeatCard` or a simplified variant)
3. **Genre Filter Bar** — Horizontal pill filters (Hip Hop, R&B, Pop, Trap, etc.) for quick filtering
4. **Search** — Text search filtering by title/genre
5. **Producer Attribution** — Each beat card shows the tenant/producer name, linking to their store (subdomain or custom domain)
6. **CTA Banner** — Mid-page and footer banner: "Start selling your beats — no monthly fees" → links to `/landing`
7. **Top Navigation** — Simple nav with logo, search, "Start Selling Beats" button, and login link

## Data Access

- New RLS policy (or use existing public read) on `beats` table allowing anonymous `SELECT` on active beats joined with tenant info
- Query: `supabase.from('beats').select('*, tenants(name, slug, custom_domain)').eq('is_active', true).order('created_at', { ascending: false }).limit(50)`
- Need to verify RLS allows anonymous reads across tenants for the marketplace

## Routing Changes (`App.tsx`)

In the `isSaasLanding` routes block:
- `"/"` → `<Marketplace />`  
- `"/landing"` → `<SaasLanding />` (already exists in tenant routes, add to SaaS routes)
- Keep all other SaaS routes as-is

## Database Changes

- Add RLS policy on `beats` for anonymous/public SELECT of active beats (if not already present) — this is intentional for the public marketplace
- No new tables needed

## Components to Reuse/Create

- Reuse `BeatCard` or create a lightweight `MarketplaceBeatCard` that includes producer name
- Reuse audio player hook for preview playback
- New `MarketplaceHeader` component (simpler than store header, with "Start Selling" CTA)

## Key Details

- The marketplace is read-only — no cart, no purchasing. Clicking a beat or "Buy" links to the producer's store
- Mobile-responsive grid layout
- Dark theme consistent with existing design system

