import Link from 'next/link';
import { Listing,money } from '@/lib/domain';
import { photos } from '@/lib/catalog';
export async function ListingCard({listing}:{listing:Listing}){const media=await photos(listing);return <article className="listing-card"><Link href={`/listings/${listing.id}`} className="card-link"><div className="card-photo">{media[0]?.url?<img src={media[0].url} alt={listing.title} loading="lazy"/>:<span className="meta">Photo unavailable</span>}</div><div className="card-copy"><h2>{listing.title}</h2><p className="price">{money(listing.price_kobo)}</p><p className="meta">{listing.condition} · {listing.city}</p></div></Link></article>;}
