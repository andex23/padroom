# PADROOM — Instructions for Codex

## Your mission
Build PADROOM as a REAL, working Nigerian gaming resale marketplace web application in this existing repository. Do not make a static landing page, a throwaway prototype, a clickable Figma-like mockup, or a front end backed by a hard-coded product catalog. The first release is a functioning closed-beta marketplace with authenticated buyers and sellers, real listings and photos, saved items, conversations / purchase requests, and admin moderation. Make it production-oriented and deployable.

Read all of these before making implementation decisions:
1. **docs/APPROVED_HOME_UI.md — the OWNER-APPROVED homepage structure and visual acceptance contract. HIGHEST PRIORITY for layout.**
2. docs/BRAND.md — overall visual and copy system for the rest of the app.
3. docs/PRODUCT.md — workflows, product scope, acceptance criteria.
4. docs/ENGINEERING.md — architecture, database, security, tests, deployment.

**Priority rule:** for homepage structure, content order, labels, desktop/mobile navigation, spacing and aesthetics, docs/APPROVED_HOME_UI.md takes precedence over generic recommendations elsewhere. Product security and functional obligations in PRODUCT/ENGINEERING still apply. If other docs contradict the approved home layout, follow the approved layout. Do not create a different homepage from scratch.

## Decisions already made
- Product name: PADROOM. Lowercase typographic wordmark: padroom.
- Nigerian market, mobile-first, all prices in NGN.
- First categories: Consoles, Controllers, Games, Accessories.
- Web app first, not a physical store or marketing website.
- UI: quiet, editorial, commerce-first. No fluorescent green, decorative badges, gradient hero panels, fake scarcity, dashboard charts or excessive whitespace before the actual listings.
- Typeface: Paper Mono for technical labels, nav, filters, metadata and occasional small copy; a neutral sans-serif for primary reading and product names. Follow docs/BRAND.md.
- Never represent PADROOM as an official PlayStation or Sony store.

## Recommended stack
- Next.js App Router, React, TypeScript (strict), responsive semantic HTML and CSS/Tailwind design tokens.
- Supabase Postgres, Supabase Auth and Supabase Storage; RLS for every user-owned table, constrained server-side operations for moderation.
- Vercel deployment target, with environment secrets properly configured.
- Type-safe runtime validation (e.g. Zod), automated unit/integration tests and Playwright end-to-end tests.
Use current supported packages; pin versions in the lockfile. Do not add unrelated services or unnecessary complexity.

## Build order (real, vertical slices)
1. Set up the Next.js application, lint/typecheck/test scripts, environment example, migrations, README setup. Define design tokens and working navigation.
2. Implement Supabase auth (register/sign in/sign out), profiles, permissions, and durable sessions. Anonymous browsing must work.
3. Implement actual listing creation with uploaded product photos, persisted drafts / submitted listings, owner edit/archive, admin approval, publicly visible approved inventory.
4. Implement browse, search, filters, city, category, condition, sorting, real listing detail pages and saved items persisted per authenticated user.
5. Implement protected buyer-seller messaging and purchase requests with tracked status (submitted / accepted / declined / cancelled), with authorization and rate limiting.
6. Implement admin moderation queue, report listing, seller suspension controls, and audit trail for moderation actions.
7. Harden responsive UX, accessibility, empty/error/loading states, SEO, performance, tests, deployment docs; prepare real pilot launch.
Implement the slices fully. Do not simply draw their interfaces and leave buttons disconnected.

## Commerce rules
- The first release can transact through a genuine in-app purchase-request workflow; this is a functional marketplace beta, NOT a claim of online payment or escrow.
- Show plainly that payment and delivery are coordinated with the seller / the team until a vetted integrated checkout is enabled.
- Do NOT create fake payment success, wallet balance, escrow, buyer protection, shipment tracking, seller verification badges or automated payouts.
- Future payment integration should be designed as a provider adapter with verified server-side webhooks and a proper payment state machine. Provider and business approval are prerequisites. Never directly collect raw card numbers.
- Seller identity checks, if adopted, must have an explicit lawful and secure workflow; do not invent a verified status.

## Engineering non-negotiables
- No production demo inventory: an empty database yields thoughtful empty states. Local development seeds are clearly tagged and must not be deployed as real listings.
- No hard-coded buyer or seller credentials, secrets, public service-role keys, or sensitive data in client bundles.
- Enforce authorization and role checks on server AND database, not only through hidden buttons.
- Validate uploads (file type and size) and ownership; protect against XSS, IDOR, spam and duplicate requests.
- Tests must demonstrate two different user accounts cannot read or alter each other's private conversations, listings or saved data.
- Handle pending/failed requests and offline network failures visibly; no dead actions.
- Use accessible inputs, keyboard focus states, meaningful alt text and adequate contrast.
- Do not download random commercial photography or use unlicensed PlayStation logos/icons in the brand identity. Seller-supplied listing images are uploaded by actual users.

## Codex execution protocol
- **FIRST visually inspect the existing homepage implementation** (including local/unpushed changes, if present), compare it section-by-section to docs/APPROVED_HOME_UI.md, and make the minimum structural corrections necessary. Do not discard existing functioning backend code.
- **Take 390px mobile and 1280px desktop screenshots**, review them against the contract, and fix deviations *before* calling homepage design done. A feature list without screenshot verification does not establish fidelity.
- First examine the repository and these docs. Create a concise implementation plan and then start coding; do not stop at a plan.
- Make deliberate commits by functional milestone. Use migrations and a documented setup path.
- Run install, lint, typecheck, tests and production build. Fix failures and provide evidence in your final handoff.
- If Supabase/Vercel credentials are not connected, still implement the real integration and migrations; clearly identify which features need environment setup to run and do not invent successful live tests.
- At each milestone report: completed working flow, tests, blockers, next implementation step.
- Definition of done: an independent tester can sign up, list a real item with photos, have it approved, search and save it, contact its owner, make a purchase request, and observe the correct statuses using two genuine user sessions plus an admin session.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
