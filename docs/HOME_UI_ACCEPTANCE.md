# Approved homepage implementation and comparison

The locked [APPROVED_HOME_UI.md](APPROVED_HOME_UI.md) controls this implementation. The latest GitHub `main` was merged into the existing application; working database queries, auth, uploads, saves, messages, offers, moderation and migrations were preserved.

## Before / after checklist

| Contract | Previous implementation | Corrected implementation |
| --- | --- | --- |
| A. Top row | Larger wordmark, sign-in text, missing mobile heart | 26px lowercase wordmark; outlined heart/account icons with 44px targets |
| B. Search | Different placeholder; search mixed into desktop navigation | Full-width tinted input beneath the top row; exact placeholder `Search games, consoles, accessories...`; real catalog search |
| C. Categories | All / Consoles / Controllers / Games / Accessories; introductory heading first | Discover / Consoles / Games / Accessories; selected text/underline; single scrollable row and divider; Controllers retained in filters/search |
| D. Feed header | Browse, supporting copy, permanent desktop sidebar | Fresh in the room / Filter; functional on-demand native dialog sheet on mobile and desktop |
| E. Inventory | Square media; large onboarding/empty panel | 4:5 uploaded media; two mobile columns, four at 1280px; title, real NGN price, Paper Mono category/condition/city; compact No listings yet / Sell an item |
| F. Bottom tabs | Five destinations: Browse / Saved / Sell / Inbox / Account | Exactly Home / Explore / Sell / Account with house/search/plus-square/user icons, safe-area inset and scroll-content clearance |

Explore uses the existing database-backed feed at `/explore` and focuses search. The heart opens persisted saved items; the account icon routes to the profile or sign-in. Inbox and seller inventory remain accessible through Account. Category/filter/search state stays in the URL. Sort and Controllers are available in the filter sheet.

## Screenshots

- [Before: 390px](screenshots/home-before-390.png) / [Before: 1280px](screenshots/home-before-1280.png)
- [Approved implementation: 390×844](screenshots/home-390.png) / [Approved implementation: 1280×800](screenshots/home-1280.png)

These are captures of the actual app. The database is empty after test-fixture cleanup, so they show the required honest empty state. No sample console images or fabricated catalog records are included.

Run the app, then use `npm run screenshots:home` to reproduce the two after screenshots. On this cloud environment the script uses installed Chromium; elsewhere install Playwright Chromium or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Screenshots are anonymous and contain no credentials.

## Acceptance inspection

The two captures were compared against A–F in the contract: top controls → search → four text categories → divider → Fresh in the room / Filter → compact inventory state. No hero, slogan, pills, sidebar, promotional sections or green accents intervene. Desktop retains the same hierarchy and hides the bottom bar.

Automated checks cover the exact placeholder/category/navigation wording, physical content order, heading position above 280px, actual Paper Mono load/use, touch targets, mobile Explore search focus, keyboard Escape/focus restoration for the filter sheet, Controllers availability and URL-preserving queries. Layout checks also cover 375×667, 430×932 and 768×1024. Real multi-account workflow tests exercise card navigation, uploaded media/grid geometry, saved persistence, messaging, purchase requests and account/session transitions.

Brand muted grey remains #767670; the darker #62625C supporting-text token is retained where needed for readable small text on bone, as allowed by the contract's accessibility requirement. Other identity tokens match the approved monochrome palette.
