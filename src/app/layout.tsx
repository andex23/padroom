import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { CatalogSearch } from "@/components/catalog-search";
import { NavLink } from "@/components/nav-link";
import { Icon } from "@/components/icon";
import { viewer } from "@/lib/supabase";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "padroom. — Gaming equipment, still in play",
    template: "%s · padroom.",
  },
  description:
    "An independent Nigerian marketplace for consoles, controllers, games and accessories.",
};
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await viewer();
  return (
    <html lang="en-NG" className={GeistSans.variable}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="header">
          <div className="header-inner">
            <Link className="wordmark" href="/" aria-label="PADROOM home">
              padroom.
            </Link>
            <nav className="desktop-nav" aria-label="Main navigation">
              <NavLink href="/" label="Browse" />
              <Link className="category-nav" href="/?category=Consoles">
                Consoles
              </Link>
              <Link className="category-nav" href="/?category=Games">
                Games
              </Link>
              <Link className="category-nav" href="/?category=Accessories">
                Accessories
              </Link>
            </nav>
            <Suspense>
              <CatalogSearch />
            </Suspense>
            <nav className="account-nav" aria-label="Account navigation">
              <NavLink href="/saved" label="Saved" icon="bookmark" />
              <NavLink href="/messages" label="Messages" icon="message" />
              <NavLink
                href={user ? "/account" : "/sign-in"}
                label={user ? "Account" : "Sign in"}
                icon="account"
              />
            </nav>
            <Link className="button header-sell" href="/sell/new">
              <Icon name="plus" />
              Sell
            </Link>
          </div>
        </header>
        <main id="main" className="container">
          {children}
        </main>
        <footer className="footer">
          <div className="footer-identity">
            <Link href="/" className="wordmark">
              padroom.
            </Link>
            <span>
              Independent gaming commerce.
              <br />
              Nigeria / NGN
            </span>
          </div>
          <nav aria-label="Help">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/safety">Safety</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </footer>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <NavLink href="/" label="Browse" icon="browse" />
          <NavLink href="/saved" label="Saved" icon="bookmark" />
          <NavLink href="/sell/new" label="Sell" icon="plus" />
          <NavLink href="/messages" label="Inbox" icon="message" />
          <NavLink href="/account" label="Account" icon="account" />
        </nav>
      </body>
    </html>
  );
}
