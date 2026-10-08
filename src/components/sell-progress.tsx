export function SellProgress({
  saved = false,
  photos = false,
}: {
  saved?: boolean;
  photos?: boolean;
}) {
  const current = !saved ? 0 : !photos ? 1 : 2;
  return (
    <nav className="sell-progress" aria-label="Listing steps">
      <ol>
        {["Item details", "Photos", "Review & submit"].map((title, index) => (
          <li key={title} aria-current={current === index ? "step" : undefined}>
            <span className="meta">0{index + 1}</span>
            {saved ? (
              <a href={`#listing-${["details", "photos", "review"][index]}`}>
                {title}
              </a>
            ) : (
              <span>{title}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
