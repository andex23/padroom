# First marketplace workflow

The approved PRODUCT, BRAND and ENGINEERING specifications are the implementation brief.

1. Foundation: Next.js App Router, strict TypeScript, Supabase SSR cookies, Paper Mono under OFL, monochrome tokens, accessible compact commerce shell. No demo catalog.
2. Persistence: Postgres constraints, RLS, private storage and validated mutations. Privileged transitions are transactional SQL RPCs, authenticated as the current user. Admin membership is provisioned out of band; the app never needs a service-role key.
3. Marketplace: profile, draft, photos, preview, submit, moderator review, public discovery, saves, private messages, purchase/trade requests and completion. Approved edits return to drafts. Reports, account suspension and immutable audit records are included.
4. Validation: unit tests, real local Supabase authorization and state-transition tests, browser public and multi-account workflows, production build. External deployment and public launch require a configured Supabase project, auth email delivery, public domain and operator/legal policies.

Photos are decoded and resized to JPEG server-side; embedded metadata is stripped. Storage remains private, with short-lived signed URLs. Search, filters and sort use actual Postgres inventory; only active listings from unsuspended sellers are public.

There is no in-app payment, escrow or shipment tracking. Acceptance records intent; completion marks the handover and inventory sold. Seller and buyer may cancel an accepted arrangement. Support/dispute operations remain manual during the pilot.
