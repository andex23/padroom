# padroom.

An independent, Nigeria-first gaming resale marketplace built with Next.js App Router, strict TypeScript and Supabase PostgreSQL/Auth/Storage. Inventory is database-backed; an empty database stays empty. Paper Mono is self-hosted under the SIL Open Font License in `public/fonts`.

## Start here (Codex)
1. Read [AGENTS.md](AGENTS.md) for implementation instructions.
2. **Implement [Approved homepage UI](docs/APPROVED_HOME_UI.md) exactly** before adapting the other screens. Do not substitute a generic marketplace landing page.
3. Follow the wider [Brand & UI direction](docs/BRAND.md).
4. Build the actual flows in [Product requirements](docs/PRODUCT.md).
5. Follow [Engineering specification](docs/ENGINEERING.md) for architecture, security, testing and release.

## Implemented first workflow

Register/sign in (including password recovery) → complete profile → save listing draft → upload photos → preview/submit → administrator approves → public browse/search/filter → buyer saves, sends a private message and requests a purchase or trade → seller responds → participants cancel or record completed handover.

Seller edits return approved listings to drafts. Sellers can withdraw review, archive or mark sold. Reports, moderation reasons, seller suspension/restoration, unread messages and a moderation audit trail are implemented. Conversations refresh on demand; there is no realtime subscription. History loads 25 messages at a time with private, conversation-scoped cursors; replies from an earlier page return to the latest messages. Listing creation currently requires complete item information before saving a draft; photos are added separately.

**Pilot:** Payments and delivery are arranged separately. PADROOM does not hold funds or guarantee transactions. No checkout, escrow, wallet, payout, shipment or seller-verification simulation is included.

## Development prerequisites

- Node.js 22 or newer (tested with Node 24), npm, Docker for local Supabase.
- `curl`, Python 3 and `tar` for the pinned, checksum-verified Supabase CLI installer.
- In this cloud container use `export npm_config_cache=/workspace/.npm-cache` before npm commands.

```bash
npm ci
npm run setup:local
npm run db:start
npm run env:local
npm run dev
```

`setup:local` installs the pinned Supabase CLI into ignored `.tools/` without global writes and verifies the release SHA-256 checksum. `db:start` uses the supported Docker Hub image registry and excludes optional services. On Linux x86_64 with Docker’s `vfs` driver, its helper uses checksum-verified Crane to export the pinned Supabase PostgreSQL registry manifest into a single layer. This preserves the verified upstream filesystem, entrypoint, command, environment, user/workdir, volume and signal settings while avoiding excessive layer copies; the CLI supplies the database healthcheck. The local derivative is labeled with its upstream digest, tagged `padroom/postgres-flat:17.6.1.095`, and given the pinned CLI’s expected compatibility alias. Overlay-backed Docker skips this optimization. No TLS or artifact verification is disabled. Default local auth uses a local email inbox and immediate signup sessions; hosted deployments must enable email confirmation and configure real SMTP. `env:local` creates an ignored `.env.local` using local generated configuration without printing keys; it preserves an existing file. No service-role key is required by the web application.

Use the existing isolated checkout in cloud tasks; a Git worktree is unnecessary. `npm run db:stop` stops local services. `npm run db:reset` **destroys local development data** and reapplies migrations; never point this at production. There are no default seeds.

## Hosted Supabase / Vercel configuration

1. Create a Supabase project (use a separate development/preview project for testing).
2. Apply `supabase/migrations/202610080001_marketplace.sql` through Supabase migrations or the SQL editor. The migration creates tables, constraints, indexes, RLS, private `listing-photos` storage and RPCs. Review policies before launch. The first migration targets a fresh project; do not apply it over an existing conflicting schema.
3. Set these exact application variables in `.env.local` or Vercel project settings:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your project’s HTTPS URL from Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The project publishable key (the local anon JWT is also supported) |
| `NEXT_PUBLIC_APP_URL` | The exact browser origin, e.g. your HTTPS domain; no trailing path |

The publishable key is deliberately browser-safe, protected by RLS. **Do not put a secret/service-role key in any `NEXT_PUBLIC_` variable.** The app authenticates database operations as the user, including admin actions. Vercel uses the standard Next.js build (`npm run build`) and requires no custom server. Configure an explicit origin for each preview environment; mutation origin checks reject other origins.

