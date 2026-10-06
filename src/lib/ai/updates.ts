import type { Prisma } from "@prisma/client";
import type { Actor } from "./runtime";
import { AgentError, localDay, utcDay } from "./policy";

export type AssistantUpdate = { id: string; text: string; prompt: string; label: string; href: string };
export type PersonalUpdates = { date: string; updates: AssistantUpdate[] };

/** Re-resolve identities and scope at read time. Client IDs/history never grant access. */
async function personalScope(tx: Prisma.TransactionClient, actor: Actor) {
  const user = await tx.user.findFirst({ where: { id: actor.user.id, schoolId: actor.schoolId, active: true, role: actor.role }, include: { school: true, teacher: true } });
  if (!user?.school?.active || user.mustChangePassword || actor.support || actor.role === "SUPER_ADMIN") throw new AgentError("Your account changed. Please sign in again.");
  let classIds: string[] = [], studentIds: string[] = [], students: {id:string;classId:string}[] = [];
  if (actor.role === "TEACHER" && user.teacher) {
    classIds = (await tx.class.findMany({ where: { schoolId: actor.schoolId, year: { current: true }, OR: [{ classTeacherId: user.teacher.id }, { subjects: { some: { teacherId: user.teacher.id } } }] }, select: { id: true } })).map(c => c.id);
  } else if (actor.role === "STUDENT") {
    const s = await tx.student.findFirst({ where: { schoolId: actor.schoolId, userId: user.id, active: true, class: { schoolId: actor.schoolId } }, select: { id: true, classId: true } });
    if (!s) throw new AgentError("Your student account is no longer linked to an active student.");
    students = [s]; studentIds = [s.id]; classIds = [s.classId];
  } else if (actor.role === "PARENT") {
    const rows = await tx.guardian.findMany({ where: { userId: user.id, student: { schoolId: actor.schoolId, active: true, class: { schoolId: actor.schoolId } } }, select: { studentId: true, student: { select: { classId: true } } } });
    students = rows.map(r=>({id:r.studentId,classId:r.student.classId}));
    studentIds = rows.map(r => r.studentId); classIds = [...new Set(rows.map(r => r.student.classId))];
  }
  return { user, classIds, studentIds, students, timezone: user.school.timezone };
}

