import { db } from "@/lib/db";
import { loadInvite, STATE_TEXT } from "@/lib/invites";
import { JoinShell, Problem } from "@/components/site/join-shell";
import { TeacherJoinForm } from "./form";

export const metadata = { title: "Join as a teacher", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function JoinTeacher({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await loadInvite(token, "TEACHER");
  if (!r) return <JoinShell title="Teacher invite"><Problem text="This link isn’t valid. Check that you copied the whole link, or ask your principal to send it again." /></JoinShell>;
  if (r.state !== "ok") return <JoinShell title="Teacher invite"><Problem text={STATE_TEXT[r.state]} /></JoinShell>;
  const schoolId = r.inv.schoolId;
  const [classes, subjects] = await Promise.all([
    db.class.findMany({ where: { schoolId, year: { current: true } }, include: { classTeacher: { include: { user: true } } } }),
    db.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
  ]);
  classes.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return (
    <JoinShell wide title={`Join ${r.inv.school.name}`} sub="You’ve been invited to set up your teacher account. It takes about a minute.">
      <TeacherJoinForm token={token} school={r.inv.school.name} classes={classes.map((c) => ({ id: c.id, name: c.name, taken: c.classTeacher?.user.name ?? null }))} subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
    </JoinShell>
  );
}
