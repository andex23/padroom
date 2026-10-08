import Link from "next/link";
import { authenticated } from "@/lib/supabase";
import { ListingEditor } from "@/components/listing-editor";
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
    <section className="prose">
      <h1>List your equipment</h1>
      <p>
        Consoles, controllers, physical games and accessories. No account sales
        or illegal keys.
      </p>
      <ListingEditor />
    </section>
  );
}
