import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { can, getCtx } from "@/lib/scope";
import { PERMS } from "@/lib/perms";
import { Card, DashBanner, Chip, Stat, Table, Badge, Progress, Empty } from "@/components/ui";
import { LineChart } from "@/components/charts";
import { SceneCampus, SceneLaptop, SceneParent } from "@/components/art";
import { fmtDate, pct, todayUTC } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const ctx = await getCtx();
  if (ctx.role === "SUPER_ADMIN") return <PlatformDash />;
  if (ctx.role === "PARENT") return <ParentDash ctx={ctx} />;
  if (ctx.role === "TEACHER" && ctx.mode === "SUBJECT") return <SubjectDash ctx={ctx} />;
  return <StaffDash ctx={ctx} />;
}

async function PlatformDash() {
  const [schools, users, students] = await Promise.all([db.school.count(), db.user.count(), db.student.count()]);
  const list = await db.school.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { _count: { select: { students: true, teachers: true } } } });
  return (
    <>
      <DashBanner title="Platform overview" sub="Every school on EduSphere, at a glance." scene={<SceneCampus />} chips={<><Chip>{schools} schools</Chip><Chip>{users} users</Chip></>} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Schools" value={schools} icon="building" tone="indigo" /><Stat label="Users" value={users} icon="users" /><div className="col-span-2 sm:col-span-1"><Stat label="Students" value={students} icon="cap" tone="green" /></div>
      </div>
      <Card title="Recently added schools" flush>
        <Table head={["School", "Code", "Students", "Teachers", "Status"]}>
          {list.map((s) => (
            <tr key={s.id}><td className="td font-medium">{s.name}</td><td className="td">{s.code}</td><td className="td">{s._count.students}</td><td className="td">{s._count.teachers}</td>
              <td className="td"><Badge tone={s.active ? "green" : "red"}>{s.active ? "Active" : "Disabled"}</Badge></td></tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

async function StaffDash({ ctx }: { ctx: Awaited<ReturnType<typeof getCtx>> }) {
  const today = todayUTC();
  const admin = can(ctx, "ATTENDANCE_APPROVE");
  const since = new Date(today); since.setUTCDate(since.getUTCDate() - 30);
  const [students, sessionsToday, pendingApprovals, pendingLeave, recent, grp, classes, annc, hw] = await Promise.all([
    db.student.count({ where: { schoolId: ctx.schoolId, classId: { in: ctx.classIds }, active: true } }),
    db.attendanceSession.count({ where: { classId: { in: ctx.classIds }, date: today } }),
    admin ? db.attendanceSession.count({ where: { schoolId: ctx.schoolId, status: "PENDING" } }) : Promise.resolve(0),
    db.leaveRequest.count({ where: { schoolId: ctx.schoolId, status: "PENDING", student: { classId: { in: ctx.classIds } } } }),
    db.announcement.findMany({ where: { schoolId: ctx.schoolId }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 4 }),
    db.attendanceRecord.groupBy({ by: ["status"], where: { session: { classId: { in: ctx.classIds }, date: { gte: since } } }, _count: true }),
    db.class.findMany({ where: { id: { in: ctx.classIds } }, orderBy: { name: "asc" } }),
    db.announcement.count({ where: { schoolId: ctx.schoolId } }),
    db.homework.count({ where: { classId: { in: ctx.classIds }, dueOn: { gte: today }, status: "ACTIVE" } }),
  ]);
  const total = grp.reduce((a, g) => a + g._count, 0);
  const present = grp.filter((g) => g.status === "PRESENT" || g.status === "LATE").reduce((a, g) => a + g._count, 0);
  const rate = pct(present, total);
  // per-class 30-day attendance
  const perClass = await Promise.all(classes.map(async (c) => {
    const rows = await db.attendanceRecord.groupBy({ by: ["status"], where: { session: { classId: c.id, date: { gte: since } } }, _count: true });
    const t = rows.reduce((a, r) => a + r._count, 0);
    const p = rows.filter((r) => r.status !== "ABSENT" && r.status !== "EXCUSED").reduce((a, r) => a + r._count, 0);
    const marked = await db.attendanceSession.count({ where: { classId: c.id, date: today } });
    return { c, rate: pct(p, t), marked: marked > 0 };
  }));
  const trendRows = ctx.classIds.length
    ? await db.$queryRaw<{ d: Date; p: bigint; n: bigint }[]>(Prisma.sql`SELECT s."date" d, sum(case when r."status" in ('PRESENT','LATE') then 1 else 0 end) p, count(*) n FROM "AttendanceRecord" r JOIN "AttendanceSession" s ON s.id = r."sessionId" WHERE s."classId" IN (${Prisma.join(ctx.classIds)}) AND s."date" >= ${since} AND s."status" <> 'DRAFT' GROUP BY 1 ORDER BY 1`)
    : [];
  const trend = trendRows.map((r) => ({ label: r.d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }), value: Number(r.n) ? (Number(r.p) / Number(r.n)) * 100 : 0 }));
  return (
    <>
      <DashBanner title={`Welcome back, ${ctx.user.name.split(" ")[0]}`} sub={`${ctx.user.school?.name} · ${fmtDate(today)}`} scene={<SceneLaptop />} chips={<>{ctx.role === "TEACHER" && ctx.active && <Chip>Class teacher · {ctx.active.name}</Chip>}{ctx.position && <Chip>{ctx.position}</Chip>}<Chip>{students} students</Chip><Chip>{pendingLeave} leave pending</Chip><Chip>{hw} homework due</Chip></>} />
      <AccessLinks ctx={ctx} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Students" value={students} hint={`${classes.length} classes`} icon="cap" />
        <Stat label="30-day attendance" value={`${rate}%`} tone={rate >= 90 ? "green" : rate >= 80 ? "amber" : "red"} hint={`${total} records`} icon="attendance" />
        <Stat label={admin ? "Attendance to approve" : "Classes marked today"} value={admin ? pendingApprovals : `${sessionsToday}/${classes.length}`} tone="indigo" icon="check" />
        <Stat label="Pending leave requests" value={pendingLeave} tone={pendingLeave ? "amber" : "slate"} hint={`${hw} homework due soon`} icon="send" />
      </div>
      {trend.length > 2 && <Card title="Attendance — last 30 days" className="mb-6" action={<span className="text-xs text-slate-400">% present or late</span>}><LineChart id="dash-att" points={trend} ma={5} min={60} max={100} height={170} /></Card>}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Classes — today" className="lg:col-span-2" flush>
          {perClass.length === 0 ? <Empty title="No classes assigned yet" hint="Ask your school admin to assign you to a class." /> : (
            <Table head={["Class", "30-day attendance", "Today"]}>
              {perClass.map(({ c, rate, marked }) => (
                <tr key={c.id}>
                  <td className="td font-medium">{c.name}</td>
                  <td className="td w-1/2"><div className="flex items-center gap-3"><div className="flex-1"><Progress value={rate} tone={rate >= 90 ? "green" : rate >= 80 ? "amber" : "red"} /></div><span className="w-10 text-right text-xs">{rate}%</span></div></td>
                  <td className="td">{marked ? <Badge tone="green">Marked</Badge> : <Link href={`/attendance?class=${c.id}`} className="text-sm font-medium text-brand-600 hover:underline">Mark now</Link>}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card title="Announcements" action={<Link href="/announcements" className="text-xs text-brand-600">View all ({annc})</Link>}>
          {recent.length === 0 ? <p className="text-sm text-slate-500">Nothing posted yet.</p> : (
            <ul className="space-y-3">{recent.map((a) => (
              <li key={a.id}><div className="flex items-center gap-2 text-sm font-medium">{a.title}{a.pinned && <Badge tone="indigo">Pinned</Badge>}</div><div className="text-xs text-slate-500">{fmtDate(a.createdAt)}</div></li>
            ))}</ul>
          )}
        </Card>
      </div>
    </>
  );
}

const PERM_LINK: Record<string, string> = { STUDENTS: "/students", TEACHERS: "/teachers", CLASSES: "/classes", EXAMS: "/exams", ATTENDANCE_APPROVE: "/attendance", ANNOUNCE: "/announcements", REPORTS: "/reports", SUBSTITUTES: "/substitutes", PTM: "/ptm" };

/** Shortcuts to the extra responsibilities the principal has granted this teacher. */
function AccessLinks({ ctx }: { ctx: Awaited<ReturnType<typeof getCtx>> }) {
  if (ctx.role !== "TEACHER" || ctx.perms.length === 0) return null;
  return (
    <Card title={ctx.position ? `Your responsibilities — ${ctx.position}` : "Your responsibilities"} className="mb-6">
      <div className="flex flex-wrap gap-2">
        {PERMS.filter((p) => ctx.perms.includes(p.key)).map((p) => (
          <Link key={p.key} href={PERM_LINK[p.key]} className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-50 px-4 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100">{p.label}</Link>
        ))}
      </div>
    </Card>
  );
}

async function SubjectDash({ ctx }: { ctx: Awaited<ReturnType<typeof getCtx>> }) {
  const today = todayUTC();
  const since = new Date(today); since.setUTCDate(since.getUTCDate() - 30);
  const classId = ctx.active!.id; const t = ctx.teacherId!;
  const mySubs = await db.classSubject.findMany({ where: { classId, teacherId: t }, include: { subject: true } });
  const [students, portions30, hw, exams, recent] = await Promise.all([
    db.student.count({ where: { schoolId: ctx.schoolId, classId, active: true } }),
    db.portion.count({ where: { classId, teacherId: t, date: { gte: since } } }),
    db.homework.count({ where: { classId, status: "ACTIVE", dueOn: { gte: today }, subject: { classes: { some: { classId, teacherId: t } } } } }),
    db.exam.findMany({ where: { schoolId: ctx.schoolId, classId }, include: { marks: { where: { subjectId: { in: mySubs.map((m) => m.subjectId) } }, select: { id: true } } }, orderBy: { startsOn: "desc" }, take: 5 }),
    db.portion.findMany({ where: { classId, teacherId: t }, include: { subject: true }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 5 }),
  ]);
  const roster = students * mySubs.length;
  return (
    <>
      <DashBanner title={`Welcome back, ${ctx.user.name.split(" ")[0]}`} sub={`${ctx.user.school?.name} · ${fmtDate(today)}`} scene={<SceneLaptop />}
        chips={<><Chip>Subject teacher · Class {ctx.active!.name}</Chip>{ctx.position && <Chip>{ctx.position}</Chip>}{mySubs.map((m) => <Chip key={m.id}>{m.subject.name}</Chip>)}</>} />
      <AccessLinks ctx={ctx} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Students" value={students} hint={`Class ${ctx.active!.name}`} icon="cap" />
        <Stat label="Portions (30 days)" value={portions30} tone="indigo" icon="clipboard" hint="posted by you" />
        <Stat label="Homework due" value={hw} tone={hw ? "amber" : "slate"} icon="book" />
        <Stat label="Exams in class" value={exams.length} tone="green" icon="award" hint="latest 5 shown below" />
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/portions" className="btn">Post discussed portion</Link>
        <Link href="/exams" className="btn-ghost">Enter exam marks</Link>
        <Link href="/homework" className="btn-ghost">Assign homework</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card title="Exams — your marks entry" flush>
          {exams.length === 0 ? <Empty title="No exams yet" hint="The exam coordinator or principal creates them." /> : (
            <Table head={["Exam", "Starts", "Your marks", "Status"]}>
              {exams.map((e) => { const n = roster ? Math.min(100, Math.round((e.marks.length / roster) * 100)) : 0; return (
                <tr key={e.id}><td className="td font-medium"><Link className="text-brand-600 hover:underline" href={`/exams/${e.id}`}>{e.name}</Link></td><td className="td">{fmtDate(e.startsOn)}</td>
                  <td className="td w-1/3"><div className="flex items-center gap-2"><div className="flex-1"><Progress value={n} tone={n >= 100 ? "green" : "amber"} /></div><span className="w-9 text-right text-xs">{n}%</span></div></td>
                  <td className="td"><Badge tone={e.published ? "green" : "amber"}>{e.published ? "Published" : "Draft"}</Badge></td></tr>); })}
            </Table>
          )}
        </Card>
        <Card title="Recently discussed" action={<Link href="/portions" className="text-xs text-brand-600">View all</Link>}>
          {recent.length === 0 ? <p className="text-sm text-slate-500">You have not posted a portion yet. Let students and parents know what you covered today.</p> : (
            <ul className="space-y-3">{recent.map((p) => (
              <li key={p.id}><div className="flex items-center gap-2 text-sm font-medium"><Badge tone="indigo">{p.subject.name}</Badge>{p.topic}</div><div className="text-xs text-slate-500">{fmtDate(p.date)}</div></li>
            ))}</ul>
          )}
        </Card>
      </div>
    </>
  );
}

async function ParentDash({ ctx }: { ctx: Awaited<ReturnType<typeof getCtx>> }) {
  const today = todayUTC();
  const kids = await db.student.findMany({ where: { id: { in: ctx.childIds }, schoolId: ctx.schoolId }, include: { class: true } });
  const cards = await Promise.all(kids.map(async (k) => {
    const rows = await db.attendanceRecord.groupBy({ by: ["status"], where: { studentId: k.id, session: { status: "APPROVED" } }, _count: true });
    const t = rows.reduce((a, r) => a + r._count, 0);
    const p = rows.filter((r) => r.status === "PRESENT" || r.status === "LATE").reduce((a, r) => a + r._count, 0);
    const hw = await db.homework.findMany({ where: { classId: k.classId, dueOn: { gte: today }, status: "ACTIVE" }, include: { subject: true, submissions: { where: { studentId: k.id } } }, orderBy: { dueOn: "asc" }, take: 5 });
    const marks = await db.mark.findMany({ where: { studentId: k.id, exam: { published: true } } });
    const avg = marks.length ? Math.round(marks.reduce((a, m) => a + m.score, 0) / marks.length) : null;
    return { k, rate: pct(p, t), hw, avg };
  }));
  const ann = await db.announcement.findMany({ where: { schoolId: ctx.schoolId, audience: { in: ["ALL", "PARENTS"] } }, orderBy: { createdAt: "desc" }, take: 3 });
  return (
    <>
      <DashBanner title={`Welcome, ${ctx.user.name.split(" ")[0]}`} sub={ctx.user.school?.name} scene={<SceneParent />} chips={<Chip>{cards.length} {cards.length === 1 ? "child" : "children"}</Chip>} />
      {cards.length === 0 && <Card><Empty title="No children linked to your account" hint="Contact the school office to link your child." /></Card>}
      <div className="space-y-6">
        {cards.map(({ k, rate, hw, avg }) => (
          <Card key={k.id} title={`${k.name} · Class ${k.class.name}`}>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <Stat label="Attendance" value={`${rate}%`} tone={rate >= 90 ? "green" : rate >= 75 ? "amber" : "red"} icon="attendance" />
              <Stat label="Average marks" value={avg ?? "—"} tone="indigo" icon="award" />
              <div className="col-span-2 sm:col-span-1"><Stat label="Homework pending" value={hw.filter((h) => !h.submissions[0]?.done).length} icon="notebook" /></div>
            </div>
            <h3 className="mb-2 text-sm font-semibold">Upcoming homework</h3>
            {hw.length === 0 ? <p className="text-sm text-slate-500">No pending homework.</p> : (
              <ul className="divide-y divide-slate-100 text-sm">{hw.map((h) => (
                <li key={h.id} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2"><span>{h.title} <span className="text-slate-500">· {h.subject.name}</span></span>
                  <span className="flex items-center gap-2 text-xs text-slate-600 sm:text-sm">Due {fmtDate(h.dueOn)} {h.submissions[0]?.done ? <Badge tone="green">Done</Badge> : <Badge tone="amber">Pending</Badge>}</span></li>
              ))}</ul>
            )}
          </Card>
        ))}
        <Card title="School announcements">
          {ann.length === 0 ? <p className="text-sm text-slate-500">Nothing posted yet.</p> : ann.map((a) => (
            <div key={a.id} className="mb-3 last:mb-0"><div className="text-sm font-medium">{a.title}</div><p className="text-sm text-slate-600">{a.body}</p></div>
          ))}
        </Card>
      </div>
    </>
  );
}
