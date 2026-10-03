import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { PERM_KEYS, PERMS, type Perm } from "@/lib/perms";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { AccessForm } from "./access-form";

export const metadata = { title: "Teacher access" };

async function saveAccess(teacherId: string, fd: FormData) {
  "use server";
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN") return;
  const t = await db.teacher.findFirst({ where: { id: teacherId, schoolId: ctx.schoolId } });
  if (!t) return;
  const position = String(fd.get("position") ?? "").trim().slice(0, 60) || null;
  const perms = [...new Set(fd.getAll("perm").map(String))].filter((p): p is Perm => PERM_KEYS.includes(p as Perm));
  const want = new Set(fd.getAll("homeroom").map(String));
  const classes = await db.class.findMany({ where: { schoolId: ctx.schoolId }, select: { id: true, classTeacherId: true } });
  await db.$transaction([
    db.teacher.update({ where: { id: teacherId }, data: { position, permissions: perms } }),
    ...classes.filter((c) => want.has(c.id) && c.classTeacherId !== teacherId).map((c) => db.class.update({ where: { id: c.id }, data: { classTeacherId: teacherId } })),
    ...classes.filter((c) => !want.has(c.id) && c.classTeacherId === teacherId).map((c) => db.class.update({ where: { id: c.id }, data: { classTeacherId: null } })),
    db.auditLog.create({ data: { schoolId: ctx.schoolId, userId: ctx.user.id, action: "teacher_access", entity: teacherId } }),
  ]);
  revalidatePath("/teachers"); revalidatePath(`/teachers/${teacherId}`);
}

async function addAssignment(teacherId: string, fd: FormData) {
  "use server";
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN") return;
  const classId = String(fd.get("classId") ?? ""); const subjectId = String(fd.get("subjectId") ?? "");
  const [c, s, t] = await Promise.all([db.class.findFirst({ where: { id: classId, schoolId: ctx.schoolId } }), db.subject.findFirst({ where: { id: subjectId, schoolId: ctx.schoolId } }), db.teacher.findFirst({ where: { id: teacherId, schoolId: ctx.schoolId } })]);
  if (!c || !s || !t) return;
  await db.classSubject.upsert({ where: { classId_subjectId: { classId, subjectId } }, create: { classId, subjectId, teacherId }, update: { teacherId } });
  revalidatePath(`/teachers/${teacherId}`);
}

async function removeAssignment(teacherId: string, id: string) {
  "use server";
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN") return;
  await db.classSubject.deleteMany({ where: { id, teacherId, class: { schoolId: ctx.schoolId } } });
  revalidatePath(`/teachers/${teacherId}`);
}

export default async function TeacherAccess({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN") redirect("/dashboard");
  const { id } = await params;
  const t = await db.teacher.findFirst({ where: { id, schoolId: ctx.schoolId }, include: { user: true, homeroom: true, assignments: { include: { subject: true, class: true }, orderBy: { class: { name: "asc" } } } } });
  if (!t) notFound();
  const [classes, subjects] = await Promise.all([
    db.class.findMany({ where: { schoolId: ctx.schoolId }, include: { classTeacher: { include: { user: true } } }, orderBy: [{ grade: "asc" }, { section: "asc" }] }),
    db.subject.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { name: "asc" } }),
  ]);
  const classOnly = t.homeroom.length > 0;
  const subjectClasses = new Set(t.assignments.map((a) => a.classId));
  const perms = t.permissions.filter((p): p is Perm => PERM_KEYS.includes(p as Perm));
  return (
    <>
      <PageHeader title={t.user.name} sub={`${t.user.email} · Employee ${t.employeeNo}`} art="teachers">
        <Link href="/teachers" className="btn-ghost">← All teachers</Link>
        {t.position && <Badge tone="indigo">{t.position}</Badge>}
      </PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Class teacher of" value={t.homeroom.length ? t.homeroom.map((c) => c.name).join(", ") : "—"} icon="users" tone="green" />
        <Stat label="Subject classes" value={subjectClasses.size} hint={`${t.assignments.length} subject assignments`} icon="book" />
        <div className="col-span-2 sm:col-span-1"><Stat label="Extra access" value={`${perms.length}/${PERMS.length}`} tone="indigo" icon="shield" hint={perms.length ? undefined : "Standard teacher"} /></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Position & access" className="lg:col-span-3">
          <AccessForm action={saveAccess.bind(null, t.id)} position={t.position ?? ""} perms={perms} mine={t.homeroom.map((c) => c.id)} classes={classes.map((c) => ({ id: c.id, name: c.name, current: c.classTeacher && c.classTeacherId !== t.id ? c.classTeacher.user.name : null }))} />
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card title="What this teacher sees">
            <ul className="space-y-3 text-sm text-slate-600">
              <li><b className="text-slate-800">{classOnly ? "Class teacher workspace" : "Subject teacher workspace"}</b><br />{classOnly ? "In their own class: attendance, leave, class diary, students, homework, exams, discussed portions." : "Exams & marks, discussed portions, homework and timetable for the classes they teach."}</li>
              {classOnly && t.assignments.length > 0 && <li><b className="text-slate-800">Also a subject teacher</b><br />A switcher at the top lets them move between their class-teacher class and the classes where they only teach a subject — the interface changes with each.</li>}
              {perms.length > 0 && <li><b className="text-slate-800">Extra access</b><br />{perms.map((p) => PERMS.find((x) => x.key === p)?.label).join(" · ")}</li>}
            </ul>
          </Card>
          <Card title="Subjects taught" flush>
            {t.assignments.length === 0 ? <p className="p-5 text-sm text-slate-500">No subjects assigned yet.</p> : (
              <ul className="divide-y divide-slate-100">{t.assignments.map((a) => (
                <li key={a.id} className="flex min-h-[48px] items-center justify-between gap-3 px-5 py-2 text-sm"><span><b>{a.subject.name}</b> <span className="text-slate-500">· Class {a.class.name}</span></span>
                  <form action={removeAssignment.bind(null, t.id, a.id)}><button className="text-xs text-red-600 hover:underline">Remove</button></form></li>
              ))}</ul>
            )}
            <form action={addAssignment.bind(null, t.id)} className="grid gap-2 border-t border-slate-100 p-4 sm:grid-cols-3">
              <select name="classId" className="input" aria-label="Class">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select name="subjectId" className="input" aria-label="Subject">{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <button className="btn">Assign</button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
