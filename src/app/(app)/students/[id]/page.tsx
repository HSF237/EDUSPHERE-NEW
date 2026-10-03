import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCtx, scopeClassIds } from "@/lib/scope";
import { Card, PageHeader, Stat, Table, Badge } from "@/components/ui";
import { fmtDate, pct } from "@/lib/utils";
import { LinkMaker } from "@/components/link-maker";
import { createResetLink } from "../../teachers/invite-actions";
import { parentLink } from "../invite-actions";
import { UploadForm } from "@/components/upload-form";
import { addStudentDoc, deleteStudentDoc, uploadStudentPhoto } from "../file-actions";
import { prettySize } from "@/lib/files";
import { ACCEPT_ALL, ACCEPT_IMAGE } from "@/lib/fileTypes";
import Link from "next/link";

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx();
  if (ctx.role === "PARENT") notFound();
  const { id } = await params;
  const s = await db.student.findFirst({ where: { id, schoolId: ctx.schoolId, classId: { in: await scopeClassIds(ctx, "STUDENTS") } }, include: { class: true, guardians: { include: { user: true } } } });
  if (!s) notFound();
  const [grp, marks, leaves] = await Promise.all([
    db.attendanceRecord.groupBy({ by: ["status"], where: { studentId: s.id, session: { status: "APPROVED" } }, _count: true }),
    db.mark.findMany({ where: { studentId: s.id }, include: { exam: true } }),
    db.leaveRequest.findMany({ where: { studentId: s.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const docs = await db.file.findMany({ where: { studentId: s.id, schoolId: ctx.schoolId, NOT: { id: s.photoFileId ?? "" } }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, size: true, createdAt: true } });
  const subjects = new Map((await db.subject.findMany({ where: { schoolId: ctx.schoolId } })).map((x) => [x.id, x.name]));
  const total = grp.reduce((a, g) => a + g._count, 0); const pres = grp.filter((g) => g.status === "PRESENT" || g.status === "LATE").reduce((a, g) => a + g._count, 0);
  const g = (k: string) => grp.find((x) => x.status === k)?._count ?? 0;
  return (
    <>
      <PageHeader art="students" title={s.name} sub={`Class ${s.class.name} · Roll ${s.rollNo} · ${s.admissionNo}`} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4"><Stat label="Attendance" value={`${pct(pres, total)}%`} tone="indigo" /><Stat label="Days absent" value={g("ABSENT")} tone="red" /><Stat label="Days late" value={g("LATE")} tone="amber" /><Stat label="Date of birth" value={s.dob ? fmtDate(s.dob) : "—"} /></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Guardians">{s.guardians.length === 0 ? <p className="text-sm text-slate-500">No parent account linked.</p> : s.guardians.map((x) => <div key={x.id} className="mb-3 text-sm"><b>{x.user.name}</b> · {x.user.email}<div className="mt-1"><LinkMaker compact action={createResetLink.bind(null, x.userId)} label="Password reset link" message="Reset your EduSphere password here:" /></div></div>)}<div className="mt-3 border-t border-slate-100 pt-3"><LinkMaker compact action={parentLink.bind(null, s.id)} label="Create parent access link" message={`Open this link to see ${s.name}’s school updates on EduSphere:`} /></div></Card>
        <Card title="Photo & documents">
          <div className="flex items-start gap-4">
            {s.photoFileId ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/files/${s.photoFileId}`} alt={`${s.name}`} className="h-24 w-20 rounded-xl object-cover ring-1 ring-slate-200" /> : <div className="grid h-24 w-20 place-items-center rounded-xl bg-slate-100 text-xs text-slate-400">No photo</div>}
            <div className="min-w-0 flex-1 space-y-3"><UploadForm action={uploadStudentPhoto.bind(null, s.id)} label="Student photo (used on ID cards and report cards)" button="Upload photo" accept={ACCEPT_IMAGE} />
              <Link className="text-xs font-semibold text-brand-600 hover:underline" href={`/students/ids?student=${s.id}`}>Print ID card</Link></div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            {docs.length === 0 ? <p className="mb-3 text-sm text-slate-500">No documents yet (certificates, transfer certificate, medical forms…).</p> : <ul className="mb-3 divide-y divide-slate-100 text-sm">{docs.map((d) => <li key={d.id} className="flex items-center justify-between gap-2 py-2"><a className="min-w-0 truncate font-medium text-brand-600 hover:underline" href={`/api/files/${d.id}`} target="_blank" rel="noreferrer">📎 {d.name}</a><span className="flex shrink-0 items-center gap-3 text-xs text-slate-500">{prettySize(d.size)}<form action={deleteStudentDoc.bind(null, s.id, d.id)}><button className="text-red-600 hover:underline">Delete</button></form></span></li>)}</ul>}
            <UploadForm action={addStudentDoc.bind(null, s.id)} label="Add a document (PDF, image, Word…)" button="Add document" accept={ACCEPT_ALL} />
          </div>
        </Card>
        <Card title="Recent leave">{leaves.length === 0 ? <p className="text-sm text-slate-500">None.</p> : leaves.map((l) => <div key={l.id} className="flex justify-between text-sm"><span>{fmtDate(l.fromDate)} – {fmtDate(l.toDate)}</span><Badge tone={l.status === "APPROVED" ? "green" : l.status === "REJECTED" ? "red" : "amber"}>{l.status.toLowerCase()}</Badge></div>)}</Card>
        <Card title="Marks" className="lg:col-span-2" flush>
          {marks.length === 0 ? <p className="p-5 text-sm text-slate-500">No marks recorded.</p> : <Table head={["Exam", "Subject", "Score", "Max"]}>{marks.map((m) => <tr key={m.id}><td className="td">{m.exam.name}</td><td className="td">{subjects.get(m.subjectId)}</td><td className="td font-medium">{m.score}</td><td className="td">{m.exam.maxMarks}</td></tr>)}</Table>}
        </Card>
      </div>
    </>
  );
}
