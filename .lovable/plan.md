

# Music Distribution System - Implementation Plan

## Overview
Add a music distribution module to the producer admin dashboard. Since there is no actual distribution API connected yet, we will build the full UI, database schema, and internal workflow. The actual third-party API integration (FUGA, Symphonic, etc.) will be a placeholder edge function that can be wired up later when the user secures a distribution partner.

## Database Changes (1 migration)

### New tables

**`releases`** — stores each release submission
- `id`, `tenant_id`, `user_id`, `title`, `artist_name`, `featuring_artists`, `genre`, `release_date`, `is_explicit`, `upc` (auto-generated), `cover_art_url`, `status` (draft/submitted/processing/live/rejected), `distribution_fee`, `created_at`, `updated_at`

**`release_tracks`** — one or more tracks per release
- `id`, `release_id`, `title`, `audio_file_url`, `isrc`, `duration_seconds`, `track_number`, `created_at`

**`release_stores`** — selected platforms and per-platform status/links
- `id`, `release_id`, `store_name`, `status` (pending/processing/live/failed), `store_url`, `created_at`

**`release_royalties`** — royalty records per platform
- `id`, `release_id`, `store_name`, `streams`, `revenue`, `period_start`, `period_end`, `created_at`

### Storage
- New **`distribution`** storage bucket (private) for WAV files and cover art

### RLS
- All tables: admin (via `is_admin()`) can manage all rows
- Read/write scoped to `tenant_id` matching the user's tenant

## New Files

1. **`src/components/admin/DistributionDashboard.tsx`** — main distribution hub showing releases list, status badges, and royalties summary
2. **`src/components/admin/ReleaseCreateWizard.tsx`** — multi-step form (track upload → artwork → platform selection → review & submit) with validation
3. **`src/components/admin/ReleaseDetail.tsx`** — view a single release with status, store links, and royalty data
4. **`supabase/functions/submit-release/index.ts`** — edge function that validates metadata, generates UPC, updates status to "submitted", and acts as the placeholder for the distribution API call

## Modified Files

1. **`src/pages/Admin.tsx`** — add "Distribution" nav item and render `DistributionDashboard`
2. **`supabase/config.toml`** — register `submit-release` function

## Release Creation Wizard Steps

1. **Track Info** — title, artist name, featuring, genre, release date, explicit toggle, optional ISRC
2. **Upload Audio** — WAV file upload to `distribution` bucket with format validation (accept only .wav)
3. **Upload Artwork** — image upload with 3000x3000 minimum guidance, JPG/PNG only
4. **Select Platforms** — checkboxes for Spotify, Apple Music, YouTube Music, Amazon Music, TikTok, Deezer, Tidal
5. **Review & Submit** — summary of all info, submit button calls the edge function

## Edge Function: `submit-release`
- Validates all required fields
- Auto-generates UPC if not provided (format: random 12-digit)
- Creates rows in `release_stores` for each selected platform
- Sets release status to `submitted`
- Returns success (placeholder for future API integration with FUGA/Symphonic/Stem)

## Royalties Dashboard
- Table view showing streams and revenue per platform per release
- Summary cards: total streams, total revenue
- Data comes from `release_royalties` table (initially empty, populated via future API sync or manual entry)

## Implementation Order
1. Database migration (tables + RLS + storage bucket)
2. `ReleaseCreateWizard` component (multi-step form)
3. `DistributionDashboard` component (releases list + royalties)
4. `ReleaseDetail` component
5. `submit-release` edge function
6. Wire into Admin page nav

