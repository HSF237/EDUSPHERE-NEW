import Link from "next/link";
import { SceneClassroom } from "@/components/art";
import { LangSwitch } from "@/components/lang-switch";
import { getLang, tr } from "@/lib/i18n";
import { trx } from "@/lib/i18n-login";
import { LoginForm } from "./login-form";
import { headers } from "next/headers";
import { schoolByHost } from "@/lib/custom";
import type { Metadata } from "next";

async function hostSchool() {
  const h = await headers();
  return schoolByHost(h.get("x-forwarded-host") ?? h.get("host"));
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await hostSchool();
  return s ? { title: { absolute: `Sign in · ${s.name}` }, appleWebApp: { capable: true, title: s.name, statusBarStyle: "default" } } : { title: "Sign in" };
}

export default async function LoginPage() {
  const lang = await getLang();
  const sch = await hostSchool();
  const logo = sch?.logoFileId ? `/api/brand/${sch.id}` : "/logo.png";
  const shown = sch?.name ?? "EduSphere";
  const t = (s: string) => { const x = trx(lang, s); return x !== s ? x : tr(lang, s); };
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="blob-bg relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50 p-12 lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={shown} className="h-12 w-auto self-start" />
        <div>
          <SceneClassroom className="animate-float mx-auto w-full max-w-lg" />
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-brand-950">{sch ? `${t("Welcome to")} ${sch.name}` : t("One platform for every school, teacher and parent.")}</h1>
          <p className="mt-3 max-w-md text-slate-600">{sch ? t("Attendance, homework, timetables, exams, leave and messaging in one place for our students, teachers and parents.") : t("Attendance, homework, timetables, exams, leave and messaging — with every school’s data kept separate and secure.")}</p>
        </div>
        <p className="text-sm text-slate-400">© {shown} · <Link className="hover:underline" href="/terms">{t("Terms")}</Link> · <Link className="hover:underline" href="/privacy">{t("Privacy")}</Link></p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex justify-end"><LangSwitch current={lang} /></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={shown} className="mx-auto mb-5 h-10 w-auto lg:hidden" />
          <LoginForm hideCreate={!!sch} t={{
            welcome: t("Welcome back"), sub: t("Sign in with the account your school gave you."), email: t("Email"), password: t("Password"),
            signIn: t("Sign in"), signingIn: t("Signing in…"), forgot: t("Forgot your password? Ask your principal or class teacher for a reset link."),
            create: t("Create your school"), agree: t("By signing in you agree to our"), terms: t("Terms"), and: t("and"), privacy: t("Privacy Policy"),
            home: t("Back to home"), reset: t("Password updated. Please sign in."),
          }} />
        </div>
      </section>
    </main>
  );
}
