import Link from "next/link";
import { FilterPanel } from "@/components/filter-panel";
import { database, configured } from "@/lib/supabase";
import { categories, cities, conditions, Listing, toKobo } from "@/lib/domain";
import { listingSelect, fail } from "@/lib/catalog";
import { ListingCard } from "@/components/listing-card";
import { Empty, Select, SetupNotice } from "@/components/ui";
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
  return (
    <>
      <form action="/" className="searchbar">
        <label
          className="sr-only"
          htmlFor="search"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          Search equipment
        </label>
        <input
          id="search"
          name="q"
          type="search"
          placeholder="Search consoles, games, equipment…"
          defaultValue={p.q}
          maxLength={120}
        />
        <button>Search</button>
      </form>
      <div className="browse-heading">
        <h1>Browse</h1>
        <span className="meta">
          {configured()
            ? `${count} ${count === 1 ? "listing" : "listings"}`
            : "Nigeria / Independent marketplace"}
        </span>
      </div>
      <nav className="tabs" aria-label="Categories">
        {["All", ...categories].map((c) => (
          <Link
            key={c}
            aria-current={(p.category || "All") === c ? "page" : undefined}
            href={c === "All" ? "/" : `/?category=${c}`}
          >
            {c}
          </Link>
        ))}
      </nav>
      <div className="catalog">
        <FilterPanel>
          <form action="/">
            <input type="hidden" name="q" value={p.q || ""} />
            <Select
              label="Category"
              name="category"
              values={categories}
              defaultValue={p.category || ""}
              empty="All categories"
            />
            <Select
              label="City"
              name="city"
              values={cities}
              defaultValue={p.city || ""}
              empty="All cities"
            />
            <Select
              label="Condition"
              name="condition"
              values={conditions}
              defaultValue={p.condition || ""}
              empty="Any condition"
            />
            <label>
              Brand
              <input
                name="brand"
                defaultValue={p.brand}
                maxLength={60}
                placeholder="Any brand"
              />
            </label>
            <label>
              Minimum price (₦)
              <input
                name="min"
                inputMode="decimal"
                defaultValue={p.min}
                placeholder="1"
              />
            </label>
            <label>
              Maximum price (₦)
              <input
                name="max"
                inputMode="decimal"
                defaultValue={p.max}
                placeholder="50,000,000"
              />
            </label>
            <Select
              label="Sort"
              name="sort"
              values={["Newest", "Price: low to high", "Price: high to low"]}
              defaultValue={p.sort || "Newest"}
            />
            <button>Apply filters</button>
            <Link href="/">Clear filters</Link>
          </form>
        </FilterPanel>
        <section aria-label="Listings">
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
          ) : (
            <Empty
              title={
                p.q ||
                p.category ||
                p.city ||
                p.condition ||
                p.brand ||
                p.min ||
                p.max
                  ? "No matching listings"
                  : "Nothing listed yet"
              }
            >
              <p>
                {Object.values(p).some(Boolean)
                  ? "Try a different search or clear your filters."
                  : "Good things deserve another round. Be the first to list your gaming equipment."}
              </p>
              <div className="actions">
                <Link className="button" href="/sell/new">
                  Create a listing
                </Link>
                <Link href="/">Clear filters</Link>
              </div>
            </Empty>
          )}
          <nav className="pagination" aria-label="Pages">
            {page > 1 && <Link href={url(page - 1)}>Previous</Link>}
            {count > page * 24 && <Link href={url(page + 1)}>Next</Link>}
          </nav>
        </section>
      </div>
    </>
  );
}
