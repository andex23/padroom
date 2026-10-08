import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field, Notice, SetupNotice } from "@/components/ui";
import { configured } from "@/lib/supabase";
import { safeNext } from "@/lib/domain";
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  return (
    <section className="narrow">
      <h1>Sign in</h1>
      <Notice params={p} />
      {!configured() ? (
        <SetupNotice />
      ) : (
        <ActionForm
          command="sign-in"
          className="auth-form panel"
          fields={{ next: safeNext(p.next ?? null) }}
        >
          <Field label="Email" name="email" type="email" maxLength={254} />
          <Field
            label="Password"
            name="password"
            type="password"
            maxLength={128}
          />
          <button>Sign in</button>
        </ActionForm>
      )}
      <p style={{ marginTop: 24 }}>
        New here? <Link href="/sign-up">Create an account</Link>
      </p>
      <p className="meta">
        If your account requires confirmation, check your inbox before signing
        in.
      </p>
    </section>
  );
}
