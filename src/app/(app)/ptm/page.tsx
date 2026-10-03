import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx, pickChild } from "@/lib/scope";
import { Card, PageHeader, Table, Empty, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Parent meetings" };

async function createEvent(fd: FormData) {
  "use server";
  const ctx = await getCtx(); if (ctx.role !== "ADMIN") return;
  const title = String(fd.get("title") ?? "").trim(); const date = new Date(String(fd.get("date")));
  const mins = Math.min(30, Math.max(5, Number(fd.get("slotMinutes")) || 10));
  if (title.length < 3 || Number.isNaN(+date)) return;
  const ev = await db.ptmEvent.create({ data: { schoolId: ctx.schoolId, title, date, venue: String(fd.get("venue") ?? "") || null, slotMinutes: mins } });
  const teachers = await db.teacher.findMany({ where: { schoolId: ctx.schoolId }, select: { id: true } });
  const times: string[] = [];
  for (let m = 9 * 60; m < 12 * 60; m += mins) times.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  await db.ptmSlot.createMany({ data: teachers.flatMap((t) => times.map((startTime) => ({ eventId: ev.id, teacherId: t.id, startTime }))) });
  const parents = await db.user.findMany({ where: { schoolId: ctx.schoolId, role: "PARENT" }, select: { id: true } });
  await db.notification.createMany({ data: parents.map((p) => ({ schoolId: ctx.schoolId, userId: p.id, title: "Parent meeting scheduled", body: title, link: "/ptm" })) });
  revalidatePath("/ptm");
}
async function book(slotId: string, studentId: string) {
  "use server";
  const ctx = await getCtx(); if (ctx.role !== "PARENT" || !ctx.childIds.includes(studentId)) return;
  const slot = await db.ptmSlot.findFirst({ where: { id: slotId, studentId: null, event: { schoolId: ctx.schoolId } } });
  if (!slot) return;
  const dup = await db.ptmSlot.findFirst({ where: { eventId: slot.eventId, teacherId: slot.teacherId, studentId } });
  if (dup) return;
  await db.ptmSlot.updateMany({ where: { id: slotId, studentId: null }, data: { studentId } });
  revalidatePath("/ptm");
}
async function cancel(slotId: string) {
  "use server";
  const ctx = await getCtx(); if (ctx.role !== "PARENT") return;
  await db.ptmSlot.updateMany({ where: { id: slotId, studentId: { in: ctx.childIds } }, data: { studentId: null } });
  revalidatePath("/ptm");
}

export default async function Ptm({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  const events = await db.ptmEvent.findMany({ where: { schoolId: ctx.schoolId, date: { gte: new Date(new Date().toISOString().slice(0, 10)) } }, orderBy: { date: "asc" }, take: 10 });
  return (
    <>
      <PageHeader title="Parent–teacher meetings" sub="Book a time with your child’s teachers." />
      {ctx.role === "ADMIN" && (<Card title="Schedule a meeting day" className="mb-6"><form action={createEvent} className="grid gap-4 sm:grid-cols-5">
        <div className="sm:col-span-2"><label className="label" htmlFor="pt">Title</label><input id="pt" name="title" className="input" required /></div><div><label className="label" htmlFor="pd">Date</label><input id="pd" name="date" type="date" className="input" required /></div>
        <div><label className="label" htmlFor="pv">Venue</label><input id="pv" name="venue" className="input" /></div><div><label className="label" htmlFor="pm">Slot (min)</label><input id="pm" name="slotMinutes" type="number" defaultValue={10} min={5} max={30} className="input" /></div>
        <div className="sm:col-span-5 text-right"><button className="btn">Create (09:00–12:00 slots for every teacher)</button></div></form></Card>)}
      {events.length === 0 && <Card><Empty title="No upcoming meetings" /></Card>}
      {await Promise.all(events.map(async (ev) => {
        if (ctx.role === "PARENT") {
          const { kid } = await pickChild(ctx, sp.child);
          if (!kid) return null;
          const teacherIds = (await db.classSubject.findMany({ where: { classId: kid.classId }, select: { teacherId: true } })).map((x) => x.teacherId);
          const slots = await db.ptmSlot.findMany({ where: { eventId: ev.id, teacherId: { in: teacherIds } }, include: { teacher: { include: { user: true } } }, orderBy: { startTime: "asc" } });
          const byT = new Map<string, typeof slots>(); slots.forEach((s) => byT.set(s.teacherId, [...(byT.get(s.teacherId) ?? []), s]));
          return (<Card key={ev.id} title={`${ev.title} · ${fmtDate(ev.date)}${ev.venue ? ` · ${ev.venue}` : ""}`} className="mb-6"><p className="mb-3 text-sm text-slate-500">Booking for {kid.name}</p>
            <div className="space-y-4">{[...byT.entries()].map(([tid, ss]) => { const mine = ss.find((s) => s.studentId === kid.id); return (<div key={tid}><div className="mb-1 flex items-center gap-2 text-sm font-medium">{ss[0].teacher.user.name}{mine && <Badge tone="green">Booked {mine.startTime}</Badge>}</div>
              <div className="flex flex-wrap gap-1.5">{mine ? <form action={cancel.bind(null, mine.id)}><button className="btn-ghost">Cancel {mine.startTime}</button></form> : ss.filter((s) => !s.studentId).slice(0, 18).map((s) => <form key={s.id} action={book.bind(null, s.id, kid.id)}><button className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-brand-50">{s.startTime}</button></form>)}</div></div>);})}</div></Card>);
        }
        const bookings = await db.ptmSlot.findMany({ where: { eventId: ev.id, studentId: { not: null }, ...(ctx.role === "TEACHER" ? { teacherId: ctx.teacherId! } : {}) }, include: { student: { include: { class: true } }, teacher: { include: { user: true } } }, orderBy: [{ startTime: "asc" }] });
        return (<Card key={ev.id} title={`${ev.title} · ${fmtDate(ev.date)} — ${bookings.length} booked`} className="mb-6" flush>{bookings.length === 0 ? <Empty title="No bookings yet" /> : <Table head={["Time", "Teacher", "Student", "Class"]}>{bookings.map((b) => <tr key={b.id}><td className="td">{b.startTime}</td><td className="td">{b.teacher.user.name}</td><td className="td font-medium">{b.student!.name}</td><td className="td">{b.student!.class.name}</td></tr>)}</Table>}</Card>);
      }))}
    </>
  );
}
