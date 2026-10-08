"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "./icon";

export function CatalogSearch() {
  const params = useSearchParams();
  const browsing = usePathname() === "/";
  const query = browsing ? params.get("q") || "" : "";
  return (
    <form action="/" className="header-search" role="search">
      <Icon name="search" />
      <label className="sr-only" htmlFor="catalog-search">
        Search equipment
      </label>
      <input
        id="catalog-search"
        key={query}
        name="q"
        type="search"
        placeholder="Search gaming equipment"
        defaultValue={query}
        maxLength={120}
      />
      {browsing &&
        ["category", "city", "condition", "brand", "min", "max", "sort"].map(
          (key) =>
            params.get(key) ? (
              <input
                key={key}
                type="hidden"
                name={key}
                value={params.get(key)!}
              />
            ) : null,
        )}
      <button aria-label="Search" type="submit">
        <Icon name="arrow" />
      </button>
    </form>
  );
}
