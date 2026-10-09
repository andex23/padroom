import Link from "next/link";
import { FilterPanel } from "@/components/filter-panel";
import { database, configured } from "@/lib/supabase";
import { categories, cities, conditions, Listing, toKobo } from "@/lib/domain";
import { listingSelect, fail } from "@/lib/catalog";
import { ListingCard } from "@/components/listing-card";
import { Select, SetupNotice } from "@/components/ui";
import { Icon } from "@/components/icon";
type Params = Record<string, string | undefined>;
export async function MarketplaceFeed({
  p,
  basePath = "/",
}: {
  p: Params;
  basePath?: string;
}) {
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(p.page || "1", 10) || 1),
  );
  let listings: Listing[] = [];
  let count = 0;
  let priceError = "";
  if (configured()) {
    const db = await database();
    let query = db
      .from("listings")
      .select(listingSelect, { count: "exact" })
      .eq("status", "active");
    if (p.q)
      query = query.textSearch("search_document", p.q.slice(0, 120), {
        type: "websearch",
        config: "english",
      });
    if (categories.includes(p.category as (typeof categories)[number]))
      query = query.eq("category", p.category);
    if (cities.includes(p.city as (typeof cities)[number]))
      query = query.eq("city", p.city);
    if (conditions.includes(p.condition as (typeof conditions)[number]))
      query = query.eq("condition", p.condition);
    if (p.brand) query = query.eq("brand", p.brand.slice(0, 60));
    try {
      if (p.min) query = query.gte("price_kobo", toKobo(p.min));
      if (p.max) query = query.lte("price_kobo", toKobo(p.max));
    } catch {
      priceError = "Enter a valid price from ₦1 to ₦50,000,000.";
    }
    const sort =
      p.sort === "Price: low to high"
        ? "price_kobo"
        : p.sort === "Price: high to low"
          ? "price_kobo"
          : "created_at";
    const {
      data,
      error,
      count: total,
    } = await query
      .order(sort, { ascending: p.sort === "Price: low to high" })
      .order("id")
      .range((page - 1) * 24, page * 24 - 1);
    fail(error);
    listings = data as Listing[];
    count = total ?? 0;
  }
  const url = (n: number) => {
    const q = new URLSearchParams(
      Object.entries(p).filter(
        (entry): entry is [string, string] => !!entry[1],
      ),
    );
    q.set("page", String(n));
    return `${basePath}?${q}`;
  };
  const filterKeys = [
    "q",
    "category",
    "city",
    "condition",
    "brand",
    "min",
    "max",
  ];
  const activeFilters = filterKeys.filter((key) => p[key]);
  const filtered = activeFilters.length > 0;
  const changeFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(
      Object.entries(p).filter(
        (entry): entry is [string, string] => !!entry[1],
      ),
    );
    params.delete("page");
    if (value) params.set(key, value);
    else params.delete(key);
    return params.size ? `${basePath}?${params}` : basePath;
  };
  const filterLabel = (key: string) =>
    key === "min"
      ? `From ₦${p[key]}`
      : key === "max"
        ? `Up to ₦${p[key]}`
        : key === "q"
          ? `Search: ${p[key]}`
          : p[key];
  return (
    <div className="marketplace-feed">
      <nav className="tabs" aria-label="Categories">
        {["Discover", "Consoles", "Games", "Accessories"].map((c) => (
          <Link
            key={c}
            aria-current={
              (!p.category && c === "Discover") || p.category === c
                ? "page"
                : undefined
            }
            href={changeFilter("category", c === "Discover" ? undefined : c)}
          >
            {c}
          </Link>
        ))}
      </nav>
      <section aria-label="Listings">
        <div className="feed-header">
          <h1>Fresh in the room</h1>
          <FilterPanel count={activeFilters.length}>
            <form action={basePath} id="catalog-filters">
              <input type="hidden" name="q" value={p.q || ""} />
              <div className="filter-group">
                <Select
                  label="Category"
                  name="category"
                  values={categories}
                  defaultValue={p.category || ""}
                  empty="All categories"
                />
              </div>
              <div className="filter-group">
                <Select
                  label="Location"
                  name="city"
                  values={cities}
                  defaultValue={p.city || ""}
                  empty="All cities"
                />
              </div>
              <div className="filter-group">
                <Select
                  label="Condition"
                  name="condition"
                  values={conditions}
                  defaultValue={p.condition || ""}
                  empty="Any condition"
                />
              </div>
              <fieldset className="filter-group">
                <legend>Price range / NGN</legend>
                <div className="price-inputs">
                  <label>
                    Minimum price (₦)
                    <input
                      name="min"
                      inputMode="decimal"
                      defaultValue={p.min}
                      placeholder="Min"
                    />
                  </label>
                  <label>
                    Maximum price (₦)
                    <input
                      name="max"
                      inputMode="decimal"
                      defaultValue={p.max}
                      placeholder="Max"
                    />
                  </label>
                </div>
              </fieldset>
              <div className="filter-group">
                <label>
                  Brand / device
                  <input
                    name="brand"
                    defaultValue={p.brand}
                    maxLength={60}
                    placeholder="e.g. Sony, Nintendo"
                  />
                </label>
              </div>
              <div className="filter-group">
                <Select
                  label="Sort by"
                  name="sort"
                  values={[
                    "Newest",
                    "Price: low to high",
                    "Price: high to low",
                  ]}
                  defaultValue={p.sort || "Newest"}
                />
              </div>
              <div className="sheet-actions">
                <button>Apply filters</button>
                <Link className="button secondary" href={basePath}>
                  Clear filters
                </Link>
              </div>
            </form>
          </FilterPanel>
        </div>
        {filtered && (
          <div className="active-filters" aria-label="Active filters">
            {activeFilters.map((key) => (
              <Link
                key={key}
                href={changeFilter(key)}
                aria-label={`Remove ${filterLabel(key)} filter`}
              >
                {filterLabel(key)}
                <Icon name="close" />
              </Link>
            ))}
          </div>
        )}
        {priceError && (
          <p role="alert" className="error">
            {priceError}
          </p>
        )}
        {!configured() ? (
          <SetupNotice />
        ) : listings.length ? (
          <>
            <p className="sr-only">
              {count} {count === 1 ? "listing" : "listings"}
            </p>
            <div className="listing-grid">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        ) : (
          <div className="feed-empty">
            <h2>{filtered ? "No matching listings" : "No listings yet"}</h2>
            {filtered ? (
              <Link href={basePath}>Clear filters</Link>
            ) : (
              <Link href="/sell/new">Sell an item</Link>
            )}
          </div>
        )}
        {(page > 1 || count > page * 24) && (
          <nav className="pagination" aria-label="Pages">
            {page > 1 && <Link href={url(page - 1)}>Previous</Link>}
            <span className="meta">Page {page}</span>
            {count > page * 24 && <Link href={url(page + 1)}>Next</Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
