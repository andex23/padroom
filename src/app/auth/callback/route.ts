import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/supabase";
import { profileInput } from "@/lib/domain";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  if (code) {
    const db = await database();
    const { data, error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: existing } = await db
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!existing) {
        const p = profileInput.safeParse(data.user.user_metadata);
        if (p.success)
          await db.rpc("save_profile", {
            p_name: p.data.display_name,
            p_city: p.data.city,
          });
      }
      return NextResponse.redirect(new URL("/account", base));
    }
  }
  return NextResponse.redirect(
    new URL(
      "/sign-in?error=Email%20confirmation%20failed.%20Request%20a%20new%20link%20or%20try%20signing%20in.",
      base,
    ),
  );
}
