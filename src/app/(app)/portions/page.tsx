import { db } from "@/lib/db";
import { getCtx, pickChild } from "@/lib/scope";
import { Card, PageHeader, Badge, Empty } from "@/components/ui";
import { fmtDate, isoDate, todayUTC } from "@/lib/utils";
import { DeletePortion, NewPortion } from "./forms";

export const metadata = { title: "Discussed portions" };

export default async function Portions({ searchParams }: { searchParams: Promise<{ child?: string; class?: string; subject?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  let classIds = ctx.classIds; let sub = "What each subject teacher has covered in class.";
  let kids: { id: string; name: string }[] = []; let kidId = "";
  if (ctx.role === "PARENT") {
    const { kids: ks, kid } = await pickChild(ctx, sp.child);
    kids = ks; kidId = kid?.id ?? ""; classIds = kid ? [kid.classId] : [];
    if (kid) sub = `${kid.name} · Class ${kid.class.name}`;
  }
  const classes = await db.class.findMany({ where: { id: { in: classIds } }, orderBy: { name: "asc" } });
  const classId = classes.find((c) => c.id === sp.class)?.id ?? (ctx.role === "TEACHER" ? ctx.active?.id : undefined) ?? (ctx.role === "PARENT" ? classes[0]?.id : undefined);
  const mine = ctx.role === "TEACHER" && classId ? await db.classSubject.findMany({ where: { classId, teacherId: ctx.teacherId! }, include: { subject: true } }) : [];
  const subjects = classId || classIds.length ? await db.subject.findMany({ where: { classes: { some: { classId: classId ?? { in: classIds } } } }, orderBy: { name: "asc" } }) : [];
  const list = await db.portion.findMany({
    where: { schoolId: ctx.schoolId, classId: classId ?? { in: classIds }, ...(sp.subject ? { subjectId: sp.subject } : {}) },
    include: { subject: true, class: true, teacher: { include: { user: true } } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 80,
  });
  const days = [...new Set(list.map((p) => isoDate(p.date)))];
  const today = isoDate(todayUTC());
  const showClass = !classId && classes.length > 1;
  return (
    <>
      <PageHeader title="Discussed portions" sub={ctx.role === "TEACHER" ? `Class ${ctx.active?.name ?? "—"} · post what you covered today so students and parents can follow along.` : sub}>
        {ctx.role === "PARENT" && kids.length > 1 && <form className="flex gap-2"><select name="child" defaultValue={kidId} className="input" aria-label="Child">{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select><button className="btn-ghost">Switch</button></form>}
        {ctx.role === "ADMIN" && <form className="flex flex-wrap gap-2"><select name="class" defaultValue={classId ?? ""} className="input w-32" aria-label="Class"><option value="">All classes</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select name="subject" defaultValue={sp.subject ?? ""} className="input w-40" aria-label="Subject"><option value="">All subjects</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="btn-ghost">Filter</button></form>}
      </PageHeader>
      {ctx.role === "TEACHER" && classId && (
        <Card title="Post a discussed portion" className="mb-6">
          {mine.length === 0 ? <p className="text-sm text-slate-500">You do not teach a subject in class {ctx.active?.name}.</p> : <NewPortion classId={classId} subjects={mine.map((m) => ({ id: m.subjectId, name: m.subject.name }))} today={today} />}
        </Card>
      )}
      {list.length === 0 ? <Card><Empty title="No portions posted yet" hint={ctx.role === "TEACHER" ? "Post your first one above." : "Subject teachers will post what they cover in class."} /></Card> : (
        <div className="space-y-5">
          {days.map((d) => (
            <section key={d} aria-label={fmtDate(new Date(d))}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{d === today ? "Today" : fmtDate(new Date(d))}</h2>
              <div className="space-y-3">
                {list.filter((p) => isoDate(p.date) === d).map((p) => (
                  <Card key={p.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><Badge tone="indigo">{p.subject.name}</Badge>{showClass && <Badge>{p.class.name}</Badge>}<span className="font-semibold">{p.topic}</span></div>
                        <div className="mt-0.5 text-xs text-slate-500">{p.teacher.user.name}</div>
                      </div>
                      {(ctx.role === "ADMIN" || (ctx.role === "TEACHER" && p.teacherId === ctx.teacherId)) && <DeletePortion id={p.id} />}
                    </div>
                    {p.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{p.notes}</p>}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
