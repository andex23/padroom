# Independent cloud verification / 9 October 2026

Verified from a fresh, initially clean cloud checkout of `andex23/padroom` at implementation commit `06f4c630f087a65f4a535f3aa4a30dc97079581b`, on branch `work`. The existing marketplace, approved homepage structure, Paper Mono, migration and private-data policies were preserved. No user's Mac was used.

Environment: Node 24.19.0, npm 11.9.0, Next.js 16.4.0, Playwright 1.64.0, system Chromium, Supabase CLI 2.78.1 and Docker with `vfs`. Repository-local `.agents/skills` and workspace `.agents` had no Superpowers files; the cloud Superpowers systematic-debugging, test-driven-development and verification-before-completion skills were available and used. Screenshot inspection followed the product audit workflow.

## Checks

| Check | Independent result |
| --- | --- |
| Frozen dependency install, `npm ci` | Passed |
| Checksum-verified CLI, `npm run setup:local` | Passed |
| Fresh local stack, `npm run db:start` | Passed; applied `202610080001_marketplace.sql` to the new local database |
| Local environment, `npm run env:local` | Passed; generated local settings in ignored `.env.local`, without printing keys |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | 30 passed, zero skipped; includes the original 26 and four new redirect regressions |
| `npm run test:db` | 74 real Supabase assertions passed |
| `npm run test:e2e` | 22 passed (11 desktop, 11 mobile), zero failed, zero skipped and zero flaky; includes all original 16 cases |
| `npm run build` | Passed with local database configuration; 23 application routes, Next's not-found route and proxy |
| Local fixture cleanup | Zero auth users, profiles, administrators, listings, images, saves, conversations, messages, offers, reports, moderation events, rate-limit entries and stored objects; all 11 application tables have RLS enabled |
| Hosted database, production auth/SMTP, real administrator and public deployment | Blocked by unconfigured hosted environment; not counted as skipped local tests |

The supported native Chromium workflow was used:

```bash
export npm_config_cache=/workspace/.npm-cache
npm ci
npm run setup:local
npm run db:start
npm run env:local
npm run lint
npm run typecheck
npm test
npm run test:db
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
npm run build
npm run screenshots:home
```

Startup used the repository's existing checksum-verified PostgreSQL flattening helper for `vfs`. It completed without disabling TLS/digest checks or exhausting this instance's disk. The web server runs locally on port 3000. Database tests reject non-loopback URLs. All generated users, administrator membership, inventory and uploads were temporary local test fixtures.

## Defects fixed

1. **P1: authentication open redirect.** `safeNext` accepted `/\t/evil.example`, `/\n/evil.example` and `/\r/evil.example`. URL parsing strips those controls, turning the accepted path into another origin in the PKCE callback. The shared sign-in/callback validator now rejects those controls. Three regressions failed against the original implementation, then passed with the fix; a fourth test retains valid recovery/query/hash destinations. Browser re-login also exercises the tab payload and verifies it returns to the local homepage.
2. **P2: oversized seller photo previews.** The editor's intended square thumbnail had `width: 100%` and `aspect-ratio: 1`, but retained the `Photo` component's HTML `height="1600"`. A real uploaded photo measured 168×1600 on desktop and pushed controls far down the screen. The failing browser geometry regression recorded that result. Adding `height: auto` restores the existing square layout. The same regression runs at both 390px and 1280px.

Production changes are limited to that validator and one CSS declaration. Tests and screenshot captures were expanded; no redesign, schema change or policy broadening was introduced.

The pre-fix failures are retained as [redirect regression output](verification/unit-redirect-red.log) and [thumbnail geometry output](verification/photo-height-red.log). These are intentional historical failures, not unresolved final checks.

## Browser review and visual evidence

The original 16 cases remain. Six more cases cover two additional real marketplace journeys and mutation-error recovery, each at 390×844 and 1280×800. Only the network-failure case deliberately aborts a request; authentication, inventory, uploads, conversations, requests and moderation otherwise use real local services.

The assertion result logs are retained: [lint](verification/lint.log), [TypeScript](verification/typecheck.log), [unit](verification/unit.log), [database](verification/database.log), [browser](verification/browser-final.log), [production build](verification/build.log) and [cleanup/RLS/migration](verification/fixture-cleanup.log). The [machine-readable check summary](verification/results.json) distinguishes local passes, historical red regressions and blocked hosted checks. These logs contain no environment files or credential values.

