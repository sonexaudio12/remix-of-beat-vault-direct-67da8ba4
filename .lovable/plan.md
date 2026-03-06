

# Turn Sonex Into a Multi-Tenant SaaS Platform

This is a large-scale transformation that will allow you to sell the Sonex platform to other music producers. Each producer who purchases a plan will get their own storefront, with their own beats, branding, and custom domain -- all running on a single shared database.

Given the scope, this should be broken into phases. Here is the full roadmap:

---

## Phase 1: Multi-Tenant Database Architecture

Add a `tenants` table and a `tenant_id` column to every existing data table (beats, orders, sound_kits, services, etc.) so that each producer's data is isolated.

**New tables:**
- `tenants` -- stores producer accounts (name, slug, domain, plan, Stripe/PayPal keys, branding config, status)
- `tenant_domains` -- maps custom domains to tenant IDs

**Modified tables (add `tenant_id` column):**
- `beats`, `sound_kits`, `license_tiers`, `license_templates`, `orders`, `order_items`, `services`, `service_orders`, `discount_codes`, `store_config`, `admin_settings`, `payment_settings`, `beat_plays`, `site_views`, `exclusive_offers`

**Updated RLS policies:**
- All existing policies will be scoped to the current tenant, so producers can only see/manage their own data
- Public-facing queries (e.g. "view active beats") will also filter by tenant

---

## Phase 2: Tenant Resolution (Who is Visiting?)

When someone visits the app, the system needs to figure out which producer's store to show.

**How it works:**
1. Check the current hostname (e.g. `producer-beats.com` or `cool-producer.sonexbeats.shop`)
2. Look up the `tenants` table by custom domain or subdomain slug
3. Store the resolved `tenant_id` in a React context (`TenantProvider`)
4. All data queries automatically include `tenant_id` filter

**Fallback:** If no tenant is resolved (e.g. visiting `sonexbeats.shop` directly), show the SaaS landing/sales page instead of a store.

---

## Phase 3: SaaS Landing Page + Pricing

Build a sales page at the root URL (`sonexbeats.shop`) that shows when no tenant is matched.

**Includes:**
- Hero section explaining the product
- Feature highlights (beat store, licensing, services, analytics, etc.)
- Pricing cards for your plans (e.g. Starter, Pro, Enterprise)
- "Get Started" button leading to Stripe checkout

**Plans stored as Stripe products** -- you define the price IDs in code.

---

## Phase 4: Stripe One-Time Payment for Plans

Create a `create-saas-checkout` edge function that:
1. Creates a Stripe Checkout session in `mode: "payment"`
2. On success, redirects to an onboarding page
3. A `saas-payment-webhook` (or verification on redirect) creates the tenant record in the database with `status: 'setup'`

---

## Phase 5: Producer Onboarding Flow

After purchase, the new producer lands on an onboarding page where they:

1. Create their account (email + password signup)
2. Choose a subdomain slug (e.g. `mybeats` gives them `mybeats.sonexbeats.shop`)
3. Optionally enter a custom domain (e.g. `mybeats.com`)
4. Enter their own Stripe/PayPal keys for receiving payments
5. Upload logo and set basic branding

**Domain setup instructions** are shown inline:
- Add an A record pointing to `185.158.133.1`
- Add a TXT record for verification
- The system periodically checks DNS and marks the domain as active

---

## Phase 6: Tenant-Scoped App Logic

Update all hooks and components to be tenant-aware:

- `useBeats`, `useSoundKits`, `useCart`, etc. all filter by the current tenant
- `Header`, `Footer`, `HeroSection` pull branding from the tenant's `store_config`
- Admin panel only shows/edits data belonging to the logged-in producer's tenant
- Each producer's Stripe/PayPal keys are used for their customers' checkouts

---

## Recommended Implementation Order

Since this is a very large feature set, I recommend building it in small chunks across multiple conversations:

1. **Start with the `tenants` table + tenant resolution** -- this is the foundation
2. **Add `tenant_id` to existing tables** -- with migration + RLS updates
3. **Build the SaaS landing page** -- pricing + Stripe checkout
4. **Build the onboarding flow** -- account creation + domain setup
5. **Make all queries tenant-aware** -- update hooks and components
6. **Custom domain management** -- DNS instructions + verification

---

## Technical Details

### Tenants Table Schema

```text
tenants
  id              uuid (PK)
  owner_user_id   uuid (FK -> auth.users)
  name            text (store display name)
  slug            text (unique subdomain)
  custom_domain   text (nullable, e.g. "mybeats.com")
  domain_status   text (pending | verified | active)
  plan            text (starter | pro | enterprise)
  stripe_payment_id  text (Stripe checkout session)
  status          text (setup | active | suspended)
  created_at      timestamptz
```

### Tenant Resolution Flow

```text
Request comes in
       |
  Read hostname
       |
  Is it "sonexbeats.shop"? ----YES----> Show SaaS landing page
       |
      NO
       |
  Check tenant_domains table
  or tenants.slug match
       |
  Found? ----NO----> Show 404 / "Store not found"
       |
     YES
       |
  Set TenantContext
  Render producer's store
```

### Edge Functions Updates
- All existing edge functions (create-stripe-checkout, generate-license-pdf, etc.) will need to accept and validate `tenant_id`
- Each tenant's payment credentials are stored in `payment_settings` scoped by `tenant_id`

---

## Important Notes

- This is a **major architectural change** that will touch nearly every file in the project
- I strongly recommend tackling it one phase at a time
- Your existing data will need a migration to assign it to a "default" tenant (your own store)
- Custom domain setup relies on Lovable's domain infrastructure -- producers would add domains through the onboarding UI, and you'd need to connect them via the Lovable settings or a programmatic API

Would you like to start with Phase 1 (the tenants table and multi-tenant database foundation)?

