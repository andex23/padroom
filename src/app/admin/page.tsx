import Link from "next/link";
import { administrator } from "@/lib/supabase";
import { fail } from "@/lib/catalog";
import { ActionForm } from "@/components/action-form";
import { Mutation, Textarea } from "@/components/ui";
export default async function Admin() {
  const { db } = await administrator();
  const results = await Promise.all([
    db
      .from("listings")
      .select("*")
      .in("status", ["pending_review", "active"])
      .order("updated_at"),
    db.from("reports").select("*").eq("status", "open").order("created_at"),
    db.from("profiles").select("*").order("created_at"),
    db
      .from("moderation_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  results.forEach((r) => fail(r.error));
  const [listings, reports, profiles, events] = results.map(
    (r) => r.data ?? [],
  );
  return (
    <>
      <h1>Moderation</h1>
      <p className="meta">
        Administrator workspace / Every moderation action is recorded.
      </p>
      <div className="two-col">
        <section>
          <h2>Inventory review</h2>
          {listings.length ? (
            listings.map((l) => (
              <article className="row" key={l.id}>
                <h3>
                  <Link href={`/listings/${l.id}`}>{l.title}</Link>
                </h3>
                <p className="meta">
                  {l.status.replaceAll("_", " ")} / Seller {l.seller_id}
                </p>
                {l.status === "pending_review" && (
                  <ActionForm
                    command="moderate"
                    fields={{ id: l.id, state: "active" }}
                  >
                    <button>Approve listing</button>
                  </ActionForm>
                )}
                <ActionForm
                  command="moderate"
                  className="stack-form"
                  fields={{
                    id: l.id,
                    state: l.status === "active" ? "archived" : "rejected",
                  }}
                >
                  <Textarea
                    label="Reason (5–1000 characters)"
                    name="reason"
                    minLength={5}
                    maxLength={1000}
                  />
                  <button className="secondary">
                    {l.status === "active" ? "Hide listing" : "Reject listing"}
                  </button>
                </ActionForm>
              </article>
            ))
          ) : (
            <p>No inventory awaiting action.</p>
          )}
        </section>
        <section>
          <h2>Open reports</h2>
          {reports.length ? (
            reports.map((r) => (
              <article className="row" key={r.id}>
                <h3>{r.reason}</h3>
                <p className="plain-text">{r.description}</p>
                <Link href={`/listings/${r.listing_id}`}>Review listing</Link>
                <Mutation
                  command="resolve-report"
                  id={r.id}
                  label="Resolve report"
                />
              </article>
            ))
          ) : (
            <p>No open reports.</p>
          )}
        </section>
      </div>
      <h2 className="form-section">Seller controls</h2>
      {profiles.map((p) => (
        <details key={p.id}>
          <summary>
            {p.display_name} / {p.suspended_at ? "Suspended" : "Active"} /{" "}
            {p.id}
          </summary>
          <ActionForm
            command="suspend"
            fields={{ id: p.id, state: p.suspended_at ? "restore" : "suspend" }}
            className="stack-form"
          >
            <Textarea
              label="Reason"
              name="reason"
              minLength={5}
              maxLength={1000}
            />
            <button className="secondary">
              {p.suspended_at ? "Restore account" : "Suspend account"}
            </button>
          </ActionForm>
        </details>
      ))}
      <h2 className="form-section">Audit trail / most recent 100 actions</h2>
      {events.map((e) => (
        <article className="row" key={e.id}>
          <p>
            {e.action} / {e.entity_id}
          </p>
          <p>{e.notes}</p>
          <p className="meta">
            {new Date(e.created_at).toLocaleString("en-NG", {
              timeZone: "Africa/Lagos",
            })}{" "}
            / Admin {e.admin_id}
          </p>
        </article>
      ))}
    </>
  );
}
