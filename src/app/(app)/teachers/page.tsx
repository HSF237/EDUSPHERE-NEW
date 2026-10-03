import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { can, getCtx } from "@/lib/scope";
import { Card, PageHeader, Table, Empty, Badge } from "@/components/ui";
import { LinkMaker } from "@/components/link-maker";
import { inviteState } from "@/lib/invites";
import { fmtDate } from "@/lib/utils";
import { createResetLink, createTeacherInvite, revokeInvite } from "./invite-actions";

export const metadata = { title: "Teachers" };

async function addTeacher(fd: FormData) {
  "use server";
  const ctx = await getCtx();
  if (!can(ctx, "TEACHERS")) return;
  const name = String(fd.get("name") ?? "").trim(); const email = String(fd.get("email") ?? "").trim().toLowerCase(); const emp = String(fd.get("employeeNo") ?? "").trim();
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !emp) return;
  if (await db.user.findUnique({ where: { email } })) return;
  const u = await db.user.create({ data: { schoolId: ctx.schoolId, email, name, role: "TEACHER", passwordHash: await bcrypt.hash("ChangeMe123!", 12), mustChangePassword: true } });
  await db.teacher.create({ data: { schoolId: ctx.schoolId, userId: u.id, employeeNo: emp, qualification: String(fd.get("qualification") ?? "") || null } });
  revalidatePath("/teachers");
}
async function toggleActive(id: string) {
  "use server";
  const ctx = await getCtx();
  if (!can(ctx, "TEACHERS")) return;
  const u = await db.user.findFirst({ where: { id, schoolId: ctx.schoolId, role: "TEACHER" } });
  if (u) await db.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/teachers");
}

export default async function Teachers() {
  const ctx = await getCtx();
  if (!can(ctx, "TEACHERS")) redirect("/dashboard");
  const list = await db.teacher.findMany({ where: { schoolId: ctx.schoolId }, include: { user: true, homeroom: true, assignments: { include: { subject: true, class: true } } }, orderBy: { employeeNo: "asc" } });
  const invites = await db.invite.findMany({ where: { schoolId: ctx.schoolId, kind: "TEACHER" }, orderBy: { createdAt: "desc" }, take: 15 });
  return (
    <>
      <PageHeader title="Teachers" sub={`${list.length} staff members`} />
      <Card title="Invite teachers with a secret link" className="mb-6">
        <p className="mb-4 text-sm text-slate-600">Create a one-time link and send it to a teacher (WhatsApp, SMS or email). When they open it they enter their name, email, qualification, password and choose their classes and whether they are a class teacher, a subject teacher or both. Each link works once and expires in 7 days.</p>
        <LinkMaker action={createTeacherInvite} label="Create invite link" message={`You’re invited to join our school on EduSphere. Open this link to set up your teacher account:`} />
        {invites.length > 0 && (
          <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2 pr-4">Created</th><th className="py-2 pr-4">Link</th><th className="py-2 pr-4">Status</th><th /></tr></thead><tbody className="divide-y divide-slate-100">
            {invites.map((i) => { const st = inviteState(i); return (
              <tr key={i.id}><td className="py-2 pr-4">{fmtDate(i.createdAt)}</td><td className="py-2 pr-4 font-mono text-xs text-slate-500">…{i.token.slice(-6)}</td><td className="py-2 pr-4"><Badge tone={st === "ok" ? "amber" : st === "used" ? "green" : "slate"}>{st === "ok" ? "Waiting" : st === "used" ? "Used" : st === "expired" ? "Expired" : "Cancelled"}</Badge></td>
                <td className="py-2 text-right">{st === "ok" && <form action={revokeInvite.bind(null, i.id)}><button className="text-xs font-semibold text-red-600 hover:underline">Cancel</button></form>}</td></tr>); })}
          </tbody></table></div>
        )}
      </Card>
      <Card title="Add teacher manually" className="mb-6"><form action={addTeacher} className="grid gap-4 sm:grid-cols-5">
        <div className="sm:col-span-2"><label className="label" htmlFor="tn">Full name</label><input id="tn" name="name" className="input" required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="te">Email</label><input id="te" name="email" type="email" className="input" required /></div>
        <div><label className="label" htmlFor="tm">Employee no.</label><input id="tm" name="employeeNo" className="input" required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="tq">Qualification</label><input id="tq" name="qualification" className="input" /></div>
        <div className="sm:col-span-3 flex items-end justify-end"><button className="btn">Add teacher</button></div></form>
        <p className="mt-2 text-xs text-slate-500">New accounts get the temporary password <code>ChangeMe123!</code>.</p></Card>
      <Card flush>{list.length === 0 ? <Empty title="No teachers yet" /> : (
        <Table head={["Name", "Position", "Class teacher of", "Teaches", "Status", ""]}>{list.map((t) => (
          <tr key={t.id}><td className="td font-medium">{ctx.role === "ADMIN" ? <Link className="text-brand-600 hover:underline" href={`/teachers/${t.id}`}>{t.user.name}</Link> : t.user.name}<div className="text-xs font-normal text-slate-500">{t.user.email} · {t.employeeNo}</div></td><td className="td">{t.position ? <Badge tone="indigo">{t.position}</Badge> : <span className="text-slate-400">—</span>}{t.permissions.length > 0 && <div className="mt-1 text-[11px] text-slate-500">{t.permissions.length} extra access</div>}</td><td className="td">{t.homeroom.map((c) => c.name).join(", ") || "—"}</td>
            <td className="td text-xs">{t.assignments.map((a) => `${a.subject.name} (${a.class.name})`).join(", ") || "—"}</td><td className="td"><Badge tone={t.user.active ? "green" : "red"}>{t.user.active ? "Active" : "Disabled"}</Badge></td>
            <td className="td whitespace-nowrap">{ctx.role === "ADMIN" && <Link href={`/teachers/${t.id}`} className="mr-3 text-xs font-semibold text-brand-600 hover:underline">Position & access</Link>}<form className="inline" action={toggleActive.bind(null, t.userId)}><button className="text-xs text-brand-600 hover:underline">{t.user.active ? "Disable" : "Enable"}</button></form><div className="mt-1"><LinkMaker compact action={createResetLink.bind(null, t.userId)} label="Password reset link" message={`Reset your EduSphere password here:`} /></div></td></tr>))}</Table>)}</Card>
    </>
  );
}
