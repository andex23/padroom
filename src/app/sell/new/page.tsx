import Link from "next/link";
import { authenticated } from "@/lib/supabase";
import { ListingEditor } from "@/components/listing-editor";
import { SellProgress } from "@/components/sell-progress";
export default async function NewListing() {
  const { user, db } = await authenticated();
  const { data: profile } = await db
    .from("profiles")
    .select("id,suspended_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.suspended_at)
    return (
      <section className="empty">
        <h1>Complete your profile first</h1>
        <p>An active profile is required to sell equipment.</p>
        <Link href="/account">Your account</Link>
      </section>
    );
  return (
    <section className="sell-page">
      <p className="eyebrow">Seller workspace / New listing</p>
      <h1>List your equipment</h1>
      <p>
        Consoles, controllers, physical games and accessories. No account sales
        or illegal keys.
      </p>
      <SellProgress />
      <div className="sell-layout">
        <div className="panel" id="listing-details">
          <ListingEditor />
        </div>
        <aside className="sell-guidance">
          <h2>Tell it as it is.</h2>
          <p>Buyers need the details you would want to know.</p>
          <dl>
            <div>
              <dt>Condition</dt>
              <dd>Say what works, what’s worn and any known faults.</dd>
            </div>
            <div>
              <dt>Photos</dt>
              <dd>Use your own photos. Include every side and any defects.</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>Set your asking price in Nigerian naira.</dd>
            </div>
          </dl>
          <p className="meta">
            Your listing will be reviewed before it appears.
          </p>
        </aside>
      </div>
    </section>
  );
}
