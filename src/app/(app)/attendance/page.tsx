import Link from "next/link";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { can, getCtx, isClassStaff } from "@/lib/scope";
import { Card, PageHeader, Table, Badge, Empty, Progress, Stat } from "@/components/ui";
import { fmtDate, isoDate, pct, todayUTC } from "@/lib/utils";
import { Register } from "./register";
import { ReviewButtons } from "./review";

export const metadata = { title: "Attendance" };
type SP = Promise<{ class?: string; date?: string; child?: string }>;

export default async function AttendancePage({ searchParams }: { searchParams: SP }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  if (ctx.role === "PARENT") return <ParentView ctx={ctx} childId={sp.child} />;
  const approver = can(ctx, "ATTENDANCE_APPROVE");
  const register = isClassStaff(ctx);
  if (!register && !approver) redirect("/dashboard");
  const classes = await db.class.findMany({ where: { id: { in: ctx.classIds } }, orderBy: { name: "asc" } });
  const classId = classes.find((c) => c.id === sp.class)?.id ?? classes[0]?.id;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : isoDate(todayUTC());
  const pending = approver
    ? await db.attendanceSession.findMany({ where: { schoolId: ctx.schoolId, status: "PENDING" }, include: { class: true, records: true }, orderBy: { date: "desc" }, take: 20 })
    : [];
  if (!register) return (<><PageHeader title="Attendance approvals" sub="Registers submitted by class teachers are waiting for your review." />{pending.length === 0 ? <Card><Empty title="Nothing to approve" hint="All submitted registers have been reviewed." /></Card> : <Card title={`Awaiting approval (${pending.length})`} flush><Table head={["Class", "Date", "Absent", "Late", ""]}>{pending.map((s) => (<tr key={s.id}><td className="td font-medium">{s.class.name}</td><td className="td">{fmtDate(s.date)}</td><td className="td">{s.records.filter((r) => r.status === "ABSENT").length}</td><td className="td">{s.records.filter((r) => r.status === "LATE").length}</td><td className="td"><ReviewButtons id={s.id} /></td></tr>))}</Table></Card>}</>);
  if (!classId) return (<><PageHeader title="Attendance" /><Card><Empty title="No classes assigned" hint="Ask your school admin to assign you to a class." /></Card></>);
  const [students, session] = await Promise.all([
    db.student.findMany({ where: { classId, schoolId: ctx.schoolId, active: true }, orderBy: { rollNo: "asc" } }),
    db.attendanceSession.findUnique({ where: { classId_date: { classId, date: new Date(date) } }, include: { records: true } }),
  ]);
  const map = new Map(session?.records.map((r) => [r.studentId, r.status]));
  const rows = students.map((s) => ({ id: s.id, name: s.name, rollNo: s.rollNo, status: map.get(s.id) ?? ("PRESENT" as const) }));
  const locked = session?.status === "APPROVED" && ctx.role !== "ADMIN";
  return (
    <>
      <PageHeader title="Attendance" sub="Mark the daily register. Principal approval is required before parents are notified.">
        <form className="flex flex-wrap items-center gap-2">
          <select name="class" defaultValue={classId} className="input w-32" aria-label="Class">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="date" name="date" defaultValue={date} max={isoDate(todayUTC())} className="input w-40" aria-label="Date" />
          <button className="btn-ghost">Go</button>
        </form>
      </PageHeader>
      {approver && pending.length > 0 && (
        <Card title={`Awaiting approval (${pending.length})`} className="mb-6" flush>
          <Table head={["Class", "Date", "Absent", "Late", ""]}>
            {pending.map((s) => (
              <tr key={s.id}><td className="td font-medium">{s.class.name}</td><td className="td">{fmtDate(s.date)}</td>
                <td className="td">{s.records.filter((r) => r.status === "ABSENT").length}</td><td className="td">{s.records.filter((r) => r.status === "LATE").length}</td>
                <td className="td"><ReviewButtons id={s.id} /></td></tr>
            ))}
          </Table>
        </Card>
      )}
      <Card title={`Class ${classes.find((c) => c.id === classId)!.name} · ${fmtDate(date)}`} action={session ? <Badge tone={session.status === "APPROVED" ? "green" : session.status === "REJECTED" ? "red" : "amber"}>{session.status.toLowerCase()}</Badge> : <Badge>not marked</Badge>} flush>
        {session?.status === "REJECTED" && <p className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">Returned: {session.reviewNote || "please review and resubmit."}</p>}
        {students.length === 0 ? <Empty title="No students in this class" /> : <Register key={`${classId}${date}${session?.status}`} classId={classId} date={date} rows={rows} locked={locked} />}
      </Card>
    </>
  );
}

async function ParentView({ ctx, childId }: { ctx: Awaited<ReturnType<typeof getCtx>>; childId?: string }) {
  const kids = await db.student.findMany({ where: { id: { in: ctx.childIds }, schoolId: ctx.schoolId }, include: { class: true } });
  const kid = kids.find((k) => k.id === childId) ?? kids[0];
  if (!kid) return (<><PageHeader title="Attendance" /><Card><Empty title="No children linked" /></Card></>);
  const recs = await db.attendanceRecord.findMany({ where: { studentId: kid.id, session: { status: "APPROVED" } }, include: { session: true }, orderBy: { session: { date: "desc" } }, take: 60 });
  const c = (s: string) => recs.filter((r) => r.status === s).length;
  const present = c("PRESENT") + c("LATE");
  const rate = pct(present, recs.length);
  return (
    <>
      <PageHeader title="Attendance" sub={`${kid.name} · Class ${kid.class.name}`}>
        {kids.length > 1 && <form><select name="child" defaultValue={kid.id} className="input" aria-label="Child">{kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select> <button className="btn-ghost">Switch</button></form>}
      </PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <Stat label="Attendance" value={`${rate}%`} tone={rate >= 90 ? "green" : rate >= 75 ? "amber" : "red"} /><Stat label="Present" value={c("PRESENT")} tone="green" />
        <Stat label="Absent" value={c("ABSENT")} tone="red" /><Stat label="Late" value={c("LATE")} tone="amber" />
      </div>
      <Card title="Recent days (last 60 recorded)" flush>
        <div className="border-b border-slate-100 px-5 py-3"><Progress value={rate} tone={rate >= 90 ? "green" : "amber"} /></div>
        <Table head={["Date", "Status"]}>
          {recs.map((r) => (<tr key={r.id}><td className="td">{fmtDate(r.session.date)}</td><td className="td"><Badge tone={r.status === "PRESENT" ? "green" : r.status === "ABSENT" ? "red" : r.status === "LATE" ? "amber" : "blue"}>{r.status.toLowerCase()}</Badge></td></tr>))}
        </Table>
        {recs.length === 0 && <Empty title="No approved attendance yet" />}
      </Card>
    </>
  );
}
