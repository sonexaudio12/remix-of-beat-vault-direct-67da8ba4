

# Beat Collaboration Feature - Implementation Plan

## Overview
Add a collaboration system allowing producers to add other producers as collaborators on beats, with credit display and revenue split tracking.

## Database Changes

### 1. New table: `beat_collaborators`
```sql
CREATE TABLE public.beat_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beat_id uuid NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  collaborator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  split_percentage numeric NOT NULL DEFAULT 0,
  role text NOT NULL DEFAULT 'co-producer',
  status text NOT NULL DEFAULT 'pending',  -- pending, accepted, declined
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(beat_id, collaborator_user_id)
);

ALTER TABLE public.beat_collaborators ENABLE ROW LEVEL SECURITY;
```

**RLS policies:**
- Beat owners (via beats.tenant_id → tenants.owner_user_id) can manage collaborators
- Collaborators can view/update their own entries (accept/decline)
- Public can view accepted collaborators (for beat page display)

### 2. New table: `collaboration_earnings`
```sql
CREATE TABLE public.collaboration_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL,
  beat_id uuid NOT NULL,
  producer_id uuid NOT NULL,
  earnings_amount numeric NOT NULL DEFAULT 0,
  split_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collaboration_earnings ENABLE ROW LEVEL SECURITY;
```

**RLS policies:**
- Producers can view their own earnings
- Admins can view all

### 3. Add `owner_split_percentage` column to `beats` table
Default 100, adjusted when collaborators are added.

## Code Changes

### Admin UI - Collaborator Management

**New component: `src/components/admin/BeatCollaborators.tsx`**
- Search producers by email/display_name from `profiles` table
- Add collaborator with role and split percentage
- Validate total splits = 100%
- Show pending/accepted status
- Remove collaborators

**Integrate into `BeatUploadForm.tsx` and `BeatEditModal.tsx`**
- Add a "Collaborators" section after the basic beat info
- On beat save, insert/update `beat_collaborators` rows

### Beat Page Display

**Update `BeatCard.tsx` and `BeatListRow.tsx`**
- Fetch accepted collaborators with their profile display names
- Show "Produced by: Producer1 × Producer2" below beat title
- Link collaborator names to their tenant store if they have one

### Earnings Tracking

**Update webhook functions (`stripe-webhook`, `paypal-webhook`)**
- After order completion, calculate splits from `beat_collaborators`
- Insert rows into `collaboration_earnings`

**New component: `src/components/admin/CollaborationEarnings.tsx`**
- Dashboard showing earnings from collaborative beats
- Filterable by beat, date range

### Collaboration Approval Flow

- When a collaborator is added, their status starts as `pending`
- Collaborators see pending requests in their admin dashboard
- Accept/decline updates the status
- Only `accepted` collaborators show on the beat page

## Files to Create
1. `src/components/admin/BeatCollaborators.tsx` — collaborator search/add UI
2. `src/components/admin/CollaborationEarnings.tsx` — earnings dashboard

## Files to Modify
1. `src/components/admin/BeatUploadForm.tsx` — add collaborators section
2. `src/components/admin/BeatEditModal.tsx` — add collaborators section
3. `src/components/beats/BeatCard.tsx` — show collaborator credits
4. `src/components/beats/BeatListRow.tsx` — show collaborator credits
5. `src/hooks/useBeats.tsx` — fetch collaborators with beats
6. `src/pages/Admin.tsx` — add earnings tab
7. `supabase/functions/stripe-webhook/index.ts` — split earnings on sale
8. `supabase/functions/paypal-webhook/index.ts` — split earnings on sale

## Implementation Order
1. Database migration (tables + RLS)
2. BeatCollaborators component
3. Integrate into upload/edit forms
4. Beat page display
5. Earnings recording in webhooks
6. Earnings dashboard

