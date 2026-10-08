// Real local Supabase integration. Never runs against a remote or production project.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0 && !line.startsWith("#"))
    process.env[line.slice(0, i)] ??= line.slice(i + 1).replace(/^"|"$/g, "");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert(
  ["localhost", "127.0.0.1"].includes(new URL(url).hostname),
  "Database tests only support isolated local Supabase.",
);
const clients = [],
  ids = [],
  paths = [];
let checks = 0;
const sql = (query) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_padroom",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      query,
    ],
    { stdio: ["pipe", "pipe", "pipe"] },
  );
async function ok(result, label) {
  assert.equal(result.error, null, `${label}: ${result.error?.message}`);
  checks++;
  return result.data;
}
async function denied(result, label) {
  assert(result.error, `${label}: expected rejection`);
  checks++;
}
async function empty(result, label) {
  assert.equal(result.error, null, `${label}: ${result.error?.message}`);
  assert.equal(result.data.length, 0, label);
  checks++;
}
const item = {
  title: "[LOCAL TEST] Console",
  brand: "Sony",
  model: "PS5",
  category: "Consoles",
  condition: "Used",
  city: "Lagos",
  price_kobo: 24500000,
  description: "Development-only fixture, not marketplace inventory.",
  defects: "None",
  included_items: "Controller",
};
try {
  for (let i = 0; i < 4; i++) {
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { user, session } = await ok(
      await db.auth.signUp({
        email: `db-test-${crypto.randomUUID()}@example.test`,
        password: crypto.randomUUID() + "aA1!",
      }),
      "create real test account",
    );
    assert(session, "Local email confirmation must be disabled for tests");
    ids.push(user.id);
    clients.push(db);
    await ok(
      await db.rpc("save_profile", {
        p_name: `Local Test ${i}`,
        p_city: "Lagos",
      }),
      "create profile",
    );
  }
  const [seller, buyer, outsider, admin] = clients;
  const anon = createClient(url, key, { auth: { persistSession: false } });
  sql(`insert into public.admin_members(user_id) values('${ids[3]}');`);
  async function draft(db) {
    return ok(
      await db.rpc("save_listing", { p_id: null, p_data: item }),
      "persist draft",
    );
  }
  async function photo(db, id, owner) {
    const path = `${owner}/${id}/${crypto.randomUUID()}.jpg`;
    const bytes = await sharp({
      create: { width: 30, height: 30, channels: 3, background: "#eeeeee" },
    })
      .jpeg()
      .toBuffer();
    await ok(
      await db.storage
        .from("listing-photos")
        .upload(path, bytes, { contentType: "image/jpeg" }),
      "upload real JPEG",
    );
    paths.push([db, path]);
    await ok(
      await db.rpc("register_image", { p_listing: id, p_path: path }),
      "register owned image",
    );
    return path;
  }
  async function publish(db, id) {
    await ok(
      await db.rpc("listing_state", { p_id: id, p_state: "pending_review" }),
      "submit",
    );
    await ok(
      await admin.rpc("moderate_listing", {
        p_id: id,
        p_state: "active",
        p_reason: "",
      }),
      "moderator approve",
    );
  }
  const listing = await draft(seller);
  await empty(
    await buyer.from("listings").select("*").eq("id", listing),
    "buyer cannot read other draft",
  );
  await empty(
    await anon.from("listings").select("*").eq("id", listing),
    "anonymous cannot read draft",
  );
  await denied(
    await buyer.rpc("save_listing", { p_id: listing, p_data: item }),
    "buyer cannot edit other draft",
  );
  await denied(
    await seller
      .from("listings")
      .update({ status: "active" })
      .eq("id", listing),
    "direct approval denied",
  );
  await denied(
    await seller.rpc("moderate_listing", {
      p_id: listing,
      p_state: "active",
      p_reason: "",
    }),
    "seller cannot moderate",
  );
  await denied(
    await seller.rpc("listing_state", {
      p_id: listing,
      p_state: "pending_review",
    }),
    "photo required before submit",
  );
  const path = await photo(seller, listing, ids[0]);
  await denied(
    await buyer.storage.from("listing-photos").createSignedUrl(path, 60),
    "draft photo private",
  );
  await publish(seller, listing);
  await denied(
    await seller.from("admin_members").insert({ user_id: ids[0] }),
    "admin self-promotion denied",
  );
  await denied(
    await buyer.rpc("moderate_listing", {
      p_id: listing,
      p_state: "archived",
      p_reason: "Malicious moderation",
    }),
    "buyer cannot hide inventory",
  );
  const catalog = await ok(
    await anon
      .from("listings")
      .select("*")
      .textSearch("search_document", "Console", {
        type: "websearch",
        config: "english",
      }),
    "database-backed search",
  );
  assert(catalog.some((l) => l.id === listing));
  checks++;
  await ok(
    await anon.storage.from("listing-photos").createSignedUrl(path, 60),
    "approved photo readable",
  );
  await ok(
    await buyer.rpc("toggle_save", { p_listing: listing }),
    "save listing",
  );
  await empty(
    await seller.from("saved_listings").select("*").eq("user_id", ids[1]),
    "seller cannot read buyer saves",
  );
  await denied(
    await seller.from("saved_listings").delete().eq("user_id", ids[1]),
    "seller cannot delete buyer saves",
  );
  const conversation = await ok(
    await buyer.rpc("start_conversation", {
      p_listing: listing,
      p_body: "Is this equipment still available?",
    }),
    "start real conversation",
  );
  await empty(
    await outsider.from("conversations").select("*").eq("id", conversation),
    "outsider cannot read conversation",
  );
  await empty(
    await outsider
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation),
    "outsider cannot read messages",
  );
  await denied(
    await outsider.rpc("send_message", {
      p_conversation: conversation,
      p_body: "unauthorized",
    }),
    "outsider cannot send message",
  );
  await denied(
    await outsider
      .from("messages")
      .update({ body: "tampered" })
      .eq("conversation_id", conversation),
    "outsider cannot edit message",
  );
  await ok(
    await seller.rpc("send_message", {
      p_conversation: conversation,
      p_body: "Yes, you can inspect it.",
    }),
    "seller reply",
  );
  await ok(
    await buyer.rpc("read_messages", { p_conversation: conversation }),
    "read receipts",
  );
  await empty(
    await admin
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation),
    "admin cannot browse private messages",
  );
  await denied(
    await seller.rpc("create_offer", {
      p_listing: listing,
      p_kind: "purchase",
      p_offered: null,
      p_note: "",
    }),
    "self purchase denied",
  );
  const offer = await ok(
    await buyer.rpc("create_offer", {
      p_listing: listing,
      p_kind: "purchase",
      p_offered: null,
      p_note: "Arrange inspection",
    }),
    "purchase request",
  );
  await denied(
    await buyer.rpc("create_offer", {
      p_listing: listing,
      p_kind: "purchase",
      p_offered: null,
      p_note: "",
    }),
    "duplicate request denied",
  );
  await empty(
    await outsider.from("offers").select("*").eq("id", offer),
    "outsider cannot see request",
  );
  await denied(
    await buyer.rpc("offer_state", { p_id: offer, p_state: "accepted" }),
    "buyer cannot accept own request",
  );
  const competitor = await ok(
    await outsider.rpc("create_offer", {
      p_listing: listing,
      p_kind: "purchase",
      p_offered: null,
      p_note: "",
    }),
    "competing request",
  );
  const race = await Promise.all([
    seller.rpc("offer_state", { p_id: offer, p_state: "accepted" }),
    seller.rpc("offer_state", { p_id: competitor, p_state: "accepted" }),
  ]);
  assert.equal(
    race.filter((r) => !r.error).length,
    1,
    "exactly one concurrent acceptance",
  );
  checks++;
  const winner = race[0].error ? competitor : offer;
  await ok(
    await seller.rpc("offer_state", { p_id: winner, p_state: "completed" }),
    "mark real handover complete",
  );
  await empty(
    await anon.from("listings").select("*").eq("id", listing),
    "sold item no longer browsable",
  );
  const a = await draft(seller),
    b = await draft(buyer);
  await photo(seller, a, ids[0]);
  await photo(buyer, b, ids[1]);
  await publish(seller, a);
  await publish(buyer, b);
  await denied(
    await outsider.rpc("create_offer", {
      p_listing: a,
      p_kind: "trade",
      p_offered: b,
      p_note: "",
    }),
    "trade must reference own listing",
  );
  const trade = await ok(
    await buyer.rpc("create_offer", {
      p_listing: a,
      p_kind: "trade",
      p_offered: b,
      p_note: "Trade proposal",
    }),
    "trade offer",
  );
  await ok(
    await seller.rpc("offer_state", { p_id: trade, p_state: "accepted" }),
    "accept trade",
  );
  await denied(
    await buyer.rpc("listing_state", { p_id: b, p_state: "archived" }),
    "accepted trade reserves offered item",
  );
  await ok(
    await buyer.rpc("offer_state", { p_id: trade, p_state: "cancelled" }),
    "participant cancels arrangement",
  );
  await ok(
    await buyer.rpc("report_listing", {
      p_listing: a,
      p_reason: "Misleading description",
      p_description: "Please review the condition description.",
    }),
    "report listing",
  );
  const reports = await ok(
    await admin.from("reports").select("*").eq("listing_id", a),
    "admin review reports",
  );
  await ok(
    await admin.rpc("resolve_report", { p_id: reports[0].id }),
    "resolve report",
  );
  await denied(
    await buyer.rpc("suspend_account", {
      p_user: ids[0],
      p_suspend: true,
      p_reason: "Fraud review",
    }),
    "buyer cannot suspend seller",
  );
  await ok(
    await admin.rpc("suspend_account", {
      p_user: ids[0],
      p_suspend: true,
      p_reason: "Local test review",
    }),
    "admin suspends seller",
  );
  await empty(
    await anon.from("listings").select("*").eq("id", a),
    "suspended seller inventory hidden",
  );
  await denied(
    await seller.rpc("save_listing", { p_id: null, p_data: item }),
    "suspended seller cannot write",
  );
  await ok(
    await admin.rpc("suspend_account", {
      p_user: ids[0],
      p_suspend: false,
      p_reason: "Local review completed",
    }),
    "restore seller",
  );
  await ok(
    await seller.rpc("save_listing", {
      p_id: a,
      p_data: { ...item, title: "[LOCAL TEST] Updated console" },
    }),
    "material edit returns to draft",
  );
  await empty(
    await anon.from("listings").select("*").eq("id", a),
    "edited approval cannot remain public",
  );
  const audit = await ok(
    await admin.from("moderation_events").select("*"),
    "audit persisted",
  );
  assert(audit.length >= 6);
  checks++;
  await denied(
    await admin.from("moderation_events").delete().eq("admin_id", ids[3]),
    "audit immutable via app",
  );
  // Persistent SQL-backed rate limiting is applied to direct RPCs as well as the app.
  sql(
    `insert into public.rate_limits values('${ids[1]}','message',date_trunc('hour',now()),60) on conflict(user_id,action) do update set window_start=excluded.window_start,hits=60;`,
  );
  await denied(
    await buyer.rpc("send_message", {
      p_conversation: conversation,
      p_body: "over limit",
    }),
    "database rate limit enforced",
  );
  console.log(
    `PASS: ${checks} real Supabase assertions (auth, private records/photos, publication, saves, messages, requests, concurrent acceptance, trade reservations, moderation, rate limits).`,
  );
} finally {
  if (ids.length) {
    const users = ids.map((id) => `'${id}'`).join(",");
    sql(
      `update public.listings set status='draft' where seller_id in (${users}); update public.profiles set suspended_at=null where id in (${users});`,
    );
    for (const [db, path] of paths) {
      await db.storage.from("listing-photos").remove([path]);
    }
    sql(
      `begin; delete from public.moderation_events where admin_id in (${users}); delete from public.reports where reporter_id in (${users}); delete from public.messages where sender_id in (${users}); delete from public.offers where buyer_id in (${users}) or seller_id in (${users}); delete from public.conversations where buyer_id in (${users}) or seller_id in (${users}); delete from public.saved_listings where user_id in (${users}); delete from public.listing_images where listing_id in (select id from public.listings where seller_id in (${users})); delete from public.listings where seller_id in (${users}); delete from auth.users where id in (${users}); commit;`,
    );
  }
}
