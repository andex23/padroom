"use client";
import { useId, useRef, useState } from "react";
import { Icon } from "./icon";
export function FilterPanel({
  children,
  count = 0,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        className="feed-filter"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <Icon name="filter" />
        Filter{count > 0 && <span className="filter-count">({count})</span>}
      </button>
      <dialog
        ref={dialog}
        id={id}
        className="filter-sheet"
        aria-labelledby={`${id}-title`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            dialog.current?.close();
        }}
      >
        <div className="sheet-heading">
          <h2 id={`${id}-title`}>Filters</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Close filters"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-content">{children}</div>
      </dialog>
    </>
  );
}
