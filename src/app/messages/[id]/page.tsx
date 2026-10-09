import Link from "next/link";
import { notFound } from "next/navigation";
import { authenticated } from "@/lib/supabase";
import { uuid } from "@/lib/domain";
import { fail } from "@/lib/catalog";
import { ActionForm } from "@/components/action-form";
import { Mutation, Textarea } from "@/components/ui";
import { Refresh } from "@/components/refresh";
export default async function Conversation({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ before?: string }>;
}) {
  const { user, db } = await authenticated();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const { data: c, error } = await db
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  fail(error);
  if (!c) notFound();
  const { before } = await searchParams;
  let query = db.from("messages").select("*").eq("conversation_id", id);
  if (before) {
    if (!uuid.safeParse(before).success) notFound();
    // Resolve the cursor through the same conversation and participant RLS.
    // Never accept a client-supplied timestamp or another conversation's row.
    const { data: cursor, error: cursorError } = await db
      .from("messages")
      .select("id,created_at")
      .eq("conversation_id", id)
      .eq("id", before)
      .maybeSingle();
    fail(cursorError);
    if (!cursor) notFound();
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
  }
  const pageSize = 25;
  const { data: messages, error: e } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  fail(e);
  const page = (messages ?? []).slice(0, pageSize);
  const hasOlder = (messages?.length ?? 0) > pageSize;
  const { data: name } = await db.rpc("seller_name", {
    p_id: user.id === c.buyer_id ? c.seller_id : c.buyer_id,
  });
  return (
    <section className="prose">
      <Link href="/messages">← Inbox</Link>
      <h1 style={{ marginTop: 24 }}>
        Conversation with {name || "participant"}
      </h1>
      <Link href={`/listings/${c.listing_id}`}>View item</Link>
      <div className="actions" style={{ marginTop: 24 }}>
        <Refresh />
        <Mutation command="read-messages" id={id} label="Mark as read" />
      </div>
      <p className="meta">
        {before ? "Earlier messages" : "Latest messages"} / {page.length} shown
      </p>
      {(before || hasOlder) && (
        <nav
          className="pagination message-history"
          aria-label="Message history"
        >
          {hasOlder && (
            <Link href={`/messages/${id}?before=${page.at(-1)!.id}`}>
              Older messages
            </Link>
          )}
          {before && <Link href={`/messages/${id}`}>Latest messages</Link>}
        </nav>
      )}
      {page.toReversed().map((m) => (
        <article
          className={`message ${m.sender_id === user.id ? "own" : ""}`}
          key={m.id}
        >
          <p className="meta">
            {m.sender_id === user.id ? "You" : name || "Participant"} /{" "}
            {new Date(m.created_at).toLocaleString("en-NG", {
              timeZone: "Africa/Lagos",
            })}
          </p>
          <p>{m.body}</p>
          <span className="meta">{m.read_at ? "Read" : "Sent"}</span>
        </article>
      ))}
      <ActionForm
        command="message"
        className="stack-form"
        fields={{ id }}
        reset
      >
        <Textarea label="Reply" name="body" />
        <button>Send reply</button>
      </ActionForm>
    </section>
  );
}
