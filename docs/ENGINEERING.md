# PADROOM — Engineering, security, launch brief
Status: Production-oriented implementation plan. Updated 2026-10-08.

## Base stack
Next.js App Router, React, strict TypeScript, CSS variables + Tailwind or modular CSS, Supabase PostgreSQL/Auth/Storage, Vercel. Zod for validation, React Hook Form where beneficial. Playwright for user journeys, Vitest for business logic. Use supported releases and commit lockfile.
Keep all platform integrations behind shared service layers (database, storage, auth, eventual payments). Use server functions/API routes for privileged operations. Never put the Supabase service-role key in a browser-accessible variable.

## Architecture
- Next route groups for marketing-free public discovery, account workspace, and guarded admin.
- Auth using Supabase SSR cookies with secure session refresh. Never trust only a client-side role flag.
- Single database with Postgres RLS policies. Admin privileges based on secure role claims or server-verified admin membership; no public insert/update of privileged role.
- Storage: separate private uploads and public approved listing images, or signed URLs with security. Enforce owner upload policy; use a controlled publish operation. Reject executable file content and oversize objects; defend against path traversal / MIME spoofing.
- Listing catalog queries indexed by status, category, created_at, price and city. Database-backed search; consider Postgres text search and trigram as volume grows.
- Write operations go through validated server endpoints, transactions for state changes. Enforce idempotency on purchase/trade offers.
- Admin moderation operations logged as immutable audit events. Protect admin APIs even when called directly.

## Proposed initial relational schema
- profiles(id UUID FK auth.users, display_name, city, role control server-side, created_at, updated_at, suspended_at nullable)
- listings(id, seller_id, slug nullable, title, brand, model, category, condition, price_kobo integer/bigint, currency='NGN', city, description, defects, included_items, status, review_reason, created_at, updated_at, published_at)
- listing_images(id, listing_id, storage_path, position, created_at)
- saved_listings(user_id, listing_id, created_at) with UNIQUE(user_id, listing_id)
- conversations(id, listing_id, buyer_id, seller_id, created_at, updated_at) with unique active pair constraints as appropriate
- messages(id, conversation_id, sender_id, body, created_at, read_at)
- offers(id, listing_id, buyer_id, seller_id, kind:purchase|trade, offered_listing_id nullable, note, status, created_at, updated_at, completed_at nullable)
- reports(id, reporter_id, listing_id, reason, description, status, created_at, resolved_at)
- moderation_events(id, admin_id, entity_type, entity_id, action, notes, created_at)
- user_blocks(blocker_id, blocked_id, created_at) optional if implemented in MVP.
All records must have suitable foreign keys, CHECK constraints, timestamps and indexes. Never store plaintext passwords.

**Money:** represent NGN amounts as integer kobo in storage, safely formatted into naira in UI. Do not use floating point for amounts. System should handle ₦500 etc without precision errors.

## State transitions
Listing: draft -> pending_review -> active/rejected; rejected -> draft/pending_review; active -> sold/archived/pending_review if material edits. Privileged approval only.
Offer: pending -> accepted/declined/cancelled; accepted -> completed/cancelled or disputed per policy; seller cannot accept own request. Trade offer requires owned active offered_listing_id. Use row locks / transactions to avoid conflicting decisions.
Conversations: only participants send/read; listing IDs must be valid and seller IDs derive from database, not client input.

## RLS/security check matrix
- Anonymous: SELECT only approved active listings and permitted images; no user-private records.
- Authenticated buyer: own saved rows, own offer records, participating conversations/messages, public active listings.
- Seller: own listings including drafts; create/edit only allowed fields; own offer records; participating inbox; no moderation rights.
- Admin: server-controlled moderation and reports; use least-privilege policy.
- Suspended account: deny restricted write operations.
Apply RLS to storage objects, not only database rows.
Protect against IDOR, XSS, CSRF where relevant, abuse of server functions, upload content attacks, enumeration, spam and scraping. Rate-limit login-related flows, messaging, reports and listing creation. Sanitize/escape rendered content.

## Route outline
- / — browse
- /listings/[id] — detail
- /sell/new — create
- /sell/[id]/edit — edit own
- /my-listings — seller inventory
- /saved — favorites
- /messages and /messages/[id] — conversations
- /offers — requests / trades
- /account — profile
- /sign-in and /sign-up — auth
- /admin — moderation dashboard
- /about, /how-it-works, /privacy, /terms, /safety — supporting legal/help.
Organize pages however idiomatic for App Router, but preserve intent and guarded behavior.

## Quality assurance
- Lint, TypeScript check, unit tests, server/db integration tests, Playwright, production build.
- Use local or preview Supabase instance for tests. Clear fixtures only in non-production environment. Name development-only sample inventory explicitly; production defaults to empty.
- Test auth, listing submit/review/publish, search/filter, saved persistence, messaging, offer status transitions, trade references, report moderation and permissions.
- Test malicious actor access via API/direct URLs (other user's drafts, messages, storage and admin endpoints).
- Test mobile widths 375px/430px and desktop 1280px+, real keyboard navigation, color contrast, image loading failure, slow connection, empty catalog.
- Migrations must be reproducible on fresh database; document rollback where safe.

## Operations
- Use .env.example with variables but NEVER include actual credentials. Document NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY / publishable key as supported by chosen SDK, SUPABASE_SERVICE_ROLE_KEY (server only, if genuinely needed), app URL and admin bootstrap procedure.
- Supabase auth redirect URLs and production domain configured deliberately.
- Document RLS policy review and storage bucket setup in README.
- Error monitoring and minimal audit logs without logging sensitive user messages or credentials.
- Create explicit support/admin escalation contact once owner supplies it.
- Ensure deploy to Vercel passes security checks and production env setup; never promise a public live app before real deployment.

## Payments later (do not implement in initial milestone)
The payment provider is UNDECIDED. Do not hardcode Paystack merely because it is popular. PADROOM is a multi-vendor platform: check eligibility, KYC and settlement agreements before selecting a provider.
If selected later, Paystack documents marketplace-style split settlements using subaccounts: https://paystack.com/docs/payments/split-payments/ and https://paystack.com/docs/payments/multi-split-payments/. Settlement splitting is not custodial escrow; do not market it as such.
Before adding any payment code, design payment_intents, order records, verified webhook signatures, idempotency keys, refund/dispute/reconciliation paths and immutable transaction history. Require written owner sign-off.

## Nigerian launch / compliance
Before public launch obtain local legal review of consumer/refund obligations and privacy notice under Nigeria's data protection framework. Do not claim an unreviewed compliance certification. Review data minimization, retention, user access/deletion and how reported listings or personal messages may be processed.
Define support email, marketplace terms, takedown procedure, banned listings and seller conduct policy.

## Required handoff output from Codex
- Working source committed to this repository
- Database migrations, policies and storage setup
- Sample .env.example (no secrets)
- README with local dev, migration, test and deployment steps
- Screenshots or concise visual QA observations from mobile/desktop
- List of which functions are actually working, which need environment keys and which are explicitly deferred
- A short prioritized issue list for the next release

Do not claim production readiness before the functional end-to-end journeys pass with two distinct accounts and a privileged moderator.
