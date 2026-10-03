import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { loadInvite, STATE_TEXT } from "@/lib/invites";
import { JoinShell, Problem } from "@/components/site/join-shell";
import { parentClaimLoggedIn } from "../../actions";
import { ParentForms } from "./forms";

export const metadata = { title: "See your child’s school updates", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function JoinParent({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  const r = await loadInvite(token, "PARENT");
  if (!r || !r.inv.student) return <JoinShell title="Parent access"><Problem text="This link isn’t valid. Check that you copied the whole link, or ask the class teacher to send it again." /></JoinShell>;
  const child = r.inv.student, first = child.name.split(" ")[0];
  const s = await getSession();
  const me = s ? await db.user.findUnique({ where: { id: s.userId }, include: { children: { where: { studentId: child.id } } } }) : null;
  const linked = !!me && me.children.length > 0;

  if (linked) return (
    <JoinShell title={`${child.name} is already on your account`}>
      <div className="card p-6 text-center"><p className="text-sm text-slate-600">You can already see {first}’s updates.</p><Link href="/dashboard" className="btn mt-4 inline-flex">Go to my dashboard</Link></div>
    </JoinShell>
  );
  if (r.state !== "ok") return <JoinShell title="Parent access"><Problem text={STATE_TEXT[r.state]} /></JoinShell>;

  const header = (
    <div className="card mb-5 flex items-center gap-4 p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-lg font-extrabold text-white">{first[0]}</span>
      <div><p className="font-extrabold text-brand-950">{child.name}</p><p className="text-sm text-slate-500">Class {child.class.name} · {r.inv.school.name}</p></div>
    </div>
  );
  const err = error ? <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null;

  if (me && me.role === "PARENT" && me.schoolId === r.inv.schoolId && me.active) return (
    <JoinShell title={`Add ${first} to your account`} sub={`You’re signed in as ${me.email}.`}>
      {header}{err}
      <form action={parentClaimLoggedIn.bind(null, token)} className="card p-6"><button className="btn w-full">Yes, add {first} to my account</button></form>
    </JoinShell>
  );
  if (me) return (
    <JoinShell title="Sign out first">
      {header}
      <Problem text={`You’re signed in as ${me.email}, which isn’t a parent account for this school. Sign out, then open this link again.`} />
    </JoinShell>
  );
  return (
    <JoinShell title={`See ${first}’s school updates`} sub="Attendance, homework, results and messages from the class teacher — on your phone.">
      {header}{err}<ParentForms token={token} child={first} />
    </JoinShell>
  );
}
