# Draft PR: Fix auth redirects and upload limits; verify marketplace flows

PADROOM's auth callback accepted control-character paths that URL parsing could turn into an external redirect. Seller photo previews also retained a 1600px HTML height, and the existing 5 MiB upload allowance could exceed Vercel's 4.5 MB function-body limit once encoded as multipart.

Reject unsafe auth destinations, restore the intended square photo preview and enforce a shared 4 MB source-photo / 4.25 MB complete-command budget. The browser measures the encoding it sends, the server cancels over-budget streams, and 413 responses produce a clear retryable error. Image decoding, 1600px resizing, JPEG quality 85, private storage and ownership checks stay in place. The approved homepage and Paper Mono design are preserved.

Expand genuine desktop/mobile marketplace coverage for seller edits/photos, search/saves, private messages, recovery with a new-password login, purchase/trade state transitions, reports and moderation. Add byte-boundary, multipart-overhead, streamed-body and visible-error regressions; retain screenshots and reproducible result logs.

Validation: lint, strict TypeScript and production build passed; 41 unit tests, 74 genuine Supabase assertions and 24 desktop/mobile browser tests passed, with zero failures or skips and zero flaky/retried browser cases. Fixture cleanup confirmed zero records and stored objects. The dependency lock and migration are unchanged. Hosted Supabase, production auth redirects/SMTP, genuine administrator setup and public deployment remain unverified. Local fixtures are temporary and cleaned up. A real authorized preview is required before launch.

Review evidence: [cloud verification](CLOUD_VERIFICATION.md) and [upload follow-up](UPLOAD_COMPATIBILITY.md).

This file is a prepared description for a draft PR. No branch push or PR creation has occurred. The review branch must include commit `73e446a431a6e0cddc25b2c7f88ddf448f50bb43` and its upload follow-up above base `06f4c630f087a65f4a535f3aa4a30dc97079581b`; merging, deploying and applying hosted migrations remain separate steps.
