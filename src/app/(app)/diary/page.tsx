import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx, pickChild } from "@/lib/scope";
import { Card, PageHeader, Empty } from "@/components/ui";
import { fmtDate, isoDate, todayUTC } from "@/lib/utils";

export const metadata = { title: "Class diary" };

async function addEntry(fd: FormData) {
  "use server";
  const ctx = await getCtx();
  if (ctx.role === "PARENT") return;
  const classId = String(fd.get("classId")); const subject = String(fd.get("subject") ?? "").trim(); const topic = String(fd.get("topic") ?? "").trim();
  if (!ctx.classIds.includes(classId) || !subject || !topic) return;
  const teacherId = ctx.teacherId ?? (await db.teacher.findFirst({ where: { schoolId: ctx.schoolId } }))?.id;
  if (!teacherId) return;
  await db.diaryEntry.create({ data: { schoolId: ctx.schoolId, classId, teacherId, date: new Date(String(fd.get("date")) || isoDate(todayUTC())), subject, topic, notes: String(fd.get("notes") ?? "").slice(0, 1000) || null } });
  revalidatePath("/diary");
}

export default async function Diary({ searchParams }: { searchParams: Promise<{ class?: string; child?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  let classIds = ctx.classIds; let sub = "";
  if (ctx.role === "PARENT") { const { kid } = await pickChild(ctx, sp.child); classIds = kid ? [kid.classId] : []; sub = kid ? `${kid.name} · Class ${kid.class.name}` : ""; }
  const classes = await db.class.findMany({ where: { id: { in: classIds } }, orderBy: { name: "asc" } });
  const sel = classes.find((c) => c.id === sp.class)?.id;
  const list = await db.diaryEntry.findMany({ where: { schoolId: ctx.schoolId, classId: sel ?? { in: classIds } }, include: { class: true }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 60 });
  return (
    <>
      <PageHeader title="Class diary" sub={sub || "What was taught in class, day by day."}>
        {ctx.role !== "PARENT" && <form className="flex gap-2"><select name="class" defaultValue={sel ?? ""} className="input" aria-label="Class"><option value="">All classes</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="btn-ghost">Filter</button></form>}
      </PageHeader>
      {ctx.role !== "PARENT" && (
        <Card title="New diary entry" className="mb-6"><form action={addEntry} className="grid gap-4 sm:grid-cols-4">
          <div><label className="label" htmlFor="dc">Class</label><select id="dc" name="classId" className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label" htmlFor="dd">Date</label><input id="dd" name="date" type="date" defaultValue={isoDate(todayUTC())} className="input" /></div>
          <div><label className="label" htmlFor="ds">Subject</label><input id="ds" name="subject" className="input" required /></div>
          <div><label className="label" htmlFor="dt">Topic taught</label><input id="dt" name="topic" className="input" required /></div>
          <div className="sm:col-span-3"><label className="label" htmlFor="dn">Notes</label><input id="dn" name="notes" className="input" /></div><div className="flex items-end justify-end"><button className="btn">Add entry</button></div></form></Card>
      )}
      <div className="space-y-3">{list.length === 0 && <Card><Empty title="No diary entries yet" /></Card>}
        {list.map((d) => (<Card key={d.id}><div className="flex justify-between text-sm"><span className="font-semibold">{d.subject} — {d.topic}</span><span className="text-slate-500">{d.class.name} · {fmtDate(d.date)}</span></div>{d.notes && <p className="mt-1 text-sm text-slate-600">{d.notes}</p>}</Card>))}</div>
    </>
  );
}
