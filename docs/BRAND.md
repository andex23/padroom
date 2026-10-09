# PADROOM — Brand and interface system
Status: Working design direction for v1. Updated 2026-10-09.

**HOME LAYOUT OVERRIDE:** The owner-approved mobile and desktop structure is specified in [APPROVED_HOME_UI.md](APPROVED_HOME_UI.md). It is mandatory. Any general layout suggestion here that conflicts with it is superseded for the homepage.

## Identity
**Name:** PADROOM / wordmark shown as **padroom.**
**Category:** Independent gaming commerce web app for Nigeria.
**Position:** A clean, dependable place to find, list and exchange gaming equipment.
**Voice:** understated, informed, precise, human; product-first rather than campaign-first.
**Working line:** "Trade. Play. Repeat." Use sparingly; do not put it in the first-screen hero.
**Editorial lines for selected campaigns:** "Still in play." / "Made to be played." / "Pass it on." / "Previously played. Ready again."
Avoid false claims: "verified seller", "secured payment", "100% safe", "official PSN partner", "instant payout" unless genuinely delivered and documented.

## Primary design rule
This is a web APP, not a marketing landing page. No full-height hero, neon green, decorative labels, trendy abstract gradients, fake product counts, glowing buttons, slogan-heavy UI, generic game-controller gaming visuals, oversized panels, or placeholder testimonials.
On first screen, people must see navigation, search, category/filter controls and actual inventory (or a useful empty state when none exists).

## Logo / wordmark
- Primary: "padroom." all lowercase, solid ink, no controller glyph, no gamepad icon, no PlayStation button symbols.
- Start from a restrained bold grotesk/sans wordmark. Adjust kerning manually when drawing final vector, especially "dr", "oo" and terminal period.
- Responsive lockups: wordmark alone (desktop & mobile); small "p." monogram for favicon/app icon only after visual review.
- Leave clear space of at least the height of the period on all sides; minimum practical wordmark width 80px.
- Black wordmark on bone or bone on carbon. Do not apply colored accents to the dot.
- Brand identity remains independent of Sony, Microsoft and Nintendo.

## Color tokens
No bright green anywhere. Monochrome is a design decision, not a placeholder.

| Token | Hex | Use |
|---|---|---|
| --ink | #171717 | primary text, navigation, strong borders, dark logo |
| --bone | #F3F2EE | main light background |
| --paper | #FFFFFF | product cards, inputs, surfaces |
| --muted | #767670 | metadata, supporting text |
| --line | #DDDDD7 | hairline borders |
| --mist | #EAE9E3 | quiet hover/focus background |
| --night | #1B1B1A | optional dark image panels / dark mode |
| --critical | #A83E3E | actual validation or destructive states only |

UI may use blue/green only when required by an external provider's mandatory branding or meaningful accessibility/status semantics, never as a recurring brand accent. Accessibility and clarity override aesthetic minimalism.

## Type
**Primary UI / product type:** Geist Sans or a comparably neutral accessible sans, with stable open licensing. Body 14–16px. Heading sizes restrained: main screen heading 24–32px desktop, 22–26px mobile. Use weight, not gratuitous size, for hierarchy.
**Technical/editorial type:** **Paper Mono**, from https://github.com/paper-design/paper-mono (SIL OFL 1.1). Actually load this font in the build. Use it for nav labels, filters, sort controls, listing codes, condition/city metadata, dates, inventory counts, buttons where suitable, footer and occasional short callouts. Do NOT set every product name, long paragraph or form explanation in mono.
- Paper Mono tokens: 11–12px / line-height 1.4–1.6 / normal or medium weight; uppercase only for brief functional labels.
- Respect the upstream SIL OFL license when self-hosting, including bundled license and attribution. Do not commit unlicensed font files. Provide fallback: ui-monospace, SFMono-Regular, monospace.
- Product name and price prioritize visual legibility. NGN prices formatted with ₦ and separators, e.g. ₦245,000, not fake price labels.

Example:
- Heading in Sans: "Browse"
- Paper Mono line: "CONSOLES / LAGOS / USED"
- Product card: "PlayStation 5 Slim" (Sans), "₦—" only when price not set / otherwise actual NGN amount, "GOOD CONDITION · LAGOS" (Paper Mono)
- Button: "View details" not "Level up your experience"

