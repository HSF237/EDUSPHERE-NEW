import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Empty, Badge } from "@/components/ui";
import { WhatsAppCard } from "./wa-card";

export const metadata = { title: "Notifications" };

async function markAll() {
  "use server";
  const ctx = await getCtx();
  await db.notification.updateMany({ where: { userId: ctx.user.id, read: false }, data: { read: true } });
  revalidatePath("/notifications");
}

export default async function Notifications({ searchParams }: { searchParams: Promise<{ waerr?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const list = await db.notification.findMany({ where: { userId: ctx.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageHeader title="Notifications"><form action={markAll}><button className="btn-ghost">Mark all as read</button></form></PageHeader>
      {ctx.role !== "SUPER_ADMIN" && <WhatsAppCard userId={ctx.user.id} error={sp.waerr} />}
      <Card flush>
        {list.length === 0 ? <Empty title="You're all caught up" /> : (
          <ul className="divide-y divide-slate-100">{list.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 px-5 py-3">
              <div><div className="flex items-center gap-2 text-sm font-medium">{n.title}{!n.read && <Badge tone="indigo">new</Badge>}</div>{n.body && <p className="text-sm text-slate-600">{n.body}</p>}<div className="text-xs text-slate-400">{n.createdAt.toLocaleString("en-GB")}</div></div>
              {n.link && <Link href={n.link} className="shrink-0 text-sm text-brand-600 hover:underline">Open</Link>}
            </li>))}</ul>
        )}
      </Card>
    </>
  );
}
