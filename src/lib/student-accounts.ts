import bcrypt from "bcryptjs";
import { db } from "./db";
import { AgentError } from "./ai/policy";
import { inviteState } from "./invites";

/** One-use principal invitation; account and link are claimed in one transaction. */
export async function registerStudent(token: string, email: string, password: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token) || !/^\S+@\S+\.\S+$/.test(email) || email.length > 200 || password.length < 8 || password.length > 200) throw new AgentError("Use a valid invitation, email and password of 8–200 characters.");
  const passwordHash = await bcrypt.hash(password, 12);
  return db.$transaction(async tx => {
    const inv = await tx.invite.findUnique({ where: { token }, include: { school: true, student: true } });
    if (!inv || inv.kind !== "STUDENT" || inviteState(inv) !== "ok" || !inv.school.active || !inv.student?.active || inv.student.schoolId !== inv.schoolId || inv.student.userId) throw new AgentError("This student invitation is no longer available. Ask your principal for help.");
    const claim = await tx.invite.updateMany({ where: { id: inv.id, kind: "STUDENT", uses: 0, maxUses: 1, revokedAt: null, expiresAt: { gt: new Date() } }, data: { uses: 1 } });
    if (claim.count !== 1) throw new AgentError("This invitation has already been used.");
    const user = await tx.user.create({ data: { schoolId: inv.schoolId, name: inv.student.name, email: email.toLowerCase(), passwordHash, role: "STUDENT" } });
    const linked = await tx.student.updateMany({ where: { id: inv.student.id, schoolId: inv.schoolId, userId: null, active: true, class: { schoolId: inv.schoolId } }, data: { userId: user.id } });
    if (linked.count !== 1) throw new AgentError("This student account has already been claimed.");
    await tx.auditLog.create({ data: { schoolId: inv.schoolId, userId: user.id, action: "student_join", entity: inv.student.id } });
    return user;
  });
}
