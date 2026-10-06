import { getSession } from "@/lib/session";
import { loadInvite, STATE_TEXT } from "@/lib/invites";
import { JoinShell, Problem } from "@/components/site/join-shell";
import { StudentForm } from "./form";
export const dynamic="force-dynamic";
export const metadata={title:"Student access",robots:{index:false,follow:false}};
export default async function JoinStudent({params}:{params:Promise<{token:string}>}) {
  const {token}=await params, r=await loadInvite(token,"STUDENT");
  if(!r||!r.inv.student?.active||!r.inv.school.active||r.inv.student.schoolId!==r.inv.schoolId)return <JoinShell title="Student access"><Problem text="This student invitation is not available. Ask your principal for a new link."/></JoinShell>;
  if(r.state!=="ok"||r.inv.student.userId)return <JoinShell title="Student access"><Problem text={r.state==="ok"?"This student already has an account. Sign in with your email and password.":STATE_TEXT[r.state]}/></JoinShell>;
  if(await getSession())return <JoinShell title="Sign out first"><Problem text="Sign out of your current account before creating this student login."/></JoinShell>;
  return <JoinShell title={`Welcome, ${r.inv.student.name}`} sub={`Class ${r.inv.student.class.name} · ${r.inv.school.name}`}><StudentForm token={token}/></JoinShell>;
}
