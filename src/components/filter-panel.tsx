"use client";
import { useState } from "react";
export function FilterPanel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="filters">
      <h2>Refine your search</h2>
      <button
        type="button"
        className="secondary filter-toggle"
        aria-expanded={open}
        aria-controls="filter-options"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide filters" : "Filters & sort"}
      </button>
      <div
        id="filter-options"
        className={open ? "filter-options open" : "filter-options"}
      >
        {children}
      </div>
    </aside>
  );
}
