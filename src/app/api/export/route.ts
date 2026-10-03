import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  let s = v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (head: string[], rows: unknown[][]) => "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n";

/** Principal-only CSV export of the school's own data. ?type=students|teachers|guardians|attendance|marks */
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return new Response("Sign in first", { status: 401 });
  const u = await db.user.findUnique({ where: { id: s.userId } });
  if (!u || !u.active || u.role !== "ADMIN" || !u.schoolId) return new Response("Only the principal can export school data", { status: 403 });
  const schoolId = u.schoolId;
  const type = new URL(req.url).searchParams.get("type") ?? "";
  let body: string;
  if (type === "students") {
    const r = await db.student.findMany({ where: { schoolId }, include: { class: true }, orderBy: [{ class: { name: "asc" } }, { rollNo: "asc" }] });
    body = csv(["Class", "Roll", "Admission no", "Name", "Gender", "Date of birth", "Blood group", "Address", "Active"], r.map((x) => [x.class.name, x.rollNo, x.admissionNo, x.name, x.gender, x.dob, x.bloodGroup, x.address, x.active ? "yes" : "no"]));
  } else if (type === "teachers") {
    const r = await db.teacher.findMany({ where: { schoolId }, include: { user: true, homeroom: true, assignments: { include: { subject: true, class: true } } }, orderBy: { employeeNo: "asc" } });
    body = csv(["Employee no", "Name", "Email", "Phone", "Qualification", "Position", "Class teacher of", "Teaches", "Active"], r.map((t) => [t.employeeNo, t.user.name, t.user.email, t.user.phone, t.qualification, t.position, t.homeroom.map((c) => c.name).join("; "), t.assignments.map((a) => `${a.subject.name} (${a.class.name})`).join("; "), t.user.active ? "yes" : "no"]));
  } else if (type === "guardians") {
    const r = await db.guardian.findMany({ where: { student: { schoolId } }, include: { user: true, student: { include: { class: true } } } });
    body = csv(["Parent name", "Email", "Phone", "Child", "Class", "Relation"], r.map((g) => [g.user.name, g.user.email, g.user.phone, g.student.name, g.student.class.name, g.relation]));
  } else if (type === "attendance") {
    const r = await db.attendanceRecord.findMany({ where: { session: { schoolId } }, include: { student: { include: { class: true } }, session: true }, orderBy: [{ session: { date: "desc" } }], take: 200000 });
    body = csv(["Date", "Class", "Student", "Status", "Approval", "Note"], r.map((a) => [a.session.date, a.student.class.name, a.student.name, a.status, a.session.status, a.note]));
  } else if (type === "marks") {
    const [r, subs] = await Promise.all([db.mark.findMany({ where: { exam: { schoolId } }, include: { exam: { include: { class: true } }, student: true }, take: 200000 }), db.subject.findMany({ where: { schoolId } })]);
    const sn = new Map(subs.map((x) => [x.id, x.name]));
    body = csv(["Exam", "Class", "Student", "Subject", "Score", "Max", "Remark"], r.map((m) => [m.exam.name, m.exam.class.name, m.student.name, sn.get(m.subjectId), m.score, m.exam.maxMarks, m.remark]));
  } else return new Response("Unknown export type", { status: 400 });
  await db.auditLog.create({ data: { schoolId, userId: u.id, action: "data_export", entity: type } });
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="edusphere-${type}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
