import { loadInvite, STATE_TEXT } from "@/lib/invites";
import { JoinShell, Problem } from "@/components/site/join-shell";
import { ResetForm } from "./form";

export const metadata = { title: "Reset your password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Reset({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await loadInvite(token, "RESET");
  if (!r || !r.inv.user) return <JoinShell title="Reset password"><Problem text="This link isn’t valid. Ask your school for a new password reset link." /></JoinShell>;
  if (r.state !== "ok") return <JoinShell title="Reset password"><Problem text={STATE_TEXT[r.state]} /></JoinShell>;
  return (
    <JoinShell title="Choose a new password" sub={`For ${r.inv.user.name} (${r.inv.user.email}).`}>
      <ResetForm token={token} />
    </JoinShell>
  );
}
