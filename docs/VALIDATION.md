# Validation / 9 October 2026

This records the implementation task's original validation. A separate fresh-checkout rerun, two defect fixes, expanded desktop/mobile coverage and current launch requirements are documented in [Independent cloud verification](CLOUD_VERIFICATION.md). That newer report supersedes the test counts and remaining-browser-coverage item below; the historical results are retained.

The later [upload compatibility follow-up](UPLOAD_COMPATIBILITY.md) records the shared photo/request budgets, boundary regressions and latest rerun results.

Verified in the current cloud instance using Node.js 24.19.0, Next.js 16.4.0, genuine local Supabase services and system Chromium through Playwright. No mocked database, authentication, transaction or catalog was used.

| Check | Result |
| --- | --- |
| Frozen dependency install (`npm ci`) | Passed, including after final ESLint 10/plugin dependency reconciliation |
| Lint / strict TypeScript | Passed |
| Vitest | 26 passed across 2 files |
| Production build | Passed, 23 application routes plus Next proxy |
| Real Supabase integration | 74 assertions passed |
| Playwright | 16 passed, no skips; real multi-account journeys at 390px and 1280px |
| Initial fresh database migration | Applied successfully by local Supabase startup |
| Fixture cleanup | Verified zero listings, auth accounts and stored objects remain |

## Actual capabilities exercised

At both desktop and mobile sizes, three independent browser sessions registered a seller, buyer and moderator through the real application. The seller persisted a draft, uploaded an actual decoded photo, submitted it, and the moderator approved it. The buyer searched database inventory, saved the item, exchanged private messages with the seller and sent a purchase request. Acceptance and completed handover were visible to participants, and sold inventory disappeared from browse. Session persistence after reload, logout, re-login and password recovery through local Mailpit delivery and the PKCE callback also passed.

Direct Supabase API tests demonstrated that another account cannot read/edit drafts, saved items or private conversations/messages, cannot moderate inventory or self-promote to admin, and cannot make a trade with someone else’s item. They exercised real uploads, private draft photos, public approval, duplicate requests, purchase completion, trade reservations/cancellation, reports, suspension/restoration, material edits returning to drafts, immutable audit access and database rate limits. Simultaneous acceptance of competing requests produced exactly one success.

Actual byte-level tests rejected HTML/SVG mislabeled as JPEG, excessive pixel dimensions and oversized uploads. PNG input was decoded, resized and converted to a metadata-free JPEG.

## Visual QA

The latest GitHub approved-home contract was merged into the existing implementation. Actual 390×844 and 1280×800 screenshots were compared with A–F in `APPROVED_HOME_UI.md`; the before/after checklist and committed captures are in `HOME_UI_ACCEPTANCE.md` and `docs/screenshots`.

The required structure is implemented: lowercase wordmark with heart/account controls, exact tinted search, Discover / Consoles / Games / Accessories text rail, divider, Fresh in the room / Filter, 4:5 inventory and exactly Home / Explore / Sell / Account on mobile. Filters open on demand on both screen sizes. The empty state is compact and truthful. No sidebar, hero, tagline, decorative pills or sample inventory is present.

Automated checks verify physical ordering, exact labels, actual Paper Mono load/use, 44px icon targets, Explore focus, native filter-sheet Escape/focus restoration, active filter removal and preserved URL queries. Layout also passed at 375×667, 430×932 and 768×1024, without horizontal overflow. Real uploaded test media confirmed two columns on mobile, four at 1280px, a 4:5 ratio and above-the-fold inventory. The genuine mobile purchase workflow is now covered instead of skipped.

## Conversation history

Private history now loads at most 25 messages per page, using the existing `(conversation_id, created_at, id)` index and conversation-scoped cursor lookup through participant RLS. Each desktop/mobile browser journey persisted 30 additional messages through the real API, traversed older history, verified stable pages after a concurrent reply and returned to latest history after replying. Malformed cursors and authenticated administrator access to another conversation returned the not-found screen. No service-role credentials, schema changes or policy broadening were introduced.

Native resized images deliberately avoid the Next image optimizer for short-lived private signed URLs. Image failures have visible fallbacks. The framework-generated Next.js guidance block in AGENTS.md was retained; the relevant bundled cookie/proxy documentation was read.

## Local infrastructure correction

Docker in this instance uses `vfs`. Pulling the many-layer upstream PostgreSQL image exhausted its storage. The helper now exports the authentic pinned Supabase image by registry digest using checksum-verified Crane and imports its filesystem as one layer. Essential execution settings are retained; Supabase CLI supplies the healthcheck. This enabled the real stack and tests without disabling TLS/checksum verification. Cached startup and the verified CLI installer were exercised. Overlay-backed Docker skips the workaround.

## Remaining work before public launch

1. Configure a hosted Supabase project, apply/review the migration, set the three README environment variables and bootstrap a genuine administrator. Deploy to Vercel, configure the final HTTPS origin and test real SMTP confirmation/password recovery in that deployment. No remote deployment, hosted SMTP or fresh-task snapshot restoration was performed here. Commits are local until pushed.
2. Publish business/legal-reviewed operator identity, support contact, eligibility, privacy/retention/deletion, dispute and marketplace policies. Establish backups, monitoring and operational support. The legal pages are explicitly initial beta notices.
3. Broaden browser coverage to full trade, report/moderation and seller-management journeys on mobile; those transactional/security operations are currently covered at the real Supabase API level. Conversation history is now paginated; add inbox-level pagination and unread-query performance work before scaling beyond the pilot. Realtime notifications are optional; refresh is implemented.

Payments, escrow, payouts, KYC and integrated shipment tracking are intentionally outside this first release. Completed requests record a manually arranged handover; they do not represent a payment processed by PADROOM.
