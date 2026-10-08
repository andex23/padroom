import Link from "next/link";
import { authenticated } from "@/lib/supabase";
import { fail } from "@/lib/catalog";
import { money } from "@/lib/domain";
import { WorkspaceNav } from "@/components/workspace-nav";
import { Empty, Mutation } from "@/components/ui";
export default async function MyListings() {
  const { user, db } = await authenticated();
  const { data, error } = await db
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });
  fail(error);
  return (
    <>
      <WorkspaceNav />
      <div className="browse-heading">
        <h1>My listings</h1>
        <Link className="button" href="/sell/new">
          New listing
        </Link>
      </div>
      {data?.length ? (
        data.map((l) => (
          <article className="row" key={l.id}>
            <h2>
              <Link href={`/listings/${l.id}`}>{l.title}</Link>
            </h2>
            <p>{money(l.price_kobo)}</p>
            <p className="meta">
              {l.status.replaceAll("_", " ")} / {l.city}
            </p>
            {l.review_reason && <p>Review note: {l.review_reason}</p>}
            <div className="actions">
              <Link className="button secondary" href={`/sell/${l.id}/edit`}>
                Manage listing
              </Link>
              {l.status === "active" && (
                <Mutation
                  command="listing-state"
                  id={l.id}
                  state="sold"
                  label="Mark sold"
                />
              )}
              {!["sold", "archived"].includes(l.status) && (
                <Mutation
                  command="listing-state"
                  id={l.id}
                  state="archived"
                  label="Archive"
                />
              )}
            </div>
          </article>
        ))
      ) : (
        <Empty title="Your next listing starts here">
          <p>Save a draft, add your own photos and send it for review.</p>
          <Link href="/sell/new">Create a listing</Link>
        </Empty>
      )}
    </>
  );
}
