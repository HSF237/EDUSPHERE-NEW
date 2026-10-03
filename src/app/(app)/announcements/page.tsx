import { db } from "@/lib/db";
import { can, getCtx } from "@/lib/scope";
import { Card, PageHeader, Badge, Empty } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { AnnForm } from "./form";
import { deleteAnnouncement } from "./actions";

export const metadata = { title: "Announcements" };

export default async function Announcements() {
  const ctx = await getCtx();
  const aud = ctx.role === "ADMIN" ? undefined : { in: ctx.role === "TEACHER" ? (["ALL", "TEACHERS"] as const).slice() : (["ALL", "PARENTS"] as const).slice() };
  const list = await db.announcement.findMany({ where: { schoolId: ctx.schoolId, ...(aud ? { audience: aud } : {}) }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 50 });
  const authors = await db.user.findMany({ where: { id: { in: list.map((a) => a.authorId) } }, select: { id: true, name: true } });
  const an = new Map(authors.map((a) => [a.id, a.name]));
  return (
    <>
      <PageHeader title="Announcements" sub="Official notices from the school." />
      {can(ctx, "ANNOUNCE") && <Card title="New announcement" className="mb-6"><AnnForm /></Card>}
      <div className="space-y-3">
        {list.length === 0 && <Card><Empty title="No announcements yet" /></Card>}
        {list.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <div><div className="flex items-center gap-2 font-semibold">{a.title}{a.pinned && <Badge tone="indigo">Pinned</Badge>}<Badge>{a.audience.toLowerCase()}</Badge></div>
                <div className="text-xs text-slate-500">{an.get(a.authorId)} · {fmtDate(a.createdAt)}</div></div>
              {can(ctx, "ANNOUNCE") && <form action={deleteAnnouncement.bind(null, a.id)}><button className="text-xs text-red-600 hover:underline">Delete</button></form>}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
