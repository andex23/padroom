import { Photo } from "@/components/photo";
import Link from "next/link";
import { Listing, money } from "@/lib/domain";
import { photoUrl } from "@/lib/catalog";
import { Icon } from "./icon";
export async function ListingCard({ listing }: { listing: Listing }) {
  const first = (listing.listing_images ?? []).toSorted(
    (a, b) => a.position - b.position,
  )[0];
  const media = first ? await photoUrl(first.storage_path) : null;
  return (
    <article className="listing-card">
      <Link href={`/listings/${listing.id}`} className="card-link">
        <div className="card-photo">
          {media ? (
            <Photo src={media} alt={listing.title} loading="lazy" />
          ) : (
            <span className="meta">Photo unavailable</span>
          )}
          <span className="photo-count">
            {(listing.listing_images ?? []).length} photos
          </span>
        </div>
        <div className="card-copy">
          <p className="card-category meta">{listing.category}</p>
          <h2>{listing.title}</h2>
          <p className="price">{money(listing.price_kobo)}</p>
          <p className="card-context meta">
            <span>{listing.condition}</span>
            <span>
              {listing.city}
              <Icon name="arrow" />
            </span>
          </p>
        </div>
      </Link>
    </article>
  );
}
