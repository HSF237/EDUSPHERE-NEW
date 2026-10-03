import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx, notify } from "@/lib/scope";
import { Card, PageHeader, Table, Empty } from "@/components/ui";
import { fmtDate, isoDate, todayUTC } from "@/lib/utils";

export const metadata = { title: "Substitutes" };

async function assignSub(fd: FormData) {
  "use server";
  const ctx = await getCtx(); if (ctx.role !== "ADMIN") return;
  const slotId = String(fd.get("slotId")); const subId = String(fd.get("subTeacherId")); const date = new Date(String(fd.get("date")));
  if (Number.isNaN(+date)) return;
  const slot = await db.timetableSlot.findFirst({ where: { id: slotId, schoolId: ctx.schoolId }, include: { class: true } });
  const sub = await db.teacher.findFirst({ where: { id: subId, schoolId: ctx.schoolId } });
  if (!slot || !sub || sub.id === slot.teacherId) return;
  const dow = (date.getUTCDay() + 6) % 7;
  if (dow !== slot.day) return;
  const busy = await db.timetableSlot.findFirst({ where: { teacherId: sub.id, day: slot.day, period: slot.period } });
  if (busy) return;
  await db.substitute.upsert({ where: { slotId_date: { slotId, date } }, create: { schoolId: ctx.schoolId, slotId, date, absentTeacherId: slot.teacherId, subTeacherId: sub.id, reason: String(fd.get("reason") ?? "") || null }, update: { subTeacherId: sub.id } });
  await notify(ctx.schoolId, [sub.userId], "Substitution assigned", `Class ${slot.class.name}, period ${slot.period} on ${isoDate(date)}`, "/substitutes");
  revalidatePath("/substitutes");
}

export default async function Substitutes() {
  const ctx = await getCtx();
  if (ctx.role === "PARENT") return null;
  const today = todayUTC();
  const list = await db.substitute.findMany({ where: { schoolId: ctx.schoolId, date: { gte: today }, ...(ctx.role === "TEACHER" ? { OR: [{ subTeacherId: ctx.teacherId! }, { absentTeacherId: ctx.teacherId! }] } : {}) }, include: { slot: { include: { class: true, subject: true } }, sub: { include: { user: true } }, absent: { include: { user: true } } }, orderBy: { date: "asc" } });
  const [slots, teachers] = ctx.role === "ADMIN" ? await Promise.all([db.timetableSlot.findMany({ where: { schoolId: ctx.schoolId }, include: { class: true, subject: true, teacher: { include: { user: true } } }, orderBy: [{ day: "asc" }, { period: "asc" }], take: 400 }), db.teacher.findMany({ where: { schoolId: ctx.schoolId }, include: { user: true } })]) : [[], []];
  const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <>
      <PageHeader title="Substitutes" sub="Cover for absent teachers. Conflicts with the substitute’s own timetable are blocked." />
      {ctx.role === "ADMIN" && (
        <Card title="Assign substitute" className="mb-6"><form action={assignSub} className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2"><label className="label" htmlFor="ss">Period to cover</label><select id="ss" name="slotId" className="input">{slots.map((s) => <option key={s.id} value={s.id}>{DAY[s.day]} P{s.period} · {s.class.name} · {s.subject.name} ({s.teacher.user.name})</option>)}</select></div>
          <div><label className="label" htmlFor="sd">Date (must match weekday)</label><input id="sd" name="date" type="date" min={isoDate(today)} className="input" required /></div>
          <div><label className="label" htmlFor="st">Substitute</label><select id="st" name="subTeacherId" className="input">{teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}</select></div>
          <div className="sm:col-span-3"><label className="label" htmlFor="sr">Reason</label><input id="sr" name="reason" className="input" /></div><div className="flex items-end justify-end"><button className="btn">Assign</button></div></form></Card>
      )}
      <Card title="Upcoming" flush>{list.length === 0 ? <Empty title="No substitutions scheduled" /> : (
        <Table head={["Date", "Class", "Period", "Absent teacher", "Substitute"]}>{list.map((s) => (<tr key={s.id}><td className="td">{fmtDate(s.date)}</td><td className="td">{s.slot.class.name} · {s.slot.subject.name}</td><td className="td">{s.slot.period}</td><td className="td">{s.absent.user.name}</td><td className="td font-medium">{s.sub.user.name}</td></tr>))}</Table>)}</Card>
    </>
  );
}
