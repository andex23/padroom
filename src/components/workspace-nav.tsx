import { NavLink } from "./nav-link";
export function WorkspaceNav() {
  return (
    <nav className="workspace-nav meta" aria-label="Your workspace">
      <NavLink href="/my-listings" label="My listings" />
      <NavLink href="/saved" label="Saved" />
      <NavLink href="/messages" label="Messages" />
      <NavLink href="/offers" label="Requests & trades" />
      <NavLink href="/account" label="Profile" />
    </nav>
  );
}
