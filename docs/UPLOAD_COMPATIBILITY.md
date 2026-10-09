# Local upload compatibility follow-up / 9 October 2026

This follow-up preserves verification commit `73e446a431a6e0cddc25b2c7f88ddf448f50bb43` as an ancestor and resolves its identified local upload-policy risk. The [original cloud report](CLOUD_VERIFICATION.md), screenshots and result logs remain historical evidence. No hosted credentials, services, account access or production data were changed.

## Decision and behavior

[Vercel documents a 4.5 MB function request-body limit](https://vercel.com/docs/functions/limitations#request-body-size). Source photos now have a **4 MB / 4,000,000-byte** limit. Complete command bodies have a **4.25 MB / 4,250,000-byte** limit, including multipart boundaries, filenames and every field. These are decimal bytes, leaving 250,000 bytes between the complete application body cap and the documented provider limit.

The browser checks the source size, encodes the actual multipart form once, measures its Blob and sends that same encoding with its matching Content-Type boundary. It rejects a form over the total budget before fetch. All action forms share this guard. The server's existing bounded parser now counts up to the same limit and cancels oversized streams before parsing or authentication, regardless of missing or inaccurate Content-Length. Authenticated uploads also check the individual photo size. Oversized bodies/photos return HTTP 413 with clear validation; the form handles plain-text provider 413 responses and retains the selected file and retry controls.

Image processing remains the same: real JPEG/PNG/WebP decoding, a 25-million-pixel bound, orientation correction, at most 1600px without enlargement, JPEG quality 85 and metadata removal. Unit tests show that a valid PNG padded to the source-size boundary produces the identical normalized JPEG as its unpadded source. Ownership, draft-only uploads, private storage and database policies remain enforced by the existing implementation. No schema or storage migration is required.

## Verification

| Check | Result |
| --- | --- |
| Lint and TypeScript | Passed |
| Unit tests | 41 passed, zero skipped |
| Real local Supabase database assertions | 74 passed |
| Desktop/mobile browser tests | 24 passed (12 desktop, 12 mobile), zero failed/skipped/flaky; no retries |
| Production build | Passed with local configuration; 23 application routes, Next not-found route and proxy |
| Local fixture cleanup | Zero users, profiles, administrator memberships, inventory, messages, requests, reports, audit/rate records and stored objects; all 11 application tables have RLS |
| Hosted Vercel/Supabase validation | Blocked/unverified; no deployment was authorized |

The locked dependencies and existing local services were reused after the earlier independently successful install and fresh migration. The unchanged 74 database assertions were rerun, as well as all marketplace browser cases because shared form submission changed.

Boundary coverage includes source photos just below/at/one byte above 4 MB; complete multipart bodies just below/at/one byte above 4.25 MB; additional files and UTF-8 fields counted in the total; missing or dishonest Content-Length; stream cancellation; actual decoded maximum-size browser uploads; client rejection without a POST; server rejection when the browser is bypassed; and retryable plain-text 413 responses. The provider-error response is deliberately injected in that one test and does not establish a deployed Vercel result.

Evidence: [unit output](verification/upload/unit.log), [database assertions](verification/upload/database.log), [full browser run](verification/upload/browser.log), [lint](verification/upload/lint.log), [TypeScript](verification/upload/typecheck.log), [build](verification/upload/build.log), [cleanup](verification/upload/cleanup.log) and [machine-readable summary](verification/upload/results.json). Pre-fix failures are retained as [photo validation](verification/upload/image-red.log) and [HTTP request budget](verification/upload/request-red.log). The [initial expanded run](verification/upload/browser-initial.log) and [focused mobile check](verification/upload/filter-focused.log) retain the harness investigation evidence.

Inspected screenshot evidence: photo editor [mobile](screenshots/upload/verification-mobile-02-listing-photo.png) / [desktop](screenshots/upload/verification-desktop-02-listing-photo.png); visible size rejection [mobile](screenshots/upload/verification-mobile-11-upload-limit.png) / [desktop](screenshots/upload/verification-desktop-11-upload-limit.png). These show actual local test fixtures. The original approved homepage and independent-review captures remain intact.

The photo and request regressions failed before implementation. The first expanded browser run found a test-instrumentation error: Chromium omitted Blob-backed binary post data from Playwright's `postDataBuffer()`. Trace evidence showed a successful real upload with Content-Length 4,000,429. The final assertion checks the browser's transmitted Content-Length; byte-count enforcement is independently tested against real encoded bodies and streams. This harness correction is distinct from a production defect and from the final passing run.

That first run also exposed an existing mobile shell-test navigation race: it clicked Filter immediately after Home while the route transition was still pending. The focused mobile check passed. The full rerun adds explicit URL/current-navigation assertions before clicking Filter. No production filter behavior, arbitrary wait or automatic retry was introduced. The initial 21-pass/3-failure run is retained separately and does not count as final passing evidence.

## Remaining launch work

The local incompatibility is addressed; a real authorized preview must still verify maximum-size photo uploads, useful rejection/retry behavior and production multi-account flows. Choose and review an isolated hosted Supabase target before applying the existing migration. Configure actual HTTPS application/project origins and callback URLs, confirmation and authorized SMTP delivery, then bootstrap a genuine administrator using their actual auth UUID. Publish reviewed operational/legal policies and establish backups and monitoring. [The original report](CLOUD_VERIFICATION.md#remaining-launch-configuration-and-priority) gives the exact configuration steps and limitations.

No public deployment, hosted email confirmation/delivery, cross-browser recovery link or genuine launch administrator has been verified. No push, merge, public deployment, production migration, paid provisioning or persistent access expansion occurred.
