import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { allowedRecipients } from "./actions";
import { cookies } from "next/headers";
import { ChatEmpty, ChatList, ChatPane, ChatShell, type ChatItem, type Contact } from "./chat-ui";

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
    await db.conversationMember.updateMany({ where: { conversationId: shown.id, userId: me }, data: { lastReadAt: new Date(), lastDeliveredAt: new Date() } });
    const peer = peerOf(shown);
    const peerM = shown.members.find((m) => m.userId !== me);
    const peerRead = peerM?.lastReadAt;
    pane = <ChatPane key={shown.id} peer={peer} convId={shown.id} subject={shown.subject} messages={msgs.map((m) => ({ id: m.id, mine: m.senderId === me, body: m.body, at: m.createdAt.toISOString() }))} peerReadAt={peerRead ? peerRead.toISOString() : null} peerDeliveredAt={peerM ? peerM.lastDeliveredAt.toISOString() : null} />;
  } else if (target) {
    pane = <ChatPane key={target.id} peer={target} messages={[]} peerReadAt={null} peerDeliveredAt={null} />;
  }
  const chats: ChatItem[] = convs.map((c, i) => {
    const l = c.messages[0]; const p = peerOf(c); const pm = c.members.find((m) => m.userId !== me); const at = (l?.createdAt ?? c.updatedAt).toISOString();
    return { id: c.id, name: p.name, role: p.role, preview: l?.body ?? c.subject, at, mine: l?.senderId === me, tick: pm && at <= pm.lastReadAt.toISOString() ? "read" : pm && at <= pm.lastDeliveredAt.toISOString() ? "delivered" : "sent", unread: shown?.id === c.id ? 0 : unread[i], subject: c.subject };
  });
  const convByUser = new Map(convs.flatMap((c) => c.members.filter((m) => m.userId !== me).map((m) => [m.userId, c.id] as const)));
  const contacts: Contact[] = people.map((p) => ({ id: p.id, name: p.name, role: p.role, convId: convByUser.get(p.id) }));
  const open = !!pane;
  const themeCookie = (await cookies()).get("es_chat_theme")?.value;
  return (
    <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0">
      <ChatShell initialDark={themeCookie === "dark"} hasCookie={!!themeCookie}>
        <aside className={`${open ? "hidden lg:block" : "block"} w-full shrink-0 border-slate-100 lg:w-[22rem] lg:border-r xl:w-[24rem] dark:border-white/10`}>
          <ChatList chats={chats} contacts={contacts} activeId={shown?.id} activeUser={target?.id} canCompose={contacts.length > 0} />
        </aside>
        <section className={`${open ? "fixed inset-0 z-[45] bg-white dark:bg-[#17191f] lg:static lg:z-auto" : "hidden lg:flex"} min-w-0 flex-1 lg:block`}>
          {pane ?? <ChatEmpty />}
        </section>
      </ChatShell>
    </div>
  );
}
