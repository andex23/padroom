"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icon } from "./icon";

export function CatalogSearch() {
  const params = useSearchParams();
  const path = usePathname();
  const browsing = path === "/" || path === "/explore";
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (path === "/explore") input.current?.focus();
  }, [path]);
  const query = browsing ? params.get("q") || "" : "";
  return (
    <form
      action={path === "/explore" ? "/explore" : "/"}
      className="header-search"
      role="search"
    >
      <button aria-label="Search" type="submit">
        <Icon name="search" />
      </button>
      <label className="sr-only" htmlFor="catalog-search">
        Search equipment
      </label>
      <input
        id="catalog-search"
        ref={input}
        enterKeyHint="search"
        key={query}
        name="q"
        type="search"
        placeholder="Search games, consoles, accessories..."
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
    </form>
  );
}
