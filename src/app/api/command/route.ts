import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { database } from "@/lib/supabase";
import {
  bodyInput,
  listingInput,
  profileInput,
  safeNext,
  uuid,
} from "@/lib/domain";
import { z } from "zod";
import { normalizePhoto } from "@/lib/image";
export const runtime = "nodejs";
const text = (f: FormData, n: string) => String(f.get(n) ?? "");
async function boundedForm(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty request");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 6 * 1024 * 1024) {
      await reader.cancel();
      throw new Error(
        "Request too large. Upload one photo at a time (maximum 5 MB).",
      );
    }
    chunks.push(value);
  }
  return new Request(request.url, {
    method: "POST",
    headers: { "content-type": request.headers.get("content-type") ?? "" },
    body: Buffer.concat(chunks),
  }).formData();
}
export async function POST(request: NextRequest) {
  // Cookie-authenticated mutations must originate from this application.
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  if (!origin || origin !== new URL(expected).origin)
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const f = await boundedForm(request);
    const command = text(f, "command");
    const db = await database();
    const rpc = async (name: string, args: Record<string, unknown>) => {
      const { data, error } = await db.rpc(name, args);
      if (error) {
        if (error.code === "23505")
          throw new Error("This request already exists. Check your requests.");
        throw new Error(error.message);
      }
      return data;
    };
    let redirect: string | undefined;
    let message = "Saved.";
    if (command === "password-reset") {
      const email = z.string().email().max(254).parse(text(f, "email"));
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${new URL(expected).origin}/auth/callback?next=/reset-password`,
      });
      if (error)
        throw new Error("Unable to send reset email. Try again later.");
      message =
        "If this email has an account, a password reset link has been sent.";
    } else if (command === "sign-in" || command === "sign-up") {
      const email = z.string().email().max(254).parse(text(f, "email"));
      const password = z.string().min(10).max(128).parse(text(f, "password"));
      if (command === "sign-in") {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error)
          throw new Error(
            "Unable to sign in. Check your details and email confirmation.",
          );
        redirect = safeNext(text(f, "next"));
      } else {
        const profile = profileInput.parse({
          display_name: text(f, "display_name"),
          city: text(f, "city"),
        });
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: {
            data: profile,
            emailRedirectTo: `${new URL(expected).origin}/auth/callback`,
          },
        });
        if (error)
          throw new Error(
            "Unable to register. Try again later or sign in if you already have an account.",
          );
        if (data.session) {
          await rpc("save_profile", {
            p_name: profile.display_name,
            p_city: profile.city,
          });
          redirect = "/account";
        } else
          message = "Check your email to confirm your account, then sign in.";
      }
    } else {
      const {
        data: { user },
        error,
      } = await db.auth.getUser();
      if (error || !user)
        return NextResponse.json(
          { error: "Sign in to continue.", redirect: "/sign-in" },
          { status: 401 },
        );
      const id = (field = "id") => uuid.parse(text(f, field));
      switch (command) {
        case "password-update": {
          const password = z
            .string()
            .min(10)
            .max(128)
            .parse(text(f, "password"));
          const { error } = await db.auth.updateUser({ password });
          if (error)
            throw new Error(
              "Unable to update password. Request a new reset link.",
            );
          redirect = "/account";
          break;
        }
        case "sign-out": {
          const { error } = await db.auth.signOut();
          if (error) throw error;
          redirect = "/";
          break;
        }
        case "profile": {
          const p = profileInput.parse({
            display_name: text(f, "display_name"),
            city: text(f, "city"),
          });
          await rpc("save_profile", { p_name: p.display_name, p_city: p.city });
          break;
        }
        case "listing": {
          if (text(f, "agreement") !== "yes")
            throw new Error(
              "Confirm the condition and photo rights agreement.",
            );
          const p = listingInput.parse(Object.fromEntries(f));
          const result = await rpc("save_listing", {
            p_id: text(f, "id") ? id() : null,
            p_data: { ...p, price_kobo: p.price },
          });
          redirect = `/sell/${result}/edit`;
          break;
        }
        case "listing-state":
          await rpc("listing_state", {
            p_id: id(),
            p_state: z
              .enum(["draft", "pending_review", "sold", "archived"])
              .parse(text(f, "state")),
          });
          redirect = "/my-listings";
          break;
        case "upload": {
          const listing = id("listing_id");
          const file = f.get("photo");
          if (
            !(file instanceof File) ||
            !file.size ||
            file.size > 5 * 1024 * 1024
          )
            throw new Error("Choose a photo up to 5 MB.");
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
            throw new Error("Use a JPEG, PNG or WebP photo.");
          const { data: l, error } = await db
            .from("listings")
            .select("id,seller_id,status")
            .eq("id", listing)
            .single();
          if (error || l.seller_id !== user.id || l.status !== "draft")
            throw new Error("Only your drafts can receive photos.");
          const bytes = await normalizePhoto(
            new Uint8Array(await file.arrayBuffer()),
            file.type,
          );
          const path = `${user.id}/${listing}/${crypto.randomUUID()}.jpg`;
          const { error: uploadError } = await db.storage
            .from("listing-photos")
            .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
          if (uploadError) throw new Error(uploadError.message);
          try {
            await rpc("register_image", { p_listing: listing, p_path: path });
          } catch (e) {
            await db.storage.from("listing-photos").remove([path]);
            throw e;
          }
          message = "Photo added.";
          break;
        }
        case "remove-image": {
          const path = await rpc("remove_image", { p_image: id() });
          const { error } = await db.storage
            .from("listing-photos")
            .remove([path]);
          if (error)
            throw new Error(
              "Photo removed from listing; storage cleanup failed.",
            );
          break;
        }
        case "save":
          await rpc("toggle_save", { p_listing: id() });
          break;
        case "conversation": {
          const result = await rpc("start_conversation", {
            p_listing: id(),
            p_body: bodyInput.parse(text(f, "body")),
          });
          redirect = `/messages/${result}`;
          break;
        }
        case "message":
          await rpc("send_message", {
            p_conversation: id(),
            p_body: bodyInput.parse(text(f, "body")),
          });
          message = "Message sent.";
          break;
        case "read-messages":
          await rpc("read_messages", { p_conversation: id() });
          message = "Marked as read.";
          break;
        case "offer":
          await rpc("create_offer", {
            p_listing: id(),
            p_kind: z.enum(["purchase", "trade"]).parse(text(f, "kind")),
            p_offered: text(f, "offered_listing_id")
              ? id("offered_listing_id")
              : null,
            p_note: z.string().trim().max(2000).parse(text(f, "note")),
          });
          redirect = "/offers";
          break;
        case "offer-state":
          await rpc("offer_state", {
            p_id: id(),
            p_state: z
              .enum(["accepted", "declined", "cancelled", "completed"])
              .parse(text(f, "state")),
          });
          break;
        case "report":
          await rpc("report_listing", {
            p_listing: id(),
            p_reason: z
              .enum([
                "Fraud",
                "Prohibited item",
                "Misleading description",
                "Other",
              ])
              .parse(text(f, "reason")),
            p_description: z
              .string()
              .trim()
              .min(10)
              .max(2000)
              .parse(text(f, "description")),
          });
          message = "Report sent to moderation.";
          break;
        case "moderate":
          await rpc("moderate_listing", {
            p_id: id(),
            p_state: z
              .enum(["active", "rejected", "archived"])
              .parse(text(f, "state")),
            p_reason: z.string().trim().max(1000).parse(text(f, "reason")),
          });
          break;
        case "resolve-report":
          await rpc("resolve_report", { p_id: id() });
          break;
        case "suspend":
          await rpc("suspend_account", {
            p_user: id(),
            p_suspend:
              z.enum(["suspend", "restore"]).parse(text(f, "state")) ===
              "suspend",
            p_reason: z
              .string()
              .trim()
              .min(5)
              .max(1000)
              .parse(text(f, "reason")),
          });
          break;
        default:
          throw new Error("Unknown action.");
      }
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ message, redirect });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues
            .map((i) => `${i.path.join(".") || "Field"}: ${i.message}`)
            .join("; ")
        : error instanceof Error
          ? error.message
          : "Unable to complete request. Try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
