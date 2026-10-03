import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Badge, Card, Empty, PageHeader, Stat, Table } from "@/components/ui";
import { Columns, Donut, HBars, Heatmap, LineChart, tint } from "@/components/charts";
import { fmtDate, todayUTC } from "@/lib/utils";

export const metadata = { title: "Reports" };

type Counts = Record<string, number>;
const rate = (c: Counts) => { const t = (c.PRESENT ?? 0) + (c.LATE ?? 0) + (c.ABSENT ?? 0) + (c.EXCUSED ?? 0); return t ? (((c.PRESENT ?? 0) + (c.LATE ?? 0)) / t) * 100 : null; };
const add = (m: Map<string, Counts>, k: string, status: string, n: number) => { const c = m.get(k) ?? {}; c[status] = (c[status] ?? 0) + n; m.set(k, c); };
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default async function Reports({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN") return null;
  const days = (await searchParams).days === "30" ? 30 : 60;
  const sid = ctx.schoolId;
  const today = todayUTC();
  const since = new Date(today); since.setUTCDate(since.getUTCDate() - days);

  const [byDay, byClassWeek, byDow, byStudent, classes, subjects, students, marks, hwRows, leaves] = await Promise.all([
    db.$queryRaw<{ d: Date; status: string; n: bigint }[]>(Prisma.sql`SELECT s."date" d, r."status"::text status, count(*) n FROM "AttendanceRecord" r JOIN "AttendanceSession" s ON s.id = r."sessionId" WHERE s."schoolId" = ${sid} AND s."status" = 'APPROVED' AND s."date" >= ${since} GROUP BY 1,2 ORDER BY 1`),
    db.$queryRaw<{ c: string; w: Date; status: string; n: bigint }[]>(Prisma.sql`SELECT s."classId" c, date_trunc('week', s."date")::date w, r."status"::text status, count(*) n FROM "AttendanceRecord" r JOIN "AttendanceSession" s ON s.id = r."sessionId" WHERE s."schoolId" = ${sid} AND s."status" = 'APPROVED' AND s."date" >= ${since} GROUP BY 1,2,3`),
    db.$queryRaw<{ dow: number; status: string; n: bigint }[]>(Prisma.sql`SELECT extract(isodow from s."date")::int dow, r."status"::text status, count(*) n FROM "AttendanceRecord" r JOIN "AttendanceSession" s ON s.id = r."sessionId" WHERE s."schoolId" = ${sid} AND s."status" = 'APPROVED' AND s."date" >= ${since} GROUP BY 1,2`),
    db.$queryRaw<{ sid: string; status: string; n: bigint }[]>(Prisma.sql`SELECT r."studentId" sid, r."status"::text status, count(*) n FROM "AttendanceRecord" r JOIN "AttendanceSession" s ON s.id = r."sessionId" WHERE s."schoolId" = ${sid} AND s."status" = 'APPROVED' AND s."date" >= ${since} GROUP BY 1,2`),
    db.class.findMany({ where: { schoolId: sid }, orderBy: [{ grade: "asc" }, { section: "asc" }] }),
    db.subject.findMany({ where: { schoolId: sid } }),
    db.student.findMany({ where: { schoolId: sid, active: true }, select: { id: true, name: true, classId: true } }),
    db.mark.findMany({ where: { exam: { schoolId: sid, published: true } }, select: { score: true, subjectId: true, studentId: true, exam: { select: { name: true, maxMarks: true, passMarks: true, classId: true, startsOn: true } } } }),
    db.$queryRaw<{ c: string; sub: string; done: bigint; n: bigint }[]>(Prisma.sql`SELECT h."classId" c, h."subjectId" sub, sum(case when x."done" then 1 else 0 end) done, count(*) n FROM "HomeworkSubmission" x JOIN "Homework" h ON h.id = x."homeworkId" WHERE h."schoolId" = ${sid} AND h."dueOn" >= ${since} AND h."dueOn" < ${today} GROUP BY 1,2`),
    db.leaveRequest.groupBy({ by: ["status"], where: { schoolId: sid, createdAt: { gte: since } }, _count: true }),
  ]);

  // ── attendance ──
  const total: Counts = {}; const perDay = new Map<string, Counts>(); const perClass = new Map<string, Counts>(); const perWeek = new Map<string, Counts>(); const perStudent = new Map<string, Counts>(); const perDow = new Map<string, Counts>();
  for (const r of byDay) { const k = r.d.toISOString().slice(0, 10); add(perDay, k, r.status, Number(r.n)); total[r.status] = (total[r.status] ?? 0) + Number(r.n); }
  for (const r of byClassWeek) { add(perClass, r.c, r.status, Number(r.n)); add(perWeek, `${r.c}|${r.w.toISOString().slice(0, 10)}`, r.status, Number(r.n)); }
  for (const r of byDow) add(perDow, String(r.dow), r.status, Number(r.n));
  for (const r of byStudent) add(perStudent, r.sid, r.status, Number(r.n));
  const overall = rate(total);
  const trend = [...perDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([d, c]) => ({ label: new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }), value: rate(c) ?? 0 }));
  const weeks = [...new Set(byClassWeek.map((r) => r.w.toISOString().slice(0, 10)))].sort();
  const dowCols = DOW.map((d, i) => { const c = perDow.get(String(i + 1)) ?? {}; const t = (c.PRESENT ?? 0) + (c.LATE ?? 0) + (c.ABSENT ?? 0) + (c.EXCUSED ?? 0); return { label: d, values: [t ? ((c.ABSENT ?? 0) / t) * 100 : 0] }; });
  const classRates = classes.map((c) => ({ c, r: rate(perClass.get(c.id) ?? {}) }));

  // ── academics ──
  const sName = new Map(subjects.map((s) => [s.id, s.name]));
  const pctOf = (m: (typeof marks)[number]) => (m.score / m.exam.maxMarks) * 100;
  const passed = marks.filter((m) => m.score >= m.exam.passMarks).length;
  const examNames = [...new Map(marks.map((m) => [m.exam.name, m.exam.startsOn.getTime()])).entries()].sort((a, b) => a[1] - b[1]).map(([n]) => n).slice(-3);
  const examCols = classes.map((c) => ({ label: c.name, values: examNames.map((n) => avg(marks.filter((m) => m.exam.classId === c.id && m.exam.name === n).map(pctOf))) }));
  const bySubject = [...new Set(marks.map((m) => m.subjectId))].map((id) => ({ label: sName.get(id) ?? "—", value: avg(marks.filter((m) => m.subjectId === id).map(pctOf)) })).sort((a, b) => b.value - a.value);
  const bands = [["<35", 0, 35], ["35–49", 35, 50], ["50–59", 50, 60], ["60–69", 60, 70], ["70–79", 70, 80], ["80–89", 80, 90], ["90+", 90, 101]] as const;
  const dist = bands.map(([label, lo, hi]) => ({ label, values: [marks.filter((m) => pctOf(m) >= lo && pctOf(m) < hi).length] }));
  const maxDist = Math.max(1, ...dist.map((d) => d.values[0]));
  const stuAvg = new Map<string, number>(); for (const s of students) { const v = marks.filter((m) => m.studentId === s.id).map(pctOf); if (v.length) stuAvg.set(s.id, avg(v)); }
  const clsName = new Map(classes.map((c) => [c.id, c.name]));
  const top = students.filter((s) => stuAvg.has(s.id)).sort((a, b) => stuAvg.get(b.id)! - stuAvg.get(a.id)!).slice(0, 8);

  // ── attention list ──
  const risk = students.map((s) => ({ s, att: rate(perStudent.get(s.id) ?? {}), acad: stuAvg.get(s.id) ?? null, absent: perStudent.get(s.id)?.ABSENT ?? 0 }))
    .filter((x) => (x.att != null && x.att < 85) || (x.acad != null && x.acad < 45))
    .sort((a, b) => ((a.att ?? 100) + (a.acad ?? 100)) - ((b.att ?? 100) + (b.acad ?? 100))).slice(0, 12);

  // ── homework ──
  const hwTot = hwRows.reduce((a, r) => a + Number(r.n), 0); const hwDone = hwRows.reduce((a, r) => a + Number(r.done), 0);
  const hwClass = classes.map((c) => { const rs = hwRows.filter((r) => r.c === c.id); const n = rs.reduce((a, r) => a + Number(r.n), 0); return { label: c.name, v: n ? (rs.reduce((a, r) => a + Number(r.done), 0) / n) * 100 : 0 }; });
  const hwSubj = [...new Set(hwRows.map((r) => r.sub))].map((id) => { const rs = hwRows.filter((r) => r.sub === id); const n = rs.reduce((a, r) => a + Number(r.n), 0); return { label: sName.get(id) ?? "—", value: n ? (rs.reduce((a, r) => a + Number(r.done), 0) / n) * 100 : 0 }; }).sort((a, b) => b.value - a.value);

  const lv = (s: string) => leaves.find((l) => l.status === s)?._count ?? 0;
  const passRate = marks.length ? (passed / marks.length) * 100 : null;
  const avgPct = marks.length ? avg(marks.map(pctOf)) : null;
  const wkLabel = (w: string) => new Date(w).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });

  return (
    <>
      <PageHeader title="Reports & analytics" sub={`Attendance, results, homework and leave across the school — last ${days} days of approved attendance and all published exams.`}>
        {[30, 60].map((d) => <Link key={d} href={`/reports?days=${d}`} className={d === days ? "btn" : "btn-ghost"}>Last {d} days</Link>)}
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Stat label="Attendance" value={overall == null ? "—" : `${overall.toFixed(1)}%`} tone={overall == null ? "slate" : overall >= 92 ? "green" : overall >= 85 ? "amber" : "red"} icon="attendance" hint={`${(total.ABSENT ?? 0).toLocaleString()} absences`} />
        <Stat label="Exam pass rate" value={passRate == null ? "—" : `${passRate.toFixed(1)}%`} tone="green" icon="award" hint={`${marks.length.toLocaleString()} marks`} />
        <Stat label="Average score" value={avgPct == null ? "—" : `${avgPct.toFixed(1)}%`} tone="indigo" icon="chart" />
        <Stat label="Homework done" value={hwTot ? `${((hwDone / hwTot) * 100).toFixed(1)}%` : "—"} tone="indigo" icon="notebook" hint={`${hwTot.toLocaleString()} submissions`} />
        <Stat label="Leave requests" value={lv("APPROVED") + lv("REJECTED") + lv("PENDING")} icon="send" hint={`${lv("PENDING")} pending`} />
        <Stat label="Need attention" value={risk.length} tone={risk.length ? "amber" : "green"} icon="bell" hint="low attendance or marks" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="School-wide attendance trend" className="lg:col-span-2" action={<span className="text-xs text-slate-400">daily % · bold line = 5-day average</span>}>
          <LineChart id="att" points={trend} ma={5} min={60} max={100} />
        </Card>
        <Card title="Attendance mix">
          {overall == null ? <Empty title="No approved attendance yet" /> : <Donut center={`${Math.round(overall)}%`} sub="present or late" segments={[{ label: "Present", value: total.PRESENT ?? 0, color: "#10b981" }, { label: "Late", value: total.LATE ?? 0, color: "#f59e0b" }, { label: "Absent", value: total.ABSENT ?? 0, color: "#ef4444" }, { label: "Excused", value: total.EXCUSED ?? 0, color: "#818cf8" }]} />}
        </Card>

        <Card title="Weekly attendance by class" className="lg:col-span-2" action={<span className="text-xs text-slate-400">% present or late</span>}>
          <Heatmap rows={classes.map((c) => c.name)} cols={weeks.map(wkLabel)} cell={(r, c) => rate(perWeek.get(`${classes[r].id}|${weeks[c]}`) ?? {})} />
        </Card>
        <Card title="Absence rate by weekday">
          <Columns groups={dowCols} series={[{ name: "Absent", color: "#ff6b57" }]} max={Math.max(8, Math.ceil(Math.max(...dowCols.map((d) => d.values[0])) + 1))} unit="%" />
          <p className="mt-3 text-xs text-slate-500">Share of students absent on each weekday — Mondays and Fridays usually peak.</p>
        </Card>

        <Card title="Attendance by class" flush>
          <div className="p-5"><HBars items={classRates.map(({ c, r }) => ({ label: `Class ${c.name}`, value: r ?? 0, color: tint(r ?? 0) }))} /></div>
        </Card>
        <Card title="Average score per subject">
          {bySubject.length ? <HBars items={bySubject.map((s) => ({ ...s, color: tint(s.value, 70, 60) }))} /> : <Empty title="No published results" />}
        </Card>
        <Card title="Homework completion by subject">
          {hwSubj.length ? <HBars items={hwSubj.map((s) => ({ ...s, color: tint(s.value, 80, 65) }))} /> : <Empty title="No homework in this period" />}
        </Card>

        <Card title="Exam progress by class" className="lg:col-span-2" action={<span className="text-xs text-slate-400">average % per exam</span>}>
          {examNames.length ? <Columns groups={examCols} series={examNames.map((n, i) => ({ name: n, color: ["#a5b4fc", "#4f46e5", "#14b8a6"][i] }))} /> : <Empty title="No published results" />}
        </Card>
        <Card title="Score distribution">
          <Columns groups={dist} series={[{ name: "Marks", color: "#818cf8" }]} max={maxDist} unit="" height={150} />
          <p className="mt-3 text-xs text-slate-500">Number of subject results in each percentage band.</p>
        </Card>

        <Card title="Students needing attention" className="lg:col-span-2" flush>
          {risk.length === 0 ? <Empty title="No students flagged" hint="Everyone is above the attendance and score thresholds." /> : (
            <Table head={["Student", "Class", "Attendance", "Avg score", "Flags"]}>
              {risk.map(({ s, att, acad, absent }) => (
                <tr key={s.id}><td className="td font-medium"><Link className="text-brand-600 hover:underline" href={`/students/${s.id}`}>{s.name}</Link></td><td className="td">{clsName.get(s.classId)}</td>
                  <td className="td tabular-nums">{att == null ? "—" : `${att.toFixed(0)}%`}<span className="ml-1 text-xs text-slate-400">({absent} abs)</span></td><td className="td tabular-nums">{acad == null ? "—" : `${acad.toFixed(0)}%`}</td>
                  <td className="td"><span className="flex flex-wrap gap-1">{att != null && att < 85 && <Badge tone="red">low attendance</Badge>}{acad != null && acad < 45 && <Badge tone="amber">low scores</Badge>}</span></td></tr>
              ))}
            </Table>
          )}
        </Card>
        <Card title="Top performers" flush>
          {top.length === 0 ? <Empty title="No published results" /> : (
            <ol className="divide-y divide-slate-100">{top.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{s.name}<span className="ml-2 text-xs font-normal text-slate-400">{clsName.get(s.classId)}</span></span><b className="tabular-nums">{stuAvg.get(s.id)!.toFixed(1)}%</b></li>))}</ol>
          )}
        </Card>

        <Card title="Homework completion by class" className="lg:col-span-2">
          <Columns groups={hwClass.map((h) => ({ label: h.label, values: [h.v] }))} series={[{ name: "Done", color: "#14b8a6" }]} />
        </Card>
        <Card title="Leave requests">
          <Donut size={150} center={String(lv("APPROVED") + lv("REJECTED") + lv("PENDING"))} sub="requests" segments={[{ label: "Approved", value: lv("APPROVED"), color: "#10b981" }, { label: "Pending", value: lv("PENDING"), color: "#f59e0b" }, { label: "Rejected", value: lv("REJECTED"), color: "#ef4444" }]} />
          <p className="mt-3 text-xs text-slate-500">Since {fmtDate(since)}.</p>
        </Card>
      </div>
    </>
  );
}
