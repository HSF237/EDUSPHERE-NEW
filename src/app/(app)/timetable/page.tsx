import { db } from "@/lib/db";
import { getCtx, pickChild } from "@/lib/scope";
import { Card, PageHeader, Empty } from "@/components/ui";
import { DAYS, isoDate, todayUTC } from "@/lib/utils";

export const metadata = { title: "Timetable" };

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ class?: string; child?: string; mine?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  let classId: string | undefined; let title = "";
  let kids: { id: string; name: string }[] = [];
  let classes: { id: string; name: string }[] = [];
  if (ctx.role === "PARENT") { const r = await pickChild(ctx, sp.child); kids = r.kids; classId = r.kid?.classId; title = r.kid ? `${r.kid.name} · Class ${r.kid.class.name}` : ""; }
  else { classes = await db.class.findMany({ where: { id: { in: ctx.classIds } }, orderBy: { name: "asc" }, select: { id: true, name: true } }); classId = classes.find((c) => c.id === sp.class)?.id ?? classes[0]?.id; title = classes.find((c) => c.id === classId)?.name ? `Class ${classes.find((c) => c.id === classId)!.name}` : ""; }
  const mine = ctx.role === "TEACHER" && sp.mine === "1";
  const slots = await db.timetableSlot.findMany({ where: mine ? { schoolId: ctx.schoolId, teacherId: ctx.teacherId! } : { schoolId: ctx.schoolId, classId: classId ?? "none" }, include: { subject: true, teacher: { include: { user: true } }, class: true } });
  const today = todayUTC();
  const subs = await db.substitute.findMany({ where: { schoolId: ctx.schoolId, date: today }, include: { sub: { include: { user: true } } } });
  const subBySlot = new Map(subs.map((s) => [s.slotId, s]));
  const periods = [...new Set(slots.map((s) => s.period))].sort((a, b) => a - b);
  const todayIdx = (today.getUTCDay() + 6) % 7;
  return (
    <>
      <PageHeader title="Timetable" sub={mine ? "Your weekly teaching schedule" : title}>
        <form className="flex gap-2">
          {ctx.role === "PARENT" && kids.length > 1 && <select name="child" defaultValue={sp.child} className="input">{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select>}
          {ctx.role !== "PARENT" && <select name="class" defaultValue={classId} className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
          {ctx.role === "TEACHER" && <select name="mine" defaultValue={sp.mine ?? "0"} className="input"><option value="0">Class view</option><option value="1">My schedule</option></select>}
          <button className="btn-ghost">View</button>
        </form>
      </PageHeader>
      <Card flush>
        {periods.length === 0 ? <Empty title="No timetable published yet" hint="The school admin can add periods." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50"><tr><th className="th w-24">Period</th>{DAYS.slice(0, 5).map((d, i) => <th key={d} className={`th ${i === todayIdx ? "text-brand-700" : ""}`}>{d}{i === todayIdx && " (today)"}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{periods.map((p) => (
              <tr key={p}><td className="td font-medium text-slate-500">{p}<div className="text-xs font-normal">{slots.find((s) => s.period === p)?.startTime}</div></td>
                {[0, 1, 2, 3, 4].map((d) => { const s = slots.find((x) => x.period === p && x.day === d); const sub = s && d === todayIdx ? subBySlot.get(s.id) : undefined; return (
                  <td key={d} className={`td ${d === todayIdx ? "bg-brand-50/50" : ""}`}>{s ? (<><div className="font-medium">{s.subject.name}</div><div className="text-xs text-slate-500">{mine ? `Class ${s.class.name}` : sub ? <span className="text-amber-600">Sub: {sub.sub.user.name}</span> : s.teacher.user.name}</div></>) : <span className="text-slate-300">—</span>}</td>);})}
              </tr>))}</tbody></table></div>
        )}
      </Card>
    </>
  );
}
