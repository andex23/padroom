# PADROOM — APPROVED HOMEPAGE UI CONTRACT

**Status: APPROVED / LOCKED.** This is the exact revised mobile-first marketplace structure the owner approved in chat, not a new design exploration. Updated 2026-10-09.

## Read me first
For the storefront's homepage layout, this document takes precedence over general layout suggestions in BRAND.md, PRODUCT.md, README.md and any model-generated design ideas. Preserve the existing working marketplace functionality while making the screen match this structure. If implementing another screen, keep visual consistency with this shell but retain that screen's necessary actions. Do not reinterpret this as a marketing landing page.

## Approved mobile wireframe — layout and copy order

A) **Top navigation**, row one:
- Left: lowercase black **padroom.** wordmark (text only).
- Right: outlined HEART icon (saved listings) and outlined USER/ACCOUNT icon.
- No full-width nav menu, shopping-cart icon, green promo pill, location badge, sign-up CTA, or slogan.

B) **Search**, directly under top row:
- One full-width quiet input, subtle neutral filled background; search icon on the left.
- Placeholder exactly: **Search games, consoles, accessories...**
- Search works against the real backend catalog, not a decorative control.

C) **Category navigation** under search:
- A single horizontal, text-only, scrollable row with: **Discover | Consoles | Games | Accessories**.
- **Discover** is selected by default, indicated by type weight and optionally a thin underline. No colorful chips, filled pill buttons or category illustration tiles.
- The backend category named "Controllers" remains accessible through filters/search or a secondary category choice; do not remove it from actual data model to mimic this simplified top row.
- A thin light grey divider below the row.

D) **Listing section header**:
- Left text exactly: **Fresh in the room**
- Right: sliders/filter icon with text **Filter**.
- On first render, the user sees this header shortly after the category nav, not a promotional hero, giant typographic slogan, introduction or announcement bar.
- Filter opens a functional drawer/sheet with location, condition, min/max price and other existing applicable facets; it should not navigate to a decorative page.

E) **Product inventory grid** directly beneath:
- Mobile: **two columns**, modest gap, large 4:5 images. Desktop: 3–4 columns with the SAME content hierarchy.
- Each item: photo, product title (neutral sans), true NGN price if present, and quiet Paper Mono metadata, such as "Console / Pre-owned" and city. Maintain readable hierarchy: title, price, metadata as needed; do not use floating "TRENDING" ribbons, gradients or promo label chips.
- Original *visual examples* in the approved wireframe were a PlayStation 5 Slim and a black DualSense Controller. **They are composition examples only, NOT permission to seed fake inventory or borrow copyrighted catalog photos.** Only show actual approved, active product listings from Supabase. If empty, keep the exact layout skeleton and show a compact honest empty state under this header ("No listings yet" + a working "Sell an item" link).
- When listings exist, photo area supports real uploads, robust cropping / containment, honest condition and location.
- Do not place featured carousels, promotional banners, seller leaderboards or trust-stat cards above this grid.

F) **Bottom navigation on mobile**:
- Fixed or sticky safe-area-aware bottom bar with four equally spaced icon+text destinations in this order: **Home | Explore | Sell | Account**.
- Icons: outlined house, search, plus-square, user-round; labels visible.
- Home takes user to the approved "Fresh in the room" feed, Explore opens search/browse, Sell opens protected listing creation, Account opens profile/sign-in.
- Saved items open via the header heart; Inbox through Account or through relevant seller conversation screens. **Do not replace these four tabs with a five-tab arrangement.**
- Active indication should be monochrome, not colored badges. Bar cannot cover product cards or form actions.

### Approximate structural wireframe (not an image asset)

```text
┌────────────────────────────────────┐
│ padroom.                    ♡   ○   │  top row
│                                    │
│  ⌕ Search games, consoles,...      │  full-width search
│                                    │
│ Discover  Consoles Games Accessories│ text tabs (scroll)
│────────────────────────────────────│
│                                    │
│ Fresh in the room        ≡ Filter  │  section header
│                                    │
│ ┌────────────┐ ┌────────────┐     │
│ │            │ │            │     │
│ │ image      │ │ image      │     │  2-column inventory
│ │            │ │            │     │
│ └────────────┘ └────────────┘     │
│ Product title  Product title       │
│ ₦ actual       ₦ actual            │
│ Condition/City Condition/City      │
│                                    │
│         MORE INVENTORY ...         │
│────────────────────────────────────│
│  Home      Explore   Sell   Account│  4-item bottom nav
└────────────────────────────────────┘
```

