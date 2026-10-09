import { Photo } from "@/components/photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authenticated } from "@/lib/supabase";
import { Listing, uuid } from "@/lib/domain";
import { listingSelect, photos, fail } from "@/lib/catalog";
import { ListingEditor } from "@/components/listing-editor";
import { ActionForm } from "@/components/action-form";
import { Mutation } from "@/components/ui";
import { SellProgress } from "@/components/sell-progress";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, db } = await authenticated();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const { data, error } = await db
    .from("listings")
    .select(listingSelect)
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  fail(error);
  if (!data) notFound();
  const l = data as Listing;
  const images = await photos(l);
  return (
    <>
      <Link href="/my-listings">← My listings</Link>
      <section className="prose" style={{ marginTop: 24 }}>
        <h1>Edit listing</h1>
        <p className="meta">
          {l.status.replaceAll("_", " ")}
          {l.review_reason && ` / ${l.review_reason}`}
        </p>
        <SellProgress saved photos={images.length > 0} />
        <div id="listing-details">
          {["draft", "rejected", "active"].includes(l.status) ? (
            <ListingEditor listing={l} />
          ) : (
            <p>
              Withdraw from review to edit. Sold and archived listings are
              retained as records.
            </p>
          )}
        </div>
        <h2 className="form-section" id="listing-photos">
          02 / Photos
        </h2>
        <p className="meta">
          1–8 photos. JPEG, PNG or WebP, up to 4 MB each. Photos are resized and
          metadata removed.
        </p>
        <div className="photos-edit">
          {images.map((i) => (
            <div key={i.id}>
              {i.url ? (
                <Photo src={i.url} alt={`${l.title} photo ${i.position + 1}`} />
              ) : (
                <p>Photo unavailable</p>
              )}
              {l.status === "draft" && (
                <Mutation
                  command="remove-image"
                  id={i.id}
                  label="Remove photo"
                />
              )}
            </div>
          ))}
        </div>
        {l.status === "draft" && images.length < 8 && (
          <ActionForm
            command="upload"
            className="stack-form"
            fields={{ listing_id: id }}
            reset
          >
            <label>
              Add a photo
              <input
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
              />
            </label>
            <button>Upload photo</button>
          </ActionForm>
        )}
        <h2 className="form-section" id="listing-review">
          03 / Preview & submit
        </h2>
        <p>
          Check your item, condition, price and photos before sending it to
          moderation.
        </p>
        <div className="actions">
          <Link className="button secondary" href={`/listings/${id}`}>
            Preview listing
          </Link>
          {["draft", "rejected"].includes(l.status) && (
            <Mutation
              command="listing-state"
              id={id}
              state="pending_review"
              label="Submit for review"
            />
          )}
          {l.status === "pending_review" && (
            <Mutation
              command="listing-state"
              id={id}
              state="draft"
              label="Withdraw from review"
            />
          )}
        </div>
      </section>
    </>
  );
}
