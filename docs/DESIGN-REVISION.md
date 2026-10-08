# PADROOM interface revision

The interface follows the binding Paper Mono, monochrome and product-first direction in `BRAND.md`. The shared shell and catalogue have been rebuilt around a compact commerce layout, with Geist Sans for reading and Paper Mono for navigation, controls and metadata.

## Implemented

- App header with a self-hosted typographic wordmark, integrated search, labeled account actions and a prominent Sell action. Mobile retains search and labeled bottom navigation.
- Restrained marketplace heading and category rail, persistent desktop filters, grouped price range, compact location/condition/brand controls and an expandable mobile filter panel.
- Real inventory count, immediate sorting, removable active filters and URL state preserved between search, filtering, category selection and sort changes.
- Square seller-photo cards, readable product names/prices and a ruled condition/location row. Images remain real private Supabase uploads; missing/failed media has a visible fallback.
- Deliberate empty catalogue with the actual listing/review/contact workflow. No pretend products or unsupported commerce promises.
- Listing gallery, category/listing-code breadcrumb, purchase/contact actions before detailed facts and consistent request styling.
- Seller step navigation, structured editing and practical condition/photo/price guidance. Existing draft, upload, preview and review actions remain connected.
- Current-page workspace navigation, consistent account forms, licensed self-hosted Geist Sans and the existing Paper Mono font.

## Viewing

The actual Next.js app runs on port 3000 inside the cloud workspace. Screenshots are taken from that app after browser checks. An interactive public URL requires a supported preview connection or a deployment with the configuration documented in README.md; a cloud loopback URL is not a public deployment.

The production database has no default inventory. Automated local workflow tests create explicitly labeled development fixtures and remove them afterward.
