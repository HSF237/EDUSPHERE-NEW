import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SceneClassroom, SceneLaptop, SceneParent, Spot, type SpotName } from "@/components/art";
import { Icon } from "@/components/icons";

const features: [SpotName, string, string][] = [
  ["attendance", "Attendance", "Mark in seconds, approve centrally, track trends per class."],
  ["homework", "Homework", "Assign, follow up and let parents see what is due."],
  ["timetable", "Timetables", "Weekly schedules with substitutes handled cleanly."],
  ["exams", "Exams & reports", "Enter marks, publish results, share progress."],
  ["leave", "Leave requests", "Parents apply, teachers decide, everyone is notified."],
  ["messages", "Messages & notices", "Announcements and one-to-one chat, school-wide."],
];

export default async function Home() {
  if (await getSession()) redirect("/dashboard");
  return (
    <main className="bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5 text-lg font-extrabold text-brand-950">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><Icon name="cap" className="h-5 w-5" /></span>EduSphere
        </div>
        <Link href="/login" className="btn">Sign in</Link>
      </header>

      <section className="blob-bg relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">Built for multi-school networks</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-brand-950 sm:text-5xl">Run every school from one calm, clear place.</h1>
            <p className="mt-4 max-w-lg text-lg text-slate-600">Attendance, homework, exams, timetables and parent communication — each school’s data kept completely separate.</p>
            <div className="mt-7 flex gap-3"><Link href="/login" className="btn">Get started</Link></div>
          </div>
          <SceneClassroom className="animate-float mx-auto w-full max-w-xl" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-brand-950">Everything a school day needs</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([n, t, d]) => (
            <div key={t} className="card p-5 transition hover:-translate-y-1 hover:shadow-lift">
              <Spot name={n} className="h-32 w-auto" />
              <h3 className="mt-3 font-bold text-brand-950">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-50/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
          {[
            { s: <SceneLaptop className="mx-auto w-full max-w-sm" />, t: "For teachers & admins", d: "Mark attendance, set homework, enter marks and approve leave without chasing paper." },
            { s: <SceneParent className="mx-auto w-full max-w-sm" />, t: "For parents", d: "See attendance, homework and results for each child, and message the school directly." },
          ].map((r) => (
            <div key={r.t} className="text-center">{r.s}<h3 className="mt-4 text-xl font-extrabold text-brand-950">{r.t}</h3><p className="mx-auto mt-1 max-w-sm text-slate-600">{r.d}</p></div>
          ))}
        </div>
      </section>

      <footer className="px-5 py-8 text-center text-sm text-slate-400">© EduSphere</footer>
    </main>
  );
}
