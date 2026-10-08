import Link from "next/link";
import { authenticated } from "@/lib/supabase";
import { fail } from "@/lib/catalog";
import { Empty } from "@/components/ui";
import { WorkspaceNav } from "@/components/workspace-nav";
import { Refresh } from "@/components/refresh";
export default async function Inbox() {
  const { user, db } = await authenticated();
  const { data, error } = await db
    .from("conversations")
    .select("*,messages(id,sender_id,read_at,created_at)")
    .order("created_at", { ascending: false });
  fail(error);
  return (
    <>
      <WorkspaceNav />
      <h1>Messages</h1>
      <Refresh />
      {data?.length ? (
        data.map((c) => {
          const unread = c.messages.filter(
            (m: { sender_id: string; read_at: string | null }) =>
              m.sender_id !== user.id && !m.read_at,
          ).length;
          return (
            <article className="row" key={c.id}>
              <h2>
                <Link href={`/messages/${c.id}`}>
                  Conversation / {c.id.slice(0, 8)}
                </Link>
              </h2>
              <p className="meta">
                {unread ? `${unread} unread` : "Up to date"} · Started{" "}
                {new Date(c.created_at).toLocaleDateString("en-NG", {
                  timeZone: "Africa/Lagos",
                })}
              </p>
            </article>
          );
        })
      ) : (
        <Empty title="Start with an item">
          <p>
            Ask a seller about their equipment. Only you and the seller can read
            your conversation.
          </p>
          <Link href="/">Browse equipment</Link>
        </Empty>
      )}
    </>
  );
}
