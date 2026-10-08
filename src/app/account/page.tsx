import Link from "next/link";
import { authenticated } from "@/lib/supabase";
import { fail } from "@/lib/catalog";
import { cities } from "@/lib/domain";
import { ActionForm } from "@/components/action-form";
import { Field, Select, Notice } from "@/components/ui";
import { WorkspaceNav } from "@/components/workspace-nav";
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { user, db } = await authenticated();
  const { data: p, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  fail(error);
  const { data: admin } = await db.rpc("is_admin");
  return (
    <>
      <WorkspaceNav />
      <section className="narrow">
        <h1>Your account</h1>
        <Notice params={await searchParams} />
        <p className="meta">{user.email}</p>
        {p?.suspended_at && (
          <p role="alert" className="error">
            This account is suspended. Marketplace writes are unavailable.
          </p>
        )}
        <ActionForm command="profile" className="auth-form panel">
          <Field
            name="display_name"
            label="Display name"
            defaultValue={
              p?.display_name || user.user_metadata.display_name || ""
            }
            maxLength={60}
          />
          <Select
            label="City"
            name="city"
            values={cities}
            defaultValue={p?.city || user.user_metadata.city || "Lagos"}
          />
          <button>Save profile</button>
        </ActionForm>
        <div className="actions" style={{ marginTop: 24 }}>
          {admin && (
            <Link className="button secondary" href="/admin">
              Moderation
            </Link>
          )}
          <ActionForm command="sign-out">
            <button className="secondary">Sign out</button>
          </ActionForm>
        </div>
      </section>
    </>
  );
}
