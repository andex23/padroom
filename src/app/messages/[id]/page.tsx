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
}: {
  params: Promise<{ id: string }>;
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
  const { data: messages, error: e } = await db
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at")
    .order("id");
  fail(e);
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
      {messages?.map((m) => (
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
