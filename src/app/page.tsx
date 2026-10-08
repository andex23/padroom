import Link from "next/link";
import { FilterPanel } from "@/components/filter-panel";
import { database, configured } from "@/lib/supabase";
import { categories, cities, conditions, Listing, toKobo } from "@/lib/domain";
import { listingSelect, fail } from "@/lib/catalog";
import { ListingCard } from "@/components/listing-card";
import { Empty, Select, SetupNotice } from "@/components/ui";
import { Icon } from "@/components/icon";
import { CatalogSort } from "@/components/catalog-sort";
type Params = Record<string, string | undefined>;
export default async function Browse({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const p = await searchParams;
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
    return `/?${q}`;
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
    return params.size ? `/?${params}` : "/";
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
    <div className="browse-page">
      <div className="browse-heading">
        <div>
          <p className="eyebrow">Marketplace / Nigeria</p>
          <h1>Browse</h1>
        </div>
        <p className="browse-intro">
          Consoles, games and equipment.
          <br />
          <span>Previously played. Ready again.</span>
        </p>
      </div>
      <nav className="tabs" aria-label="Categories">
        {["All", ...categories].map((c) => (
          <Link
            key={c}
            aria-current={(p.category || "All") === c ? "page" : undefined}
            href={changeFilter("category", c === "All" ? undefined : c)}
          >
            {c}
          </Link>
        ))}
      </nav>
      <div className="catalog">
        <FilterPanel>
          <form action="/" id="catalog-filters">
            <input type="hidden" name="q" value={p.q || ""} />
            <input type="hidden" name="category" value={p.category || ""} />
            <fieldset className="filter-group">
              <legend>Price range / NGN</legend>
              <div className="price-inputs">
                <label>
                  <span className="sr-only">Minimum price (₦)</span>
                  <input
                    name="min"
                    inputMode="decimal"
                    defaultValue={p.min}
                    placeholder="Min"
                  />
                </label>
                <span aria-hidden="true">—</span>
                <label>
                  <span className="sr-only">Maximum price (₦)</span>
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
            <button className="filter-apply">
              Apply filters
              <Icon name="arrow" />
            </button>
            <Link className="filter-reset" href="/">
              Clear filters
            </Link>
          </form>
          <div className="filter-help">
            <p className="meta">Buying for the first time?</p>
            <Link href="/safety">
              Read the safety guide
              <Icon name="arrow" />
            </Link>
          </div>
        </FilterPanel>
        <section className="catalog-results" aria-label="Listings">
          <div className="inventory-toolbar">
            <p className="meta">
              <span className="inventory-count">
                {count.toString().padStart(2, "0")}
              </span>{" "}
              {count === 1 ? "listing" : "listings"}
              {filtered ? " found" : " available"}
            </p>
            <CatalogSort value={p.sort || "Newest"} />
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
            <div className="listing-grid">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : filtered ? (
            <Empty title="No matching listings">
              <p>
                Try another city, adjust your price range or clear your filters.
              </p>
              <Link className="button secondary" href="/">
                Clear filters
                <Icon name="arrow" />
              </Link>
            </Empty>
          ) : (
            <section className="catalog-empty" aria-labelledby="empty-title">
              <div className="empty-content">
                <div className="empty-primary">
                  <p className="eyebrow">Open for your first listing</p>
                  <h2 id="empty-title">Nothing listed yet</h2>
                  <p>
                    Have equipment you no longer play?
                    <br />
                    Give it another round.
                  </p>
                  <Link className="button" href="/sell/new">
                    Create a listing
                    <Icon name="arrow" />
                  </Link>
                  <Link className="empty-guide" href="/how-it-works">
                    How selling works
                  </Link>
                </div>
                <ol
                  className="empty-steps"
                  aria-label="How to list your equipment"
                >
                  <li>
                    <span className="step-number">01</span>
                    <div>
                      <h3>List what you have</h3>
                      <p>Add the details, price and your own photos.</p>
                    </div>
                  </li>
                  <li>
                    <span className="step-number">02</span>
                    <div>
                      <h3>We review your listing</h3>
                      <p>Approved equipment appears in the marketplace.</p>
                    </div>
                  </li>
                  <li>
                    <span className="step-number">03</span>
                    <div>
                      <h3>Speak with a buyer</h3>
                      <p>Arrange payment and handover directly.</p>
                    </div>
                  </li>
                </ol>
              </div>
              <div className="empty-foot">
                <span>Consoles / Controllers / Games / Accessories</span>
                <Link href="/safety">
                  Trade carefully
                  <Icon name="arrow" />
                </Link>
              </div>
            </section>
          )}
          {(page > 1 || count > page * 24) && (
            <nav className="pagination" aria-label="Pages">
              {page > 1 && <Link href={url(page - 1)}>Previous</Link>}
              <span className="meta">Page {page}</span>
              {count > page * 24 && <Link href={url(page + 1)}>Next</Link>}
            </nav>
          )}
          <p className="catalog-note">
            Good things deserve another round.
            <Link href="/sell/new">
              Sell your equipment
              <Icon name="arrow" />
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
