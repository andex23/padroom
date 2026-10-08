import Link from "next/link";
import { PilotNote } from "@/components/ui";
export default function How() {
  return (
    <article className="prose">
      <h1>How PADROOM works</h1>
      <h2>Find equipment</h2>
      <p>
        Browse real, approved seller inventory. Search by item and filter by
        category, condition, price and city. Save items to your account.
      </p>
      <h2>Ask, request, arrange</h2>
      <p>
        Message the seller privately. Send a purchase request or propose a trade
        with one of your approved listings. Both participants can track the
        request. Acceptance confirms intent; it does not charge you.
      </p>
      <h2>Sell something still in play</h2>
      <p>
        Create a listing with accurate condition notes and photos you own.
        Submit it for moderation. It appears in browse after approval. Changes
        require another review.
      </p>
      <PilotNote />
      <Link className="button" href="/">
        Browse equipment
      </Link>
    </article>
  );
}
