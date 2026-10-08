import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field, Select, SetupNotice } from "@/components/ui";
import { cities } from "@/lib/domain";
import { configured } from "@/lib/supabase";
export default function SignUp() {
  return (
    <section className="narrow">
      <h1>Create an account</h1>
      <p>Find your next piece of equipment. Give yours another round.</p>
      {!configured() ? (
        <SetupNotice />
      ) : (
        <ActionForm command="sign-up" className="auth-form panel">
          <Field label="Display name" name="display_name" maxLength={60} />
          <Select label="City" name="city" values={cities} />
          <Field
            label="Email (kept private)"
            name="email"
            type="email"
            maxLength={254}
          />
          <Field
            label="Password (at least 10 characters)"
            name="password"
            type="password"
            maxLength={128}
          />
          <label className="check">
            <input type="checkbox" required />I have read the marketplace{" "}
            <Link href="/terms">terms</Link> and{" "}
            <Link href="/privacy">privacy notice</Link>.
          </label>
          <button>Create account</button>
        </ActionForm>
      )}
      <p style={{ marginTop: 24 }}>
        Already registered? <Link href="/sign-in">Sign in</Link>
      </p>
    </section>
  );
}
