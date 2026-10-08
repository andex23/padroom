import Link from 'next/link';
export function WorkspaceNav(){return <nav className="workspace-nav meta" aria-label="Your workspace"><Link href="/my-listings">My listings</Link><Link href="/saved">Saved</Link><Link href="/messages">Messages</Link><Link href="/offers">Requests & trades</Link><Link href="/account">Profile</Link></nav>;}
