import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Table, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Schools" };

async function createSchool(fd: FormData) {
  "use server";
  const ctx = await getCtx(); if (ctx.role !== "SUPER_ADMIN") return;
  const name = String(fd.get("name") ?? "").trim(); const code = String(fd.get("code") ?? "").trim().toUpperCase();
  const email = String(fd.get("adminEmail") ?? "").trim().toLowerCase(); const adminName = String(fd.get("adminName") ?? "").trim();
  const pw = String(fd.get("password") ?? "");
  if (name.length < 3 || !/^[A-Z0-9-]{2,12}$/.test(code) || !/^\S+@\S+\.\S+$/.test(email) || adminName.length < 2 || pw.length < 8) return;
  if (await db.user.findUnique({ where: { email } }) || await db.school.findUnique({ where: { code } })) return;
  const year = new Date().getUTCFullYear();
  const s = await db.school.create({ data: { name, code, address: String(fd.get("address") ?? "") || null } });
  await db.academicYear.create({ data: { schoolId: s.id, name: `${year}-${String(year + 1).slice(2)}`, startsOn: new Date(Date.UTC(year, 5, 1)), endsOn: new Date(Date.UTC(year + 1, 2, 31)), current: true } });
  await db.user.create({ data: { schoolId: s.id, email, name: adminName, role: "ADMIN", passwordHash: await bcrypt.hash(pw, 12) } });
  await db.auditLog.create({ data: { userId: ctx.user.id, action: "school_create", entity: s.id } });
  revalidatePath("/schools");
}
async function toggle(id: string) {
  "use server";
  const ctx = await getCtx(); if (ctx.role !== "SUPER_ADMIN") return;
  const s = await db.school.findUnique({ where: { id } }); if (!s) return;
  await db.$transaction([db.school.update({ where: { id }, data: { active: !s.active } }), db.user.updateMany({ where: { schoolId: id }, data: { active: !s.active } })]);
  revalidatePath("/schools");
}

export default async function Schools() {
  const ctx = await getCtx();
  if (ctx.role !== "SUPER_ADMIN") return null;
  const list = await db.school.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { students: true, teachers: true, users: true } } } });
  return (
    <>
      <PageHeader title="Schools" sub="Onboard a school and its first principal account. Each school’s data is fully separate." />
      <Card title="Onboard a school" className="mb-6"><form action={createSchool} className="grid gap-4 sm:grid-cols-3">
        <div><label className="label" htmlFor="n">School name</label><input id="n" name="name" className="input" required /></div><div><label className="label" htmlFor="c">Code</label><input id="c" name="code" className="input" required placeholder="GREEN" /></div><div><label className="label" htmlFor="a">Address</label><input id="a" name="address" className="input" /></div>
        <div><label className="label" htmlFor="an">Principal name</label><input id="an" name="adminName" className="input" required /></div><div><label className="label" htmlFor="ae">Principal email</label><input id="ae" name="adminEmail" type="email" className="input" required /></div><div><label className="label" htmlFor="ap">Initial password (8+)</label><input id="ap" name="password" type="password" minLength={8} className="input" required /></div>
        <div className="sm:col-span-3 text-right"><button className="btn">Create school</button></div></form></Card>
      <Card flush><Table head={["School", "Code", "Students", "Teachers", "Users", "Created", "Status", ""]}>{list.map((s) => (
        <tr key={s.id}><td className="td font-medium">{s.name}</td><td className="td">{s.code}</td><td className="td">{s._count.students}</td><td className="td">{s._count.teachers}</td><td className="td">{s._count.users}</td><td className="td">{fmtDate(s.createdAt)}</td><td className="td"><Badge tone={s.active ? "green" : "red"}>{s.active ? "Active" : "Disabled"}</Badge></td>
          <td className="td"><form action={toggle.bind(null, s.id)}><button className="text-xs text-brand-600 hover:underline">{s.active ? "Disable" : "Enable"}</button></form></td></tr>))}</Table></Card>
    </>
  );
}