## Grid, shape and rhythm
- Mobile-first: compact top nav, full-width search input, horizontally scrollable categories, 2-column product grid when viewport allows (single column for narrower accessibility needs).
- Desktop: 12-column responsive grid; 3–4 listing columns; max container ~1440px; 24–36px outer gutters. Homepage filters open on demand; do not introduce a default left-sidebar that replaces the approved composition.
- Spacing system: 4 / 8 / 12 / 16 / 24 / 32 / 48; favor density and intentional negative space over giant empty bands.
- Square or 4px corner radius for product images and cards; inputs radius 4–6px. No giant pill cards.
- Thin 1px borders. Shadows only when essential (dialogs, menus), not on every card.
- Product imagery is central. Cards use consistent 4:5 or 1:1 media aspect ratio with object-fit:contain when needed; actual seller photos may be messy, so image crop and visible fallback must be robust.
- Hover/focus: outline, underline, tonal backgrounds. Keep high-contrast keyboard focus ring (2px or greater).

## App information architecture — locked approved home layout
**Refer to [APPROVED_HOME_UI.md](APPROVED_HOME_UI.md) for exact hierarchy, sizing, labels, acceptance screenshots and interaction contracts.**

Mobile homepage:
1. First row: **padroom.** wordmark left, heart (saved) and person (account) icons right.
2. Full-width search input directly below the header.
3. One horizontal plain-text category row: **Discover / Consoles / Games / Accessories**.
4. Hairline divider.
5. Section header **Fresh in the room** on left, **Filter** and sliders icon on right.
6. Actual database-backed inventory cards in a two-column grid with real price, condition and city; or honest empty state.
7. Exactly four safe-area-aware bottom tab destinations: **Home / Explore / Sell / Account**. Saved is via top heart; inbox is within Account or listing conversations. Do not add a fifth bottom tab.

Desktop homepage keeps the same commerce-first sequence, using more product columns and a standard header rather than an alternate marketing page.

Do **not** insert a slogan hero, ad banners, colored category pills, decorative "verified" labels, oversized campaign headings, a default filter sidebar, or featured collections before the grid.

### Product detail
Large honest photo gallery. Right summary: title, real price, condition, city, posted date, seller name, key facts (tested?, box?, accessories included?, known faults?), description.
Actions: "Message seller", "Request to buy", "Offer a trade" (only where supported). Save toggle. Safety note about payment and in-person handover.
Use neutral status text, e.g. "Pending approval" or "Sold", without design-y chips.

### Sell flow
Two to four clear steps: item / condition / photos & price / preview & submit. Each step has explicit validation and draft-save where supported.
Clearly display "Your listing will be reviewed before it appears."

### Account, messages, saved
Quiet editorial layouts with table/list treatment and mobile adaptation. Minimal chrome; actions remain explicit and discoverable.

## Copy rules
- Plain language. "Sell a console" beats "Monetize your gaming assets."
- Labels such as "Pre-owned", "Condition", "Included", "Location", "Make an offer", "Request sent", "Listed", "Archived".
- No "level up", "unlock", "ultimate", "elevate", or "welcome to the future of gaming".
- A very short editorial copy sample is allowed below the product grid: "Good things deserve another round."
- Real seller contact information must not be exposed publicly by default.

## Interaction/UX quality bar
- Search/filter state reflected in the URL when practical (shareable).
- Smooth skeletons are optional; must not obscure slow-network errors.
- All listing cards link to a real listing ID; no demo-only CTAs.
- Real validation, keyboard navigation, form help, visible active filters, clear mobile sort/filter drawer.
- Loading, empty, failure, pending review, sold and archived states designed deliberately.
- Design tokens centralized (e.g. CSS custom properties), reusable components, no one-off random style values.
- Review at 375px, 430px, 768px, 1280px and 1440px viewport widths, including low-bandwidth image loading.

## Brand implementation deliverables
- Typed tokens, text styles and reusable app shell.
- Wordmark as editable typographic lockup; optional original vector monogram later.
- Real code implementations of browse, product details, sell, saves, inbox, profile and admin screens.
- Snapshot/screenshot review for mobile and desktop before marking styling done.

For the homepage, [APPROVED_HOME_UI.md](APPROVED_HOME_UI.md) is the exact approved structural contract. Do not reinterpret its layout. On all other screens, use this design system while preserving functional requirements.
