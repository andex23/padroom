import { Photo } from "@/components/photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { database, viewer } from "@/lib/supabase";
import { Listing, money, uuid } from "@/lib/domain";
import { listingSelect, photos, fail } from "@/lib/catalog";
import { ActionForm } from "@/components/action-form";
import { Mutation, PilotNote, Textarea, Select } from "@/components/ui";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const db = await database();
  const { data, error } = await db
    .from("listings")
    .select(listingSelect)
    .eq("id", id)
    .maybeSingle();
  fail(error);
  if (!data) notFound();
  const l = data as Listing;
  const images = await photos(l);
  const user = await viewer();
  const owner = user?.id === l.seller_id;
  const { data: name } = await db.rpc("seller_name", { p_id: l.seller_id });
  const { data: saved } = user
    ? await db
        .from("saved_listings")
        .select("listing_id")
        .eq("user_id", user.id)
        .eq("listing_id", id)
        .maybeSingle()
    : { data: null };
  const { data: mine } = user
    ? await db
        .from("listings")
        .select("id,title")
        .eq("seller_id", user.id)
        .eq("status", "active")
    : { data: [] };
  return (
    <>
      <Link href="/">← Browse</Link>
      <div className="detail" style={{ marginTop: 24 }}>
        <div className="gallery">
          {images.length ? (
            images.map((i) =>
              i.url ? (
                <Photo
                  key={i.id}
                  src={i.url}
                  alt={`${l.title} — photo ${i.position + 1}`}
                />
              ) : (
                <p key={i.id} className="meta">
                  Photo unavailable
                </p>
              ),
            )
          ) : (
            <p className="meta">No photos added yet</p>
          )}
        </div>
        <section>
          <p className="meta">
            {l.category.toUpperCase()} / {l.city.toUpperCase()}
          </p>
          <h1>{l.title}</h1>
          <p className="price">{money(l.price_kobo)}</p>
          <p className="meta">
            {l.condition} · Listed{" "}
            {new Date(l.created_at).toLocaleDateString("en-NG", {
              timeZone: "Africa/Lagos",
            })}
          </p>
          {l.status !== "active" && (
            <p className="meta">{l.status.replaceAll("_", " ")}</p>
          )}
          <dl>
            {[
              ["Seller", name || "Seller"],
              [
                "Brand / model",
                [l.brand, l.model].filter(Boolean).join(" / ") ||
                  "Not specified",
              ],
              ["Condition", l.condition],
              ["Known defects", l.defects],
              ["Included", l.included_items],
            ].map(([label, value]) => (
              <div className="fact" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <h2>Description</h2>
          <p className="plain-text">{l.description}</p>
          {owner ? (
            <Link className="button" href={`/sell/${id}/edit`}>
              Manage your listing
            </Link>
          ) : l.status === "active" ? (
            user ? (
              <>
                <Mutation
                  command="save"
                  id={id}
                  label={saved ? "Remove from saved" : "Save equipment"}
                />
                <details>
                  <summary>Message seller</summary>
                  <ActionForm
                    command="conversation"
                    fields={{ id }}
                    className="stack-form"
                  >
                    <Textarea label="Your message" name="body" />
                    <button>Send message</button>
                  </ActionForm>
                </details>
                <details>
                  <summary>Request to buy</summary>
                  <ActionForm
                    command="offer"
                    fields={{ id, kind: "purchase" }}
                    className="stack-form"
                  >
                    <label>
                      Note (optional)
                      <textarea name="note" maxLength={2000} rows={3} />
                    </label>
                    <button>Send purchase request</button>
                  </ActionForm>
                </details>
                <details>
                  <summary>Offer a trade</summary>
                  {mine?.length ? (
                    <ActionForm
                      command="offer"
                      fields={{ id, kind: "trade" }}
                      className="stack-form"
                    >
                      <label>
                        Your active item
                        <select name="offered_listing_id" required>
                          {mine.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Proposal (optional)
                        <textarea name="note" maxLength={2000} rows={3} />
                      </label>
                      <button>Send trade offer</button>
                    </ActionForm>
                  ) : (
                    <p>
                      <Link href="/sell/new">List your equipment</Link> and have
                      it approved before proposing a trade.
                    </p>
                  )}
                </details>
                <details>
                  <summary>Report this listing</summary>
                  <ActionForm
                    command="report"
                    fields={{ id }}
                    className="stack-form"
                  >
                    <Select
                      label="Reason"
                      name="reason"
                      values={[
                        "Fraud",
                        "Prohibited item",
                        "Misleading description",
                        "Other",
                      ]}
                    />
                    <Textarea
                      label="Details (at least 10 characters)"
                      name="description"
                      minLength={10}
                    />
                    <button className="secondary">Send report</button>
                  </ActionForm>
                </details>
              </>
            ) : (
              <Link className="button" href={`/sign-in?next=/listings/${id}`}>
                Sign in to save or contact seller
              </Link>
            )
          ) : null}
          <PilotNote />
        </section>
      </div>
    </>
  );
}
