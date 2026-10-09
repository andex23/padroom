import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { CatalogSearch } from "@/components/catalog-search";
import { NavLink } from "@/components/nav-link";
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
              <NavLink href="/" label="Home" />
              <NavLink href="/explore" label="Explore" />
              <NavLink href="/messages" label="Inbox" />
              <Link href="/sell/new" className="desktop-sell">
                Sell an item
              </Link>
            </nav>
            <nav className="account-nav" aria-label="Account navigation">
              <NavLink
                href="/saved"
                label="Saved listings"
                icon="heart"
                iconOnly
              />
              <NavLink
                href={user ? "/account" : "/sign-in"}
                label="Account"
                icon="account"
                iconOnly
              />
            </nav>
            <Suspense>
              <CatalogSearch />
            </Suspense>
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
          <NavLink href="/" label="Home" icon="home" />
          <NavLink href="/explore" label="Explore" icon="search" />
          <NavLink href="/sell/new" label="Sell" icon="plus-square" />
          <NavLink
            href={user ? "/account" : "/sign-in"}
            label="Account"
            icon="account"
          />
        </nav>
      </body>
    </html>
  );
}
