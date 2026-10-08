import type { Metadata } from "next";
import Link from "next/link";
import { viewer } from "@/lib/supabase";
import { ActionForm } from "@/components/action-form";
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
    <html lang="en-NG">
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
              <Link href="/">Browse</Link>
              <Link className="category-nav" href="/?category=Consoles">
                Consoles
              </Link>
              <Link className="category-nav" href="/?category=Games">
                Games
              </Link>
              <Link className="category-nav" href="/?category=Accessories">
                Accessories
              </Link>
              <Link href="/sell/new">Sell</Link>
            </nav>
            <nav className="account-nav" aria-label="Account navigation">
              <Link href="/saved">Saved</Link>
              <Link href="/messages">Messages</Link>
              <Link href={user ? "/account" : "/sign-in"}>
                {user ? "Account" : "Sign in"}
              </Link>
              {user && (
                <ActionForm command="sign-out">
                  <button className="secondary">Sign out</button>
                </ActionForm>
              )}
            </nav>
          </div>
        </header>
        <main id="main" className="container">
          {children}
        </main>
        <footer className="footer">
          <span>padroom. / Independent gaming commerce, Nigeria.</span>
          <nav aria-label="Help">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/safety">Safety</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </footer>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <Link href="/">Browse</Link>
          <Link href="/saved">Saved</Link>
          <Link href="/sell/new">Sell</Link>
          <Link href="/messages">Inbox</Link>
          <Link href="/account">Account</Link>
        </nav>
      </body>
    </html>
  );
}
