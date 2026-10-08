# Validation / 8 October 2026

Verified in the current cloud instance using Node.js 24.19.0, Next.js 16.4.0, genuine local Supabase services and system Chromium through Playwright. No mocked database, authentication, transaction or catalog was used.

| Check | Result |
| --- | --- |
| Frozen dependency install (`npm ci`) | Passed, including after final ESLint 10/plugin dependency reconciliation |
| Lint / strict TypeScript | Passed |
| Vitest | 26 passed across 2 files |
| Production build | Passed, 22 application routes plus Next proxy |
| Real Supabase integration | 74 assertions passed |
| Playwright | 9 passed; 1 deliberate skip of the duplicate mobile multi-account transaction |
| Initial fresh database migration | Applied successfully by local Supabase startup |
| Fixture cleanup | Verified zero listings, auth accounts and stored objects remain |

## Actual capabilities exercised

Three independent browser sessions registered a seller, buyer and moderator through the real application. The seller persisted a draft, uploaded an actual decoded photo, submitted it, and the moderator approved it. The buyer searched database inventory, saved the item, exchanged private messages with the seller and sent a purchase request. Acceptance and completed handover were visible to participants, and sold inventory disappeared from browse. Session persistence after reload, logout, re-login and password recovery through local Mailpit delivery and the PKCE callback also passed.

Direct Supabase API tests demonstrated that another account cannot read/edit drafts, saved items or private conversations/messages, cannot moderate inventory or self-promote to admin, and cannot make a trade with someone else’s item. They exercised real uploads, private draft photos, public approval, duplicate requests, purchase completion, trade reservations/cancellation, reports, suspension/restoration, material edits returning to drafts, immutable audit access and database rate limits. Simultaneous acceptance of competing requests produced exactly one success.

Actual byte-level tests rejected HTML/SVG mislabeled as JPEG, excessive pixel dimensions and oversized uploads. PNG input was decoded, resized and converted to a metadata-free JPEG.

## Visual QA

Inspected browser screenshots at 375×812 and 1280×900. Paper Mono loaded successfully. Monochrome bone/ink surfaces, lowercase wordmark, restrained heading hierarchy, compact navigation, visible search/categories, labeled filters and honest empty states match the supplied brand brief. Mobile filters collapse to keep inventory/empty state in the first viewport; persistent mobile navigation retains text labels. Neither viewport overflowed horizontally. Product photography comes from uploaded seller files, not a bundled sample catalog. Font licensing/provenance is retained in `public/fonts`.

Native resized images deliberately avoid the Next image optimizer for short-lived private signed URLs. Image failures have visible fallbacks. The framework-generated Next.js guidance block in AGENTS.md was retained; the relevant bundled cookie/proxy documentation was read.

## Local infrastructure correction

Docker in this instance uses `vfs`. Pulling the many-layer upstream PostgreSQL image exhausted its storage. The helper now exports the authentic pinned Supabase image by registry digest using checksum-verified Crane and imports its filesystem as one layer. Essential execution settings are retained; Supabase CLI supplies the healthcheck. This enabled the real stack and tests without disabling TLS/checksum verification. Cached startup and the verified CLI installer were exercised. Overlay-backed Docker skips the workaround.

## Remaining work before public launch

1. Configure a hosted Supabase project, apply/review the migration, set the three README environment variables and bootstrap a genuine administrator. Deploy to Vercel, configure the final HTTPS origin and test real SMTP confirmation/password recovery in that deployment. No remote deployment, hosted SMTP or fresh-task snapshot restoration was performed here. Commits are local until pushed.
2. Publish business/legal-reviewed operator identity, support contact, eligibility, privacy/retention/deletion, dispute and marketplace policies. Establish backups, monitoring and operational support. The legal pages are explicitly initial beta notices.
3. Broaden browser coverage to full trade, report/moderation and seller-management journeys on mobile; those transactional/security operations are currently covered at the real Supabase API level. Add larger-history pagination and inbox performance work before scaling beyond the pilot. Realtime notifications are optional; refresh is implemented.

Payments, escrow, payouts, KYC and integrated shipment tracking are intentionally outside this first release. Completed requests record a manually arranged handover; they do not represent a payment processed by PADROOM.
