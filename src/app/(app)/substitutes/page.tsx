import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { can, getCtx, notify } from "@/lib/scope";
import { Card, PageHeader, Table, Empty } from "@/components/ui";
import { fmtDate, isoDate, todayUTC } from "@/lib/utils";
import { SlotPicker } from "./slot-picker";

export const metadata = { title: "Substitutes" };

async function assignSub(fd: FormData) {
  "use server";
  const ctx = await getCtx(); if (!can(ctx, "SUBSTITUTES")) return;
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
  const list = await db.substitute.findMany({ where: { schoolId: ctx.schoolId, date: { gte: today }, ...(ctx.role === "TEACHER" && !can(ctx, "SUBSTITUTES") ? { OR: [{ subTeacherId: ctx.teacherId! }, { absentTeacherId: ctx.teacherId! }] } : {}) }, include: { slot: { include: { class: true, subject: true } }, sub: { include: { user: true } }, absent: { include: { user: true } } }, orderBy: { date: "asc" } });
  const [slots, teachers] = can(ctx, "SUBSTITUTES") ? await Promise.all([db.timetableSlot.findMany({ where: { schoolId: ctx.schoolId }, include: { class: true, subject: true, teacher: { include: { user: true } } }, orderBy: [{ day: "asc" }, { period: "asc" }], take: 5000 }), db.teacher.findMany({ where: { schoolId: ctx.schoolId }, include: { user: true } })]) : [[], []];
    return (
    <>
      <PageHeader title="Substitutes" sub="Cover for absent teachers. Conflicts with the substitute’s own timetable are blocked." />
      {can(ctx, "SUBSTITUTES") && (
        <Card title="Assign substitute" className="mb-6"><form action={assignSub} className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-4"><label className="label" htmlFor="ss">Period to cover</label><SlotPicker slots={slots.map((s) => ({ id: s.id, day: s.day, period: s.period, cls: s.class.name, subject: s.subject.name, teacher: s.teacher.user.name, teacherId: s.teacherId }))} /></div>
          <div><label className="label" htmlFor="sd">Date (must match weekday)</label><input id="sd" name="date" type="date" min={isoDate(today)} className="input" required /></div>
          <div><label className="label" htmlFor="st">Substitute</label><select id="st" name="subTeacherId" className="input">{teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}</select></div>
          <div className="sm:col-span-3"><label className="label" htmlFor="sr">Reason</label><input id="sr" name="reason" className="input" /></div><div className="flex items-end justify-end"><button className="btn">Assign</button></div></form></Card>
      )}
      <Card title="Upcoming" flush>{list.length === 0 ? <Empty title="No substitutions scheduled" /> : (
        <Table head={["Date", "Class", "Period", "Absent teacher", "Substitute"]}>{list.map((s) => (<tr key={s.id}><td className="td">{fmtDate(s.date)}</td><td className="td">{s.slot.class.name} · {s.slot.subject.name}</td><td className="td">{s.slot.period}</td><td className="td">{s.absent.user.name}</td><td className="td font-medium">{s.sub.user.name}</td></tr>))}</Table>)}</Card>
    </>
  );
}
