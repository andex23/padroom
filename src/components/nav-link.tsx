"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icon";

export function NavLink({
  href,
  label,
  icon,
  className,
  iconOnly = false,
}: {
  href: string;
  label: string;
  icon?: IconName;
  className?: string;
  iconOnly?: boolean;
}) {
  const path = usePathname();
  const active =
    href === "/"
      ? path === "/" || path.startsWith("/listings/")
      : path === href ||
        path.startsWith(`${href}/`) ||
        (href === "/sell/new" && path.startsWith("/sell/"));
  return (
    <Link
      href={href}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {icon && <Icon name={icon} />}
      <span className={iconOnly ? "sr-only" : undefined}>{label}</span>
    </Link>
  );
}
