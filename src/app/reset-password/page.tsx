import { authenticated } from "@/lib/supabase";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/ui";
export default async function ResetPassword() {
  await authenticated();
  return (
    <section className="narrow">
      <h1>Choose a new password</h1>
      <ActionForm command="password-update" className="auth-form panel">
        <Field
          label="New password (at least 10 characters)"
          name="password"
          type="password"
          maxLength={128}
        />
        <button>Update password</button>
      </ActionForm>
    </section>
  );
}