| Step | Flow and result | Evidence |
| --- | --- | --- |
| 1 | Homepage: approved A–F order, empty database, genuine Paper Mono, responsive controls | [Mobile](screenshots/verification/home-390.png) / [desktop](screenshots/verification/home-1280.png) |
| 2 | Three separate authenticated sessions, persistence, logout/re-login, private routes | Account: [mobile](screenshots/verification/verification-mobile-01-account.png) / [desktop](screenshots/verification/verification-desktop-01-account.png) |
| 3 | Seller draft, decoded upload, square preview, photo removal/re-upload, review lifecycle | Photo editor: [mobile](screenshots/verification/verification-mobile-02-listing-photo.png) / [desktop](screenshots/verification/verification-desktop-02-listing-photo.png) |
| 4 | Real search/category/city/condition/price query, listing detail and persisted saves | Inventory: [mobile](screenshots/verification/verification-mobile-03-inventory.png) / [desktop](screenshots/verification/verification-desktop-03-inventory.png); detail: [mobile](screenshots/verification/verification-mobile-04-listing-detail.png) / [desktop](screenshots/verification/verification-desktop-04-listing-detail.png) |
| 5 | Private messages, 25-message history, concurrent arrival, malformed cursor and nonparticipant refusal | Conversation: [mobile](screenshots/verification/verification-mobile-05-conversation.png) / [desktop](screenshots/verification/verification-desktop-05-conversation.png) |
| 6 | Purchase acceptance/completion, sold stock leaving browse | Completed request: [mobile](screenshots/verification/verification-mobile-06-purchase-completed.png) / [desktop](screenshots/verification/verification-desktop-06-purchase-completed.png) |
| 7 | Mailpit reset email, PKCE callback, new password, fresh sign-in and authenticated account | Recovery: [mobile](screenshots/verification/verification-mobile-07-recovery-completed.png) / [desktop](screenshots/verification/verification-desktop-07-recovery-completed.png) |
| 8 | Report submission, resolution, audit trail, rejection/hide, seller suspension/restoration | Report: [mobile](screenshots/verification/verification-mobile-08-report.png) / [desktop](screenshots/verification/verification-desktop-08-report.png); moderation: [mobile](screenshots/verification/verification-mobile-09-moderation.png) / [desktop](screenshots/verification/verification-desktop-09-moderation.png) |
| 9 | Trade referencing owned active inventory, decline/cancel, reservation protection, handover selling both items | Accepted trade: [mobile](screenshots/verification/verification-mobile-10-trade-accepted.png) / [desktop](screenshots/verification/verification-desktop-10-trade-accepted.png) |
| 10 | Network abort and real invalid-auth response produce visible errors and allow retry | New mutation-error test |

Screenshots of inventory use actual temporary database records and generated test photo bytes; they do not depict commercial stock. Fixtures are removed after the tests. Existing approved-home images were retained. Images are full-page captures: on pages longer than the viewport, Chromium's screenshot shows the fixed mobile navigation at its viewport position while also capturing content below it. Scroll clearance and actual controls were exercised by the browser journeys. Screenshots establish the inspected layout, not the underlying transaction outcome; the assertions establish that outcome.

Early runs are not passing evidence: the redirect tests intentionally failed before the fix; the thumbnail geometry test intentionally failed before its CSS fix. Newly added browser selectors initially matched multiple alerts or included select/textarea content in exact label lookup. Those test selectors were corrected against DOM/trace evidence. Interrupted exploratory runs left later tests unexecuted; they are distinct from deliberate skips and the final full run.

A transient execution/image transport disconnect recovered with the checkout and services intact. A recovery screenshot initially caught the page's loading state; the final test waits for the account heading and independently signs in with the new password before capturing it. Neither is presented as a completed UI review without the rerun.

Screenshots and browser geometry/focus assertions support this UI review, but do not establish complete assistive-technology compliance. Local signup uses immediate sessions because confirmation is disabled in the documented local stack. Password recovery exercises local email and PKCE; hosted email confirmation, cross-browser email-link behavior and actual SMTP delivery remain unverified.

## Remaining launch configuration and priority

1. **P1: Vercel upload compatibility.** The app advertises/accepts 5 MiB photos and routes their multipart bodies through `/api/command`, whose local cap is 6 MiB. [Vercel documents a 4.5 MB function request-body limit](https://vercel.com/docs/functions/limitations#request-body-size). A near-limit accepted local photo can therefore be rejected before the handler runs on Vercel. This is an inference from the actual upload path and the hosting documentation, not a verified deployed failure. Before a Vercel launch, enforce a smaller cap with multipart headroom (for example 4 MiB) consistently in the browser/server/help text, or implement an upload path that preserves decoding/ownership validation outside that limit. Prove the chosen path in an authorized preview, including a near-limit image and a useful 413 error. No hosted upload is claimed here.
2. **Hosted database:** select an authorized Supabase project and inspect its schema. Review and apply `supabase/migrations/202610080001_marketplace.sql` first to an isolated preview project; it expects a fresh schema. Verify RLS, grants, private `listing-photos` storage and multi-account access there. The local test scripts refuse remote URLs and must not be repointed at production.
3. **Environment and origin:** set the actual project HTTPS URL, browser-safe publishable key and exact HTTPS application origin as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL`. Configure each preview origin deliberately and rebuild for changed public variables. Never publish a service-role/secret key. Verify correct-origin mutations and rejection of other origins in that preview.
4. **Auth and SMTP:** set Supabase Site URL to the same origin, allow its `/auth/callback` and recovery callback `?next=/reset-password`, enable confirmation and choose the hosted password/rate policies. [Supabase recommends exact production redirect paths](https://supabase.com/docs/guides/auth/redirect-urls). Configure an authorized SMTP sender/domain, host, port, username and password through project settings, then test real confirmation and recovery. [Default Supabase SMTP sends only to project-team addresses and currently has a two-message/hour limit](https://supabase.com/docs/guides/auth/auth-smtp), so local Mailpit success is not production delivery evidence. The current app has no CAPTCHA widget/token submission; enabling CAPTCHA requires that integration first.
5. **Administrator:** register and confirm a genuine operator, save their profile, obtain that account's actual auth UUID and have a database operator insert it into `public.admin_members(user_id)` through the SQL editor. Verify `/admin`, reject nonadmins and verify the admin cannot read unrelated private messages. The test-created local moderators are not launch administrators.
6. **Operations and policy:** publish reviewed operator identity, support contact, eligibility, privacy/retention/deletion and dispute policies; establish backups, monitoring and a support process. Existing legal pages explicitly say they require review. Inbox-level pagination/unread-query scaling remains appropriate before growing beyond the pilot.

No merge, push to main, deployment, production migration, hosted secret configuration, paid provisioning or external account-access change was performed. Those operations require the exact target and step to be reported before execution. Payments, escrow, payouts, KYC and shipment tracking remain outside this release; completion records manually arranged handover.
