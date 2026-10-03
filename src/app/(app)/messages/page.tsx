import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { allowedRecipients } from "./actions";
import { ChatList, ChatPane, type ChatItem, type Contact } from "./chat-ui";

export const metadata = { title: "Messages" };

export default async function Messages({ searchParams }: { searchParams: Promise<{ c?: string; u?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  const me = ctx.user.id;
  const [convs, people] = await Promise.all([
    db.conversation.findMany({
      where: { schoolId: ctx.schoolId, members: { some: { userId: me } } },
      include: { members: { include: { user: { select: { id: true, name: true, role: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" }, take: 100,
    }),
    ctx.role === "SUPER_ADMIN" ? Promise.resolve([]) : allowedRecipients(ctx),
  ]);
  const peerOf = (c: (typeof convs)[number]) => c.members.find((m) => m.userId !== me)?.user ?? { id: me, name: "You", role: ctx.role };
  const unread = await Promise.all(convs.map((c) => {
    const m = c.members.find((x) => x.userId === me)!;
    return db.message.count({ where: { conversationId: c.id, senderId: { not: me }, createdAt: { gt: m.lastReadAt } } });
  }));
  const active = convs.find((c) => c.id === sp.c);
  const convWithUser = sp.u ? convs.find((c) => c.members.some((m) => m.userId === sp.u)) : undefined;
  const target = !active && sp.u ? (convWithUser ? undefined : people.find((p) => p.id === sp.u)) : undefined;
  let pane: React.ReactNode = null;
  const shown = active ?? convWithUser;
  if (shown) {
    const [msgs] = await Promise.all([db.message.findMany({ where: { conversationId: shown.id }, orderBy: { createdAt: "asc" }, take: 300 })]);
    await db.conversationMember.updateMany({ where: { conversationId: shown.id, userId: me }, data: { lastReadAt: new Date() } });
    const peer = peerOf(shown);
    const peerRead = shown.members.find((m) => m.userId !== me)?.lastReadAt;
    pane = <ChatPane key={shown.id} peer={peer} convId={shown.id} subject={shown.subject} messages={msgs.map((m) => ({ id: m.id, mine: m.senderId === me, body: m.body, at: m.createdAt.toISOString() }))} peerReadAt={peerRead ? peerRead.toISOString() : null} />;
  } else if (target) {
    pane = <ChatPane key={target.id} peer={target} messages={[]} peerReadAt={null} />;
  }
  const chats: ChatItem[] = convs.map((c, i) => {
    const l = c.messages[0]; const p = peerOf(c);
    return { id: c.id, name: p.name, role: p.role, preview: l?.body ?? c.subject, at: (l?.createdAt ?? c.updatedAt).toISOString(), mine: l?.senderId === me, unread: shown?.id === c.id ? 0 : unread[i], subject: c.subject };
  });
  const convByUser = new Map(convs.flatMap((c) => c.members.filter((m) => m.userId !== me).map((m) => [m.userId, c.id] as const)));
  const contacts: Contact[] = people.map((p) => ({ id: p.id, name: p.name, role: p.role, convId: convByUser.get(p.id) }));
  const open = !!pane;
  return (
    <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0">
      <div className="flex h-[calc(100dvh-4.25rem-4.5rem)] overflow-hidden bg-white sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-card lg:h-[calc(100dvh-9rem)]">
        <aside className={`${open ? "hidden lg:block" : "block"} w-full shrink-0 border-slate-100 lg:w-[22rem] lg:border-r xl:w-[24rem]`}>
          <ChatList chats={chats} contacts={contacts} activeId={shown?.id} activeUser={target?.id} canCompose={contacts.length > 0} />
        </aside>
        <section className={`${open ? "fixed inset-0 z-[45] bg-white lg:static lg:z-auto" : "hidden lg:flex"} min-w-0 flex-1 lg:block`}>
          {pane ?? (
            <div className="grid h-full place-items-center bg-[#eceefa] p-8 text-center">
              <div><div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-white text-brand-600 shadow-sm"><svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" /></svg></div>
                <h2 className="text-lg font-bold text-slate-800">EduSphere Messages</h2><p className="mt-1 max-w-xs text-sm text-slate-500">Pick a chat on the left, or open Contacts to start a new conversation.</p></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
