# PADROOM — Product requirements (working marketplace v1)
Status: Authorized working scope for the first closed-beta release. Updated 2026-10-08.

## Why this exists
Nigerian gamers should be able to discover, buy, sell and propose exchanges of physical gaming goods in one trusted, understandable place.
PADROOM is independent from Sony/PlayStation and other console manufacturers.

## Customers and goals
- **Buyer:** discover legitimate listings with useful detail; save items; contact sellers; request a purchase; understand status.
- **Seller:** create listings with actual photographs, edit/manage inventory, answer enquiries, handle purchase requests.
- **Admin:** protect inventory quality, review seller submissions, resolve reports, remove suspicious listings and keep an audit trail.

## Categories and geography
First: consoles, games (physical copies only), controllers, accessories. No account sharing, PSN account reselling, illegal game keys or warranty claims without proof. Start with city-based inventory for Lagos and Abuja; permit other Nigerian cities through a properly constrained city selector. Nigerian naira only.
The marketplace must support new, used, open-box and for-parts listings with specific condition notes. Do not conflate "used" with "refurbished".

## Functional navigation
- Public: Browse (/), category filters, search, product details (/listings/[slug-or-id]), explanation of how to buy safely, legal pages.
- Authenticated: saved items, sell/new listing, draft edit, my listings, inbox/conversations, offers / purchase requests, account/profile, sign-out.
- Admin: review queue, reported listings, user/listing moderation, audit log. Route protection must be enforced server-side.

## Primary workflows
### 1. Anonymous browsing
Landing directly in commerce. Public can query approved+active listings; browse sorted by newest; filter category, price range, city, condition and availability. Pagination/infinite scroll must be stable and efficient.
- Empty database: show "Nothing listed yet" plus a path to create the first listing. No simulated live inventory.
- Empty search: friendly message and clear-filter control.
- Search results reflect actual persisted database values.

### 2. Registration and profile
Register/login/logout using Supabase Auth. Verify email as configured. Create a profile on first login; collect display name and selected city; do not collect government ID or banking details in MVP. Sensitive contact info stays private by default. Profile settings and account logout work.
Avoid fake localStorage-only authentication.

### 3. Seller listing lifecycle
Seller can create a draft, fill title/category/brand/model/condition/price NGN/city/description/defects/inclusions, upload 1–8 photos, preview, then submit.
Server validation: all published required fields; price positive and within sensible configured limits; photo MIME and size; listing ownership; content length limits. Record image ownership, order and storage reference.
States: draft -> pending_review -> active OR rejected; active -> sold / archived; approved edits that materially change core item data return to review.
Seller can manage own items, withdraw listing and mark sold. They must not directly set approval/admin flags. Admin reason must be shown for rejected items.

### 4. Product detail and saved items
Real gallery of uploaded photos, price, location, honest condition details and seller display name. Signed-in buyer can save/unsave; favorites persist across login devices; no user can inspect another user's saved items.

### 5. Messaging
Buyer opens a conversation from a listing and sends real messages persisted to the database. Participants alone can see it. Block messaging self, blocked users and suspended listings as appropriate. Sender timestamp, unread indicator and relevant error handling. Realtime if reliable; fallback refresh/poll is acceptable.
Privacy: no global public endpoint that lists conversations.

### 6. Purchase requests and trade offers
"Request to buy": buyer submits an offer/request against a live listing; seller accepts or declines; buyer may cancel while pending. States and transition permissions enforced, and seller cannot accept a sold/archived item. Show status to both parties.
"Offer a trade": buyer selects one of their eligible active listings and optionally adds a written proposal, or requests an exchange; seller can accept/decline. Trade must refer to persisted items and status, not a dead CTA.
Accepting a request means *intent confirmed*, NOT payment settled, escrow funded or shipment booked. Sellers manually coordinate completion with buyers. Allow both parties to mark completed / cancelled as appropriate, with clear conditions and admin intervention if disputes arise.
Prevent duplicate active requests for the same buyer/item where appropriate. Race conditions must not allow mutually exclusive confirmed sales to coexist.

### 7. Reporting / moderation
Any logged-in user may flag a listing with selected reason and brief details. Rate limit reports. Admin can review and resolve, approve/reject listings with reason, hide suspicious stock, suspend accounts for abuse and audit actions.

## Payments and delivery — truthful v1 behavior
This version uses real messaging, offers and buyer/seller purchase requests. It does **not** accept payment inside the app until a payment provider, appropriate marketplace account/merchant approvals, risk policy and fulfillment model are chosen.
- CTA language: "Request to buy" not "Pay now" or "Checkout".
- Clearly say: "Payments and delivery are arranged separately during the pilot. PADROOM does not currently hold funds or guarantee transactions."
- Do not store bank cards, simulate charge success, invent escrow/wallet/insurance features or expose users' addresses.
- When ready, an actual Paystack/Flutterwave/other provider checkout can be a separately scoped integration with webhooks and reconciliation. Payment splits alone are not equivalent to escrow.
- Do not take commission automatically unless payment mechanism, agreements and accounting rules exist. A future platform fee structure remains a business decision.

## Trust and safety
- Seller truth-in-condition agreement and explicit photo rights.
- New listings require review before publication.
- No auto-generated "verified" badge. Do not assert seller verification if only an email is verified.
- Report abuse, fraud warnings, safe in-person transaction tips, account blocking and dispute contact route.
- Hide seller email/phone unless disclosed with consent. Refrain from publishing residential addresses.
- Age and consumer eligibility policies to be defined and reviewed; avoid marketing to children as buyers without policy support.
- Site must include privacy policy, terms, acceptable listing policy and contact mechanism, reviewed by the business owner/counsel before public rollout.

## Phase-one acceptance criteria
1. Two real email-based users can register/login/logout and maintain sessions across refresh.
2. Seller can create and edit a real listing, upload photos and submit for review; unauthorized owners cannot change it.
3. Admin can approve a listing and it becomes visible in public browse/search, including city/category filters.
4. Buyer can save the listing, see a persistent saved list, and remove it.
5. Buyer can send message and purchase request; seller can respond, and both see stored statuses.
6. Buyer can submit a real trade offer referencing their own listing, and seller can respond to it.
7. Admin can act on reports and the resulting listing state persists.
8. No private conversation, admin record, other person's draft, or storage object is accessible by a separate user (tested).
9. UI remains usable on small phone and desktop, with error/empty/loading states, focus navigation and screen-reader labels.
10. Real production build, migrations and setup instructions run cleanly without pretending integration keys exist.

## Outside v1
- In-app card payments, merchant split settlement, refunds, escrow/wallets, automatic delivery quotes/tracking, seller KYC, automated condition grading, AI valuation, promotions/paid boosts, public ratings, push notifications, native mobile applications, mass seller imports, crypto/NFT.
These are not simple UI toggles; integrate later as separate end-to-end features only when requirements are approved.

## Metrics (instrument ethically)
Track public search usage, listing submission completion, moderation time, contact/request conversion and disputed transactions using privacy-respecting analytics. Do not fabricate demand, GMV, sales or inventory counts.

## Decisions for owner before public launch
- Final domain and Nigerian business/trademark clearance.
- Commission/listing fee approach and merchant agreement.
- Whether PADROOM acts only as a classifieds facilitator or takes payments/fulfillment responsibility.
- Customer support escalation and dispute policy.
- Payment service eligibility and operational ownership of shipping.
- Seller onboarding requirements and launch cities.
