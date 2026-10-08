import Link from "next/link";
import { authenticated } from "@/lib/supabase";
import { fail } from "@/lib/catalog";
import { Empty, Mutation, PilotNote } from "@/components/ui";
import { WorkspaceNav } from "@/components/workspace-nav";
import { Refresh } from "@/components/refresh";
export default async function Offers() {
  const { user, db } = await authenticated();
  const { data, error } = await db
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });
  fail(error);
  return (
    <>
      <WorkspaceNav />
      <h1>Requests & trades</h1>
      <p>
        Acceptance confirms intent. Mark completed only after you have arranged
        payment and handover separately.
      </p>
      <Refresh />
      {data?.length ? (
        data.map((o) => (
          <article className="row" key={o.id}>
            <h2>
              {o.kind === "trade" ? "Trade offer" : "Purchase request"} /{" "}
              {o.id.slice(0, 8)}
            </h2>
            <p className="meta">
              {o.seller_id === user.id ? "Received" : "Sent"} · {o.status} ·{" "}
              {new Date(o.created_at).toLocaleDateString("en-NG", {
                timeZone: "Africa/Lagos",
              })}
            </p>
            <p>
              <Link href={`/listings/${o.listing_id}`}>
                Requested equipment
              </Link>
              {o.offered_listing_id && (
                <>
                  {" "}
                  /{" "}
                  <Link href={`/listings/${o.offered_listing_id}`}>
                    Offered equipment
                  </Link>
                </>
              )}
            </p>
            <p className="plain-text">{o.note}</p>
            <div className="actions">
              {o.status === "pending" &&
                (o.seller_id === user.id ? (
                  <>
                    <Mutation
                      command="offer-state"
                      id={o.id}
                      state="accepted"
                      label="Accept request"
                    />
                    <Mutation
                      command="offer-state"
                      id={o.id}
                      state="declined"
                      label="Decline"
                    />
                  </>
                ) : (
                  <Mutation
                    command="offer-state"
                    id={o.id}
                    state="cancelled"
                    label="Cancel request"
                  />
                ))}
              {o.status === "accepted" && (
                <>
                  <Mutation
                    command="offer-state"
                    id={o.id}
                    state="completed"
                    label="Mark handover completed"
                  />
                  <Mutation
                    command="offer-state"
                    id={o.id}
                    state="cancelled"
                    label="Cancel arrangement"
                  />
                </>
              )}
            </div>
          </article>
        ))
      ) : (
        <Empty title="No requests yet">
          <p>
            Find an item and send a purchase request, or offer one of your own
            approved listings in a trade.
          </p>
          <Link href="/">Browse equipment</Link>
        </Empty>
      )}
      <PilotNote />
    </>
  );
}
