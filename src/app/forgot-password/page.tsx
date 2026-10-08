import { ActionForm } from "@/components/action-form";
import { Field, SetupNotice } from "@/components/ui";
import { configured } from "@/lib/supabase";
export default function ForgotPassword() {
  return (
    <section className="narrow">
      <h1>Reset your password</h1>
      <p>We’ll email a link so you can choose a new password.</p>
      {configured() ? (
        <ActionForm command="password-reset" className="auth-form panel">
          <Field label="Email" name="email" type="email" maxLength={254} />
          <button>Send reset link</button>
        </ActionForm>
      ) : (
        <SetupNotice />
      )}
    </section>
  );
}
