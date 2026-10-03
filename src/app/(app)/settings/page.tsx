import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader } from "@/components/ui";
import { PasswordForm } from "./form";
import { changePassword } from "./actions";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const { user } = await getCtx();
  return (
    <>
      <PageHeader title="Settings" sub="Your account and security." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile"><dl className="space-y-3 text-sm"><div><dt className="text-slate-500">Name</dt><dd className="font-medium">{user.name}</dd></div><div><dt className="text-slate-500">Email</dt><dd className="font-medium">{user.email}</dd></div><div><dt className="text-slate-500">Role</dt><dd className="font-medium">{user.role.toLowerCase()}</dd></div><div><dt className="text-slate-500">School</dt><dd className="font-medium">{user.school?.name ?? "Platform"}</dd></div></dl></Card>
        <Card title="Change password"><PasswordForm action={changePassword} /></Card>
      </div>
    </>
  );
}
