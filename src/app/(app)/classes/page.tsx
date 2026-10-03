import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { can, getCtx } from "@/lib/scope";
import { Card, PageHeader, Table, Empty } from "@/components/ui";

export const metadata = { title: "Classes & subjects" };

async function addClass(fd: FormData) {
  "use server";
  const ctx = await getCtx(); if (!can(ctx, "CLASSES")) return;
  const grade = Number(fd.get("grade")); const section = String(fd.get("section") ?? "").trim().toUpperCase();
  if (!grade || !section) return;
  const year = await db.academicYear.findFirst({ where: { schoolId: ctx.schoolId, current: true } });
  if (!year) return;
  const ct = String(fd.get("classTeacherId") ?? "");
  await db.class.create({ data: { schoolId: ctx.schoolId, yearId: year.id, grade, section, name: `${grade}${section}`, roomNo: String(fd.get("roomNo") ?? "") || null, classTeacherId: ct || null } }).catch(() => {});
  revalidatePath("/classes");
}
async function addSubject(fd: FormData) {
  "use server";
  const ctx = await getCtx(); if (!can(ctx, "CLASSES")) return;
  const name = String(fd.get("name") ?? "").trim(); const code = String(fd.get("code") ?? "").trim().toUpperCase();
  if (!name || !code) return;
  await db.subject.create({ data: { schoolId: ctx.schoolId, name, code } }).catch(() => {});
  revalidatePath("/classes");
}
async function assign(fd: FormData) {
  "use server";
  const ctx = await getCtx(); if (!can(ctx, "CLASSES")) return;
  const [classId, subjectId, teacherId] = ["classId", "subjectId", "teacherId"].map((k) => String(fd.get(k) ?? ""));
  const [c, s, t] = await Promise.all([db.class.findFirst({ where: { id: classId, schoolId: ctx.schoolId } }), db.subject.findFirst({ where: { id: subjectId, schoolId: ctx.schoolId } }), db.teacher.findFirst({ where: { id: teacherId, schoolId: ctx.schoolId } })]);
  if (!c || !s || !t) return;
  await db.classSubject.upsert({ where: { classId_subjectId: { classId, subjectId } }, create: { classId, subjectId, teacherId }, update: { teacherId } });
  revalidatePath("/classes");
}

export default async function Classes() {
  const ctx = await getCtx();
  if (!can(ctx, "CLASSES")) redirect("/dashboard");
  const [classes, subjects, teachers] = await Promise.all([
    db.class.findMany({ where: { schoolId: ctx.schoolId }, include: { classTeacher: { include: { user: true } }, _count: { select: { students: true } }, subjects: { include: { subject: true, teacher: { include: { user: true } } } } }, orderBy: { name: "asc" } }),
    db.subject.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { name: "asc" } }),
    db.teacher.findMany({ where: { schoolId: ctx.schoolId }, include: { user: true }, orderBy: { employeeNo: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Classes & subjects" sub="Set up classes, subjects and who teaches what." />
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Add class"><form action={addClass} className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="cg">Grade</label><input id="cg" name="grade" type="number" min={1} max={12} className="input" required /></div><div><label className="label" htmlFor="cs">Section</label><input id="cs" name="section" maxLength={2} className="input" required /></div></div>
          <div><label className="label" htmlFor="cr">Room</label><input id="cr" name="roomNo" className="input" /></div>
          <div><label className="label" htmlFor="ct">Class teacher</label><select id="ct" name="classTeacherId" className="input"><option value="">—</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}</select></div><button className="btn">Add class</button></form></Card>
        <Card title="Add subject"><form action={addSubject} className="space-y-3"><div><label className="label" htmlFor="sbn">Name</label><input id="sbn" name="name" className="input" required /></div><div><label className="label" htmlFor="sbc">Code</label><input id="sbc" name="code" maxLength={6} className="input" required /></div><button className="btn">Add subject</button></form></Card>
        <Card title="Assign subject teacher"><form action={assign} className="space-y-3">
          <div><label className="label" htmlFor="ac">Class</label><select id="ac" name="classId" className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label" htmlFor="as">Subject</label><select id="as" name="subjectId" className="input">{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="label" htmlFor="at">Teacher</label><select id="at" name="teacherId" className="input">{teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}</select></div><button className="btn">Assign</button></form></Card>
      </div>
      <Card title="Classes" flush>{classes.length === 0 ? <Empty title="No classes yet" /> : (
        <Table head={["Class", "Room", "Class teacher", "Students", "Subjects & teachers"]}>{classes.map((c) => (
          <tr key={c.id}><td className="td font-medium">{c.name}</td><td className="td">{c.roomNo ?? "—"}</td><td className="td">{c.classTeacher?.user.name ?? "—"}</td><td className="td">{c._count.students}</td><td className="td text-xs">{c.subjects.map((s) => `${s.subject.name}: ${s.teacher.user.name}`).join(" · ") || "—"}</td></tr>))}</Table>)}</Card>
    </>
  );
}
