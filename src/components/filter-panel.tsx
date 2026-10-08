"use client";
import { useState } from "react";
import { Icon } from "./icon";
export function FilterPanel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="filters">
      <div className="filter-heading">
        <h2>Filters</h2>
        <Icon name="filter" />
      </div>
      <button
        type="button"
        className="secondary filter-toggle"
        aria-expanded={open}
        aria-controls="filter-options"
        onClick={() => setOpen(!open)}
      >
        <Icon name="filter" />
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