## Mobile layout targets
These are visual constraints, not hard-coded viewport sizes. Be responsive, respect dynamic text and safe areas.
- Check viewport sizes: 375x667, 390x844, 430x932, 768x1024, 1280x800.
- Mobile outer horizontal padding: ~16px; gaps: 8px small / 12px between cards / 16–24px between sections.
- Top nav height around 52–60px, wordmark approximately 23–26px, two clickable icons with >=44px targets.
- Search input ~44–48px high with ~4–6px radius (not a capsule/pill).
- Category row about 40–44px and free horizontal scrolling, no wrap.
- Header text "Fresh in the room" around 19–22px; medium/semibold.
- Grid appears immediately beneath header, with ~12px gap. Card imagery approx 4:5. Avoid heavy card borders/shadows.
- Bottom nav content around 60–68px plus safe-area inset. Pad bottom of scroll content so nothing is concealed.
- User sees part of product inventory on the initial phone viewport when real products exist. Search, category row and section header must fit before it.

## Desktop adaptation
- Same content order, no separate desktop marketing homepage.
- Header may expose supplementary account/inbox links when room allows but the **wordmark, search, text categories, "Fresh in the room", filter and listings remain the core**.
- Keep filter as an on-demand UI; don't invent a large left-sidebar as the homepage default.
- Product grid can use 3–4 columns; cap overall width around 1400–1440px.
- Bottom bar disappears on desktop; expose functional Buy/Sell/Account navigation access in header appropriately.
- Leave enough above-the-fold height for visible listings.

## Brand and type rules (mandatory)
- Brand colors: ink #171717, bone #F3F2EE, white #FFFFFF, muted #767670, thin lines #DDDDD7, subtle input tint #EAE9E3. **No signature green accent.**
- Typeface "Paper Mono" must be genuinely loaded according to font license and applied to navigation captions, technical labels, filter labels, condition/location metadata and selected small helper text.
- Primary product names, prices and main section headline use a restrained legible neutral sans, e.g. Geist Sans.
- Monochrome icons, thin dividers, square/softly rounded media, no thick dropshadows, floating decorative cards, huge banners, gradients, glowing buttons, marketing copy around the feed or repetitive uppercase status badges.
- Don't add a large introductory title "GOOD GEAR. MORE GAME.", "THE GAMING MARKETPLACE", "LEVEL UP", "REIMAGINING GAMING", or any hero tagline above inventory. The wordmark itself is sufficient identity.

## Functional obligations for this exact UI
- Search submits or dynamically filters actual persisted listings, with URL state where appropriate.
- Category tabs update the live inventory query. Filter UI opens, applies and clears real filters; user can see active selections.
- Product cards navigate to functional listing details (price, photos, condition, city, owner details and legitimate actions).
- Heart opens the user's real saved listings and prompts sign-in appropriately; save actions persist.
- User icon opens authenticated account/sign-in.
- Bottom tabs take user to working routes. Sell requires auth and leads to persisted listing form.
- All active nav states, keyboard focus, empty results and network errors are explicit and accessible.
- Never invent catalog records or claim online checkout is live. The MVP buyer journey uses real purchase requests/messages until a payment provider is integrated.

## CODEx visual acceptance gates — do not mark complete before passing
1. **Phone 390px screenshot**: wordmark+heart+profile; search; one-line scrollable category nav; divider; "Fresh in the room" and Filter; two-column inventory/true empty state; four tab bottom nav. Same order, same wording, no intervening hero.
2. **Desktop 1280px screenshot**: same commerce-first order; real listings (or honest empty state) visible high on screen; no oversized sidebar/hero.
3. **Paper Mono inspection**: confirm actual font loaded; labels and metadata rendered in it, not generic monospace fallback alone.
4. **No-green inspection**: no bright green UI tokens, promo banners, fake trust badges or taglines above inventory.
5. **Interaction pass**: category filter, search, drawer filter, saved items, product details, account and Sell routes genuinely work.
6. **Data integrity**: cards render only approved listings; if DB empty, clearly say so instead of showing sample console products.
7. **Accessibility**: icon buttons accessible names, minimum 44px touch targets, keyboard navigation, form labels, contrast, safe area.
8. Capture both mobile/desktop screenshots and compare them against the hierarchy above. If they disagree, FIX THE UI before adding ornamental features.

## Instructions for correcting an existing Codex implementation
- Audit current homepage component, CSS, app navigation and routes. Identify each deviation from sections A–F.
- Remove offending hero/banner/gradient/chips/navigation styles without deleting functioning backend behavior.
- Refactor with small composable components (Header, SearchBar, CategoryTabs, FeedHeader, ListingGrid, BottomNav). Keep data services/auth separate.
- Make a before/after implementation checklist and link screenshots in PR/handoff. Do not replace working data fetching with static product cards.
- Preserve database migration state, auth policies, admin flows and product lifecycle. This is a visual/IA correction, not a rewrite of everything.
- If current Codex work is only local/unpushed, apply these instructions against the LOCAL working tree instead of starting another unrelated repository.
