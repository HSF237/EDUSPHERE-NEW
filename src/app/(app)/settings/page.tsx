import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader } from "@/components/ui";
import { PasswordForm } from "./form";
import { changePassword } from "./actions";
import { BrandingForm } from "./branding-form";
import { PushToggle } from "@/components/push-toggle";
import { LangSwitch } from "@/components/lang-switch";
import { getLang } from "@/lib/i18n";
import { NotifPrefsCard } from "./notif-card";
import Link from "next/link";
import { hasCustom } from "@/lib/custom";
import { CUSTOM, inr } from "@/lib/plans";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const { user, schoolId } = await getCtx();
  const lang = await getLang();
  const sch = user.role === "ADMIN" ? await db.school.findUnique({ where: { id: schoolId } }) : null;
  const vapid = process.env.VAPID_PUBLIC_KEY ?? "";
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
        {sch && (hasCustom(sch) ? (
          <Card title="School branding (Custom school)" className="lg:col-span-2">
            <p className="mb-4 text-sm text-slate-600">Your Custom school add-on is active until <b>{fmtDate(sch.customUntil!)}</b>.{sch.customDomain ? <> Your web address: <b>{sch.customDomain}</b>.</> : " Your own web address will be set up by EduSphere. Message us the name you want, e.g. app.yourschool.edu.in."}</p>
            <BrandingForm colour={sch.brandColor ?? ""} signatoryName={sch.signatoryName ?? ""} signatoryTitle={sch.signatoryTitle ?? ""} hasLogo={!!sch.logoFileId} hasSignature={!!sch.signatureFileId} />
          </Card>
        ) : (
          <Card title="Custom school add-on" className="lg:col-span-2">
            <p className="text-sm text-slate-600">Put your school&apos;s own identity on EduSphere: your logo and colours on every screen, report card, ID card and receipt, your principal&apos;s signature, your school name on the sign-in page, and your own web address such as app.yourschool.edu.in.</p>
            <p className="mt-2 text-sm text-slate-600"><b>{inr(CUSTOM.yearly)} per year</b>, available with a 1-year or 2-year plan (a web address is bought a year at a time).{sch.customUntil ? ` Your previous add-on ended on ${fmtDate(sch.customUntil)}; your logo and settings are kept and come back when you renew.` : ""}</p>
            <Link href="/billing" className="btn mt-4 inline-block">Add it on the Billing page</Link>
          </Card>
        ))}
        <Card title="Language"><p className="mb-3 text-sm text-slate-600">Choose English, മലയാളം or हिन्दी for menus and headings on this device.</p><LangSwitch current={lang} /></Card>
        <Card title="Phone notifications">{vapid ? <PushToggle publicKey={vapid} /> : <p className="text-sm text-slate-500">Phone notifications are not switched on for this school yet. You can still install EduSphere on your home screen from your browser menu.</p>}</Card>
        <NotifPrefsCard userId={user.id} />
        <Card title="Change password"><PasswordForm action={changePassword} /></Card>
      </div>
    </>
  );
}
