import Link from "next/link";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Empty } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { allowedRecipients, sendMessage } from "./actions";
import { NewMessage } from "./new";

export const metadata = { title: "Messages" };

export default async function Messages({ searchParams }: { searchParams: Promise<{ c?: string; new?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  const convs = await db.conversation.findMany({
    where: { schoolId: ctx.schoolId, members: { some: { userId: ctx.user.id } } },
    include: { members: { include: { user: { select: { name: true, id: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" }, take: 50,
  });
  const active = !sp.new ? convs.find((c) => c.id === sp.c) : undefined;
  const thread = active ? await db.message.findMany({ where: { conversationId: active.id }, orderBy: { createdAt: "asc" }, take: 200, include: { sender: { select: { name: true } } } }) : [];
  if (active) await db.conversationMember.updateMany({ where: { conversationId: active.id, userId: ctx.user.id }, data: { lastReadAt: new Date() } });
  const people = sp.new ? await allowedRecipients(ctx) : [];
  const other = (c: (typeof convs)[number]) => c.members.filter((m) => m.userId !== ctx.user.id).map((m) => m.user.name).join(", ");
  return (
    <>
      <PageHeader title="Messages" sub="Private conversations between parents, teachers and the school."><Link className="btn" href="/messages?new=1">New message</Link></PageHeader>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Conversations" flush className="lg:col-span-1">
          {convs.length === 0 ? <Empty title="No conversations" /> : (
            <ul className="divide-y divide-slate-100">{convs.map((c) => {
              const m = c.members.find((x) => x.userId === ctx.user.id)!; const last = c.messages[0]; const unread = last && last.senderId !== ctx.user.id && last.createdAt > m.lastReadAt;
              return (<li key={c.id}><Link href={`/messages?c=${c.id}`} className={`block px-5 py-3 hover:bg-slate-50 ${active?.id === c.id ? "bg-brand-50" : ""}`}>
                <div className="flex justify-between text-sm"><span className={unread ? "font-bold" : "font-medium"}>{other(c)}</span><span className="text-xs text-slate-400">{fmtDate(c.updatedAt)}</span></div>
                <div className="truncate text-xs text-slate-500">{c.subject}</div></Link></li>);
            })}</ul>
          )}
        </Card>
        <div className="lg:col-span-2">
          {sp.new ? <Card title="New message"><NewMessage people={people} /></Card> : active ? (
            <Card title={`${active.subject} — ${other(active)}`} flush>
              <div className="max-h-[28rem] space-y-3 overflow-y-auto p-5">{thread.map((m) => { const me = m.senderId === ctx.user.id; return (
                <div key={m.id} className={`flex ${me ? "justify-end" : ""}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${me ? "bg-brand-600 text-white" : "bg-slate-100"}`}>
                  {!me && <div className="mb-0.5 text-xs font-semibold">{m.sender.name}</div>}<p className="whitespace-pre-wrap">{m.body}</p><div className={`mt-1 text-[10px] ${me ? "text-indigo-200" : "text-slate-400"}`}>{m.createdAt.toLocaleString("en-GB")}</div></div></div>);})}</div>
              <form action={sendMessage.bind(null, active.id)} className="flex gap-2 border-t border-slate-100 p-3"><input name="body" className="input" placeholder="Write a reply…" required maxLength={4000} aria-label="Reply" /><button className="btn">Send</button></form>
            </Card>
          ) : <Card><Empty title="Select a conversation" hint="Or start a new message." /></Card>}
        </div>
      </div>
    </>
  );
}
