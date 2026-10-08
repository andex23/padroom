"use client";
export function CatalogSort({ value }: { value: string }) {
  return (
    <label className="sort-control">
      Sort by
      <select
        name="sort"
        aria-label="Sort by"
        form="catalog-filters"
        defaultValue={value}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option>Newest</option>
        <option>Price: low to high</option>
        <option>Price: high to low</option>
      </select>
    </label>
  );
}