4. In Supabase Auth, set Site URL to the application origin and add `<origin>/auth/callback` (including the password-recovery `?next=/reset-password` callback) to allowed redirects. Enable email confirmation, configure SMTP delivery and Supabase’s auth rate limits/CAPTCHA as appropriate. The app supports PKCE email confirmation. Choose password and abuse policies for your pilot.
5. Sign up an administrator normally, confirm their email and save their profile. In the Supabase SQL editor, bootstrap membership using the actual account UUID:

```sql
insert into public.admin_members(user_id) values ('ADMIN_AUTH_USER_UUID');
```

Only database operators can provision membership. Do not expose an admin bootstrap HTTP endpoint. Administrators access `/admin` through the signed-in account. An admin cannot suspend themselves. Admins cannot read private conversations merely by having membership.

6. Before public launch, publish reviewed privacy/terms/eligibility/retention/dispute policies, an operator support contact and data-controller identity. The current legal pages explicitly require this review and are not a compliance certification. Complete live SMTP confirmation, multi-account pilot testing, operational backups and monitoring in your actual deployment.

## Data and security

- All application tables have RLS; direct table mutations are revoked for anonymous and authenticated roles. Writes go through constrained RPCs that use `auth.uid()` and check active accounts, ownership, participant roles, valid transitions and per-user hourly limits.
- Anonymous queries return only active inventory from unsuspended sellers. Profiles are private except for a constrained display-name RPC. Favorites belong to their user. Conversations, messages and requests belong to their participants.
- Private photo storage permits owner uploads only to draft listing paths. The application checks file size/type, actually decodes content with Sharp, limits pixels, resizes to 1600px and converts to JPEG without metadata. The bucket also limits MIME type and size. Photos have RLS and short-lived signed URLs (60 seconds); already issued links can remain usable until expiry after a listing is hidden. Refresh a page to renew expired photo URLs.
- Purchase/trade transitions lock affected inventory in UUID order and reserve both trade items. Exactly one conflicting request may be accepted. Direct API calls cannot override ownership, approve inventory, alter private records or grant admin access. Accepted arrangements must be resolved before the seller edits/archives their items.
- Server mutations check browser Origin and validate input. Listing text and messages render as escaped React text. There are no service-role keys in application code.
- Auth endpoints use Supabase rate limiting. Database RPC limits cover listing writes (30/hour), messages (60/hour), requests (20/hour), reports (10/hour) and saves (120/hour). These are fixed pilot limits, shared across browser/direct RPC access.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:db
npx playwright install chromium
npm run test:e2e
```

`test:db` requires running **isolated local Supabase**, `.env.local` and Docker. It refuses a non-loopback URL, creates genuine temporary auth accounts, exercises real API calls and database concurrency, and removes its tagged fixtures afterward. It tests cross-account draft, message, conversation, saved-item, request and storage privacy; unauthorized writes/moderation; real uploads/publication; purchase completion; trade ownership/reservations; suspension; audit immutability and rate limiting.

Playwright tests the approved homepage on desktop/mobile and a genuine multi-account seller → admin → buyer flow at both 390px and 1280px when local Supabase is configured. It also exercises persisted conversation pagination, concurrent arrivals and unauthorized history access. For this cloud image’s preinstalled Chromium, use:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Temporary test screenshots and traces are excluded from Git. Approved before/after UI captures and selected independent verification captures are retained in `docs/screenshots`; reproduce the two current homepage captures against the running app with `npm run screenshots:home`. See `docs/HOME_UI_ACCEPTANCE.md` for the comparison against the approved contract. The production default never contains a synthetic catalog. See `docs/IMPLEMENTATION.md` for the milestone design and `docs/VALIDATION.md` for recorded results and remaining launch work.

The separate [fresh-checkout cloud verification](docs/CLOUD_VERIFICATION.md) records independently rerun checks, targeted fixes, retained desktop/mobile evidence and outstanding hosted launch configuration.

## Specifications

Read `AGENTS.md`, `docs/APPROVED_HOME_UI.md`, `docs/BRAND.md`, `docs/PRODUCT.md` and `docs/ENGINEERING.md` before extending the marketplace. PADROOM is not an official PlayStation, Sony, Xbox or Nintendo outlet.
