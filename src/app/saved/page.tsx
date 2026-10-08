import Link from "next/link";
import { authenticated } from "@/lib/supabase";
import { Listing } from "@/lib/domain";
import { listingSelect, fail } from "@/lib/catalog";
import { ListingCard } from "@/components/listing-card";
import { Empty, Mutation } from "@/components/ui";
import { WorkspaceNav } from "@/components/workspace-nav";
export default async function Saved() {
  const { user, db } = await authenticated();
  const { data, error } = await db
    .from("saved_listings")
    .select(`listing_id,listings(${listingSelect})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  fail(error);
  return (
    <>
      <WorkspaceNav />
      <h1>Saved equipment</h1>
      {data?.length ? (
        <div className="listing-grid">
          {data.map((item) => (
            <div key={item.listing_id}>
              {item.listings ? (
                <ListingCard listing={item.listings as unknown as Listing} />
              ) : (
                <p>This listing is no longer public.</p>
              )}
              <Mutation
                command="save"
                id={item.listing_id}
                label="Remove from saved"
              />
            </div>
          ))}
        </div>
      ) : (
        <Empty title="Keep an eye on something">
          <p>
            Save equipment from its listing page. Your saved list stays with
            your account.
          </p>
          <Link href="/">Browse equipment</Link>
        </Empty>
      )}
    </>
  );
}
