"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { notify } from "@/lib/scope";
import { addMonths } from "@/lib/billing";
import { createSession, getSession } from "@/lib/session";
import { DOMAIN_RE, hasCustom } from "@/lib/custom";
import { codeMatches, isUnlocked, lockOwner, ownerEmails, requireOwner, requireOwnerUser, tooManyFails, unlockOwner } from "@/lib/owner";

export async function unlockAction(fd: FormData) {
  const u = await requireOwnerUser();
  if (await tooManyFails(u.id)) redirect("/owner?error=" + encodeURIComponent("Too many wrong codes. Try again in 15 minutes."));
  if (!codeMatches(String(fd.get("code") ?? ""))) {
    await db.auditLog.create({ data: { userId: u.id, action: "owner_code_fail" } });
    redirect("/owner?error=" + encodeURIComponent("That code isn't right."));
  }
  await unlockOwner(u.id);
  await db.auditLog.create({ data: { userId: u.id, action: "owner_unlock" } });
  redirect("/owner");
}

export async function lockAction() {
  const u = await requireOwnerUser();
  await lockOwner();
  await db.auditLog.create({ data: { userId: u.id, action: "owner_lock" } });
  redirect("/owner");
}

function compFields(fd: FormData) {
  const mode = String(fd.get("mode") ?? "forever");
  const months = Math.min(120, Math.max(1, parseInt(String(fd.get("months") ?? "3"), 10) || 3));
  const note = String(fd.get("note") ?? "").trim().slice(0, 120) || null;
  if (mode === "off") return { comped: false, compedUntil: null, compNote: null };
  return { comped: true, compedUntil: mode === "months" ? addMonths(new Date(), months) : null, compNote: note ?? (mode === "months" ? `Free for ${months} months` : "Free forever") };
}

export async function setComp(schoolId: string, fd: FormData) {
  const u = await requireOwner();
  const data = compFields(fd);
  await db.school.update({ where: { id: schoolId }, data });
  await db.auditLog.create({ data: { schoolId, userId: u.id, action: "owner_comp", detail: data.comped ? (data.compedUntil ? `until ${data.compedUntil.toISOString().slice(0, 10)}` : "forever") : "off" } });
  revalidatePath("/owner");
}

/** Grant, extend or remove the Custom school add-on, and set the school's own web address. */
export async function setCustom(schoolId: string, fd: FormData) {
  const u = await requireOwner();
  const s = await db.school.findUnique({ where: { id: schoolId } });
  if (!s) return;
  const mode = String(fd.get("mode") ?? "keep");
  const domain = String(fd.get("domain") ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const bad = (m: string): never => redirect("/owner?error=" + encodeURIComponent(m));
  const data: { customUntil?: Date | null; customDomain?: string | null } = {};
  if (mode === "year") data.customUntil = addMonths(hasCustom(s) ? s.customUntil! : new Date(), 12);
  else if (mode === "forever") data.customUntil = new Date("2099-01-01T00:00:00Z");
  else if (mode === "off") data.customUntil = null;
  if (domain !== (s.customDomain ?? "")) {
    if (domain && !DOMAIN_RE.test(domain)) bad("That doesn't look like a web address (e.g. app.yourschool.edu.in).");
    if (domain && (await db.school.findFirst({ where: { customDomain: domain, id: { not: schoolId } } }))) bad("That address is already used by another school.");
    data.customDomain = domain || null;
  }
  if (Object.keys(data).length) {
    await db.school.update({ where: { id: schoolId }, data });
    await db.auditLog.create({ data: { schoolId, userId: u.id, action: "owner_custom", detail: `${mode}${data.customDomain !== undefined ? ` domain=${data.customDomain ?? "none"}` : ""}` } });
  }
  revalidatePath("/owner");
  redirect("/owner?ok=" + encodeURIComponent(`${s.name}: custom school settings saved.` + (data.customDomain ? ` Now add ${data.customDomain} to your hosting and point its DNS.` : "")));
}

export async function createFreeSchool(fd: FormData) {
  const u = await requireOwner();
  const name = String(fd.get("name") ?? "").trim(); const code = String(fd.get("code") ?? "").trim().toUpperCase();
  const email = String(fd.get("adminEmail") ?? "").trim().toLowerCase(); const adminName = String(fd.get("adminName") ?? "").trim();
  const pw = String(fd.get("password") ?? "");
  const bad = (m: string): never => redirect(`/owner?error=${encodeURIComponent(m)}`);
  if (name.length < 3) bad("School name must be at least 3 characters.");
  if (!/^[A-Z0-9-]{2,12}$/.test(code)) bad("Code must be 2-12 letters, numbers or dashes.");
  if (adminName.length < 2) bad("Enter the principal's name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) bad("Enter a valid principal email.");
  if (pw.length < 8) bad("Password must be at least 8 characters.");
  if (await db.user.findUnique({ where: { email } })) bad("That email already has an account.");
  if (await db.school.findUnique({ where: { code } })) bad("That school code is already used.");
  const year = new Date().getUTCFullYear();
  const s = await db.school.create({ data: { name, code, address: String(fd.get("address") ?? "") || null, ...compFields(fd) } });
  await db.academicYear.create({ data: { schoolId: s.id, name: `${year}-${String(year + 1).slice(2)}`, startsOn: new Date(Date.UTC(year, 5, 1)), endsOn: new Date(Date.UTC(year + 1, 2, 31)), current: true } });
  await db.user.create({ data: { schoolId: s.id, email, name: adminName, role: "ADMIN", passwordHash: await bcrypt.hash(pw, 12), mustChangePassword: true } });
  await db.auditLog.create({ data: { schoolId: s.id, userId: u.id, action: "owner_create_free_school", entity: s.id } });
  revalidatePath("/owner");
  redirect("/owner?ok=" + encodeURIComponent(`${name} created (free). Share the principal login with them.`));
}

/** View-only support session as the school's principal. Audited, 1 hour, and the principal is told. */
export async function enterSupport(schoolId: string) {
  const u = await requireOwner();
  const admin = await db.user.findFirst({ where: { schoolId, role: "ADMIN", active: true }, orderBy: { createdAt: "asc" } });
  if (!admin) redirect("/owner?error=" + encodeURIComponent("That school has no active principal account."));
  await createSession({ userId: admin.id, role: admin.role, schoolId, name: admin.name, email: admin.email, sup: u.id }, { hours: 1 });
  await db.auditLog.create({ data: { schoolId, userId: u.id, action: "support_enter", entity: admin.id } });
  await notify(schoolId, [admin.id], "Support session", "EduSphere support opened your school in view-only mode to help you. No changes can be made in this mode.");
  redirect("/dashboard");
}

export async function exitSupport() {
  const s = await getSession();
  if (!s?.sup) redirect("/dashboard");
  const owner = await db.user.findUnique({ where: { id: s.sup } });
  await db.auditLog.create({ data: { schoolId: s.schoolId, userId: s.sup, action: "support_exit" } });
  if (!owner || !owner.active || owner.role !== "SUPER_ADMIN" || !ownerEmails().includes(owner.email.toLowerCase())) redirect("/login");
  await createSession({ userId: owner.id, role: owner.role, schoolId: null, name: owner.name, email: owner.email });
  redirect("/owner");
}
