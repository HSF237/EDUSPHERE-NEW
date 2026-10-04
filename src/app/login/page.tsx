import Link from "next/link";
import { SceneClassroom } from "@/components/art";
import { LangSwitch } from "@/components/lang-switch";
import { getLang, tr } from "@/lib/i18n";
import { trx } from "@/lib/i18n-login";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const lang = await getLang();
  const t = (s: string) => { const x = trx(lang, s); return x !== s ? x : tr(lang, s); };
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="blob-bg relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50 p-12 lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="EduSphere" className="h-12 w-auto self-start" />
        <div>
          <SceneClassroom className="animate-float mx-auto w-full max-w-lg" />
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-brand-950">{t("One platform for every school, teacher and parent.")}</h1>
          <p className="mt-3 max-w-md text-slate-600">{t("Attendance, homework, timetables, exams, leave and messaging — with every school’s data kept separate and secure.")}</p>
        </div>
        <p className="text-sm text-slate-400">© EduSphere · <Link className="hover:underline" href="/terms">{t("Terms")}</Link> · <Link className="hover:underline" href="/privacy">{t("Privacy")}</Link></p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex justify-end"><LangSwitch current={lang} /></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="EduSphere" className="mx-auto mb-5 h-10 w-auto lg:hidden" />
          <LoginForm t={{
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