export async function personalUpdates(tx: Prisma.TransactionClient, actor: Actor, now = new Date()): Promise<PersonalUpdates> {
  const scope = await personalScope(tx, actor), day = localDay(now, scope.timezone), date = utcDay(day);
  const updates: AssistantUpdate[] = [];
  if (actor.role === "ADMIN" || actor.role === "TEACHER") {
    const [absences, subs, slots] = await Promise.all([
      tx.teacherAvailability.findMany({ where: { schoolId: actor.schoolId, date, kind: "ABSENT", teacher: { schoolId: actor.schoolId, user: { active: true, schoolId: actor.schoolId, role: "TEACHER" } }, ...(actor.role === "TEACHER" ? { OR: [{ teacherId: scope.user.teacher?.id ?? "none" }, { teacher: { OR: [{ homeroom: { some: { id: { in: scope.classIds } } } }, { assignments: { some: { classId: { in: scope.classIds } } } }] } }] } : {}) }, select: { id: true, teacherId: true, reason: true, teacher: { select: { user: { select: { name: true } } } } }, orderBy: { id: "asc" }, take: 10 }),
      tx.substitute.findMany({ where: { schoolId: actor.schoolId, date }, select: { slotId: true } }),
      tx.timetableSlot.findMany({ where: { schoolId: actor.schoolId, day: (date.getUTCDay() + 6) % 7, class: { schoolId: actor.schoolId, year: { current: true } } }, select: { id: true, teacherId: true } }),
    ]);
    const covered = new Set(subs.map(s => s.slotId));
    for (const a of absences) {
      const name = a.teacher.user.name, uncovered = slots.filter(s => s.teacherId === a.teacherId && !covered.has(s.id)).length;
      if (actor.role === "ADMIN") updates.push({ id: `absence:${a.id}`, text: `${name} is recorded absent today. ${uncovered ? `${uncovered} lesson${uncovered === 1 ? " needs" : "s need"} substitute coverage. Can I help you prepare a plan?` : "No uncovered timetable lessons remain."}`, prompt: `${name} is absent on ${day}. Prepare suitable substitute coverage for principal approval.`, label: uncovered ? "Plan substitutes" : "Review absence", href: "/copilot" });
      else if(a.teacherId === scope.user.teacher?.id) updates.push({id:`absence:${a.id}`,text:`You are recorded absent today.${a.reason?.trim()?"":" No reason is recorded in EduSphere."} Would you like help drafting a note to your principal?`,prompt:`Help me draft a polite private note to my principal about my recorded absence on ${day}. Ask me for the reason; do not invent one or send the message.`,label:"Draft a note",href:"/messages"});
      else updates.push({ id: `absence:${a.id}`, text: `${name} is recorded absent today.${a.reason?.trim() ? "" : " No reason is recorded in EduSphere."} Would you like help drafting a polite check-in message?`, prompt: `Help me draft a polite private check-in message to ${name}, who is recorded absent on ${day}. Do not assume why they are absent or send the message.`, label: "Draft a message", href: "/messages" });
    }
    if (actor.role === "ADMIN") {
      const count = await tx.aiProposal.count({ where: { schoolId: actor.schoolId, userId: actor.user.id, status: "PENDING", expiresAt: { gt: now } } });
      if (count) updates.push({ id: "approvals", text: `${count} proposed school change${count === 1 ? " is" : "s are"} waiting for your approval.`, prompt: "Help me review my pending school action previews.", label: "Review previews", href: "/copilot" });
    }
  } else {
    const homework = await tx.homework.findMany({ where: { schoolId: actor.schoolId, classId: { in: scope.classIds }, class: { schoolId: actor.schoolId }, status: "ACTIVE", subject: {schoolId:actor.schoolId}, OR: [{ dueOn: { gte: date } }, { assignedOn: { gte: new Date(+date - 2 * 86400000) } }] }, select: { id: true, classId: true, title: true, assignedOn: true, dueOn: true, subject: { select: { name: true } }, submissions: { where: { studentId: { in: scope.studentIds } }, select: { studentId: true, done: true } } }, orderBy: [{ assignedOn: "desc" }, { id: "asc" }], take: 30 });
    for (const h of homework) {
      const students = scope.students.filter(s=>s.classId===h.classId);
      if (students.length && students.every(student => h.submissions.some(s => s.studentId === student.id && s.done))) continue;
      const postedToday = localDay(h.assignedOn, scope.timezone) === day;
      if (!postedToday && h.dueOn < date) continue;
      updates.push({ id: `homework:${h.id}`, text: `${postedToday ? "Your teacher posted" : "You have pending"} ${h.subject.name} homework${postedToday ? " today" : ""}: ${h.title}. Would you like help working through it?`, prompt: `Read my authorized homework with ID ${h.id} and help me understand it step by step. Ask what I have tried before giving hints.`, label: "Help with homework", href: "/homework" });
      if (updates.length >= 5) break;
    }
  }
  return { date: day, updates: updates.slice(0, 6) };
}

export async function scopedHomework(tx: Prisma.TransactionClient, actor: Actor, homeworkId: string) {
  const scope = await personalScope(tx, actor);
  const h = await tx.homework.findFirst({ where: { id: homeworkId, schoolId: actor.schoolId, class: { schoolId: actor.schoolId }, ...(actor.role === "ADMIN" ? {} : { classId: { in: scope.classIds } }) }, select: { id: true, title: true, description: true, dueOn: true, status: true, class: { select: { name: true } }, subject: { select: { name: true, schoolId: true } } } });
  if (!h || h.subject.schoolId !== actor.schoolId) throw new AgentError("This homework is outside your authorized class.");
  return { id: h.id, title: h.title, description: h.description, dueOn: h.dueOn.toISOString().slice(0,10), status: h.status, class: h.class.name, subject: h.subject.name };
}
