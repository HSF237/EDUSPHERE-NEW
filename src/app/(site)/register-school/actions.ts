"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

type State = { error?: string } | undefined;
const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function registerSchool(_: State, fd: FormData): Promise<State> {
  if (process.env.ALLOW_SCHOOL_SIGNUP === "false") return { error: "School sign-up is closed. Please contact us to get started." };
  if (str(fd, "website")) return { error: "Something went wrong. Please try again." }; // honeypot
  const name = str(fd, "school", 120), address = str(fd, "address", 200), pname = str(fd, "name", 100), email = str(fd, "email", 200).toLowerCase(), phone = str(fd, "phone", 30);
  const password = String(fd.get("password") ?? ""), confirm = String(fd.get("confirm") ?? "");
  if (name.length < 3) return { error: "Enter your school’s name (at least 3 characters)." };
  if (pname.length < 2) return { error: "Enter the principal’s name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Choose a password of at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don’t match." };
  if (fd.get("agree") !== "on") return { error: "Please accept the Terms and Privacy Policy to continue." };
  if (await db.user.findUnique({ where: { email } })) return { error: "That email already has an account. Sign in instead." };
  const recent = await db.auditLog.count({ where: { action: "school_signup", createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } } });
  if (recent >= 20) return { error: "We’re getting a lot of sign-ups right now. Please try again in a little while." };

  const base = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "SCH";
  let code = base;
  for (let i = 0; i < 8 && (await db.school.findUnique({ where: { code } })); i++) code = `${base}${Math.floor(100 + Math.random() * 900)}`;
  if (await db.school.findUnique({ where: { code } })) return { error: "Couldn’t create a unique school code. Please try again." };

  const year = new Date().getUTCFullYear();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.$transaction(async (tx) => {
    const s = await tx.school.create({ data: { name, code, address: address || null, email, phone: phone || null } });
    await tx.academicYear.create({ data: { schoolId: s.id, name: `${year}-${String(year + 1).slice(2)}`, startsOn: new Date(Date.UTC(year, 5, 1)), endsOn: new Date(Date.UTC(year + 1, 2, 31)), current: true } });
    const u = await tx.user.create({ data: { schoolId: s.id, email, name: pname, phone: phone || null, role: "ADMIN", passwordHash } });
    await tx.auditLog.create({ data: { schoolId: s.id, userId: u.id, action: "school_signup", entity: s.id } });
    return u;
  });
  await createSession({ userId: user.id, role: user.role, schoolId: user.schoolId, name: user.name, email: user.email });
  redirect("/dashboard");
}
