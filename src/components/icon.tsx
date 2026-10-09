import type { CSSProperties } from "react";

export type IconName =
  | "search"
  | "arrow"
  | "plus"
  | "bookmark"
  | "message"
  | "account"
  | "browse"
  | "filter"
  | "close"
  | "heart"
  | "home"
  | "plus-square";
const paths: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  heart: (
    <path d="M20.5 5.6a5.2 5.2 0 0 0-7.4 0L12 6.7l-1.1-1.1a5.2 5.2 0 0 0-7.4 7.4L12 21l8.5-8a5.2 5.2 0 0 0 0-7.4Z" />
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" />
    </>
  ),
  "plus-square": (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 7v10M7 12h10" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
  message: <path d="M4 4h16v12H9l-5 4V4ZM8 8h8M8 12h5" />,
  account: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </>
  ),
  browse: (
    <>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </>
  ),
  filter: (
    <>
      <path d="M4 7h16M4 17h16M9 4v6M15 14v6" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
};
export function Icon({
  name,
  style,
}: {
  name: IconName;
  style?: CSSProperties;
}) {
  return (
    <svg
      className="icon"
      style={style}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
