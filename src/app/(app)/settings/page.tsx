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
        {user.role === "ADMIN" && (
          <Card title="Export your school’s data" className="lg:col-span-2">
            <p className="mb-4 text-sm text-slate-600">Download your school’s records as CSV files that open in Excel or Google Sheets. Your data is yours — keep these as a backup.</p>
            <div className="flex flex-wrap gap-2">
              {[["students", "Students"], ["teachers", "Teachers"], ["guardians", "Parents & children"], ["attendance", "Attendance"], ["marks", "Marks"]].map(([t, l]) => <a key={t} href={`/api/export?type=${t}`} download className="btn-ghost">{l} (.csv)</a>)}
            </div>
          </Card>
        )}
        <Card title="Change password"><PasswordForm action={changePassword} /></Card>
      </div>
    </>
  );
}
