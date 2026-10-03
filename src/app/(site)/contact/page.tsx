import Link from "next/link";
import { Icon } from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata = { title: "Contact", description: "Request a demo, ask a question or report a concern about EduSphere." };

const subject = encodeURIComponent("EduSphere — demo request");
const body = encodeURIComponent("School name:\nCity / state:\nNumber of students:\nYour role:\nWhat would you like to see?\n");

export default function Contact() {
  return (
    <div className="bg-white">
      <section className="blob-bg border-b border-slate-100 bg-gradient-to-br from-brand-50 via-white to-sun-50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Contact</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-950 sm:text-5xl">Let’s talk about your school.</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">Request a walkthrough, ask about pricing, raise a data-protection request or report a concern. A real person replies — usually within two business days.</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-12 md:grid-cols-3">
        {[
          { i: "message", t: "Email", d: "Best for demo requests, quotes and formal requests.", a: `mailto:${SITE.email}?subject=${subject}&body=${body}`, l: SITE.email },
          { i: "send", t: "WhatsApp", d: "Quick questions and scheduling a walkthrough.", a: `https://wa.me/${SITE.whatsapp}`, l: SITE.phoneDisplay },
          { i: "building", t: "Based in", d: "We serve schools across India and beyond.", a: undefined, l: SITE.location },
        ].map((c) => (
          <div key={c.t} className="card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-700"><Icon name={c.i as "message"} /></span>
            <h2 className="mt-4 text-lg font-extrabold text-brand-950">{c.t}</h2>
            <p className="mt-1 text-sm text-slate-600">{c.d}</p>
            {c.a ? <a href={c.a} className="mt-4 inline-block font-semibold text-brand-700 hover:underline">{c.l}</a> : <p className="mt-4 font-semibold text-slate-800">{c.l}</p>}
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-lg font-extrabold text-brand-950">What to include in a demo request</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700 marker:text-brand-400">
              <li>Your school’s name, city and approximate number of students</li>
              <li>Your role (principal, administrator, teacher, trustee)</li>
              <li>The problems you most want to solve (attendance, parent communication, exams…)</li>
              <li>Whether you run one school or several branches</li>
            </ul>
            <a className="btn mt-5" href={`mailto:${SITE.email}?subject=${subject}&body=${body}`}>Compose email</a>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-extrabold text-brand-950">Privacy, data and security requests</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">To access, correct or delete personal data, withdraw consent, or raise a grievance, email us with the subject “Data request” and tell us which school and account it concerns. To report a security vulnerability, use the subject “Security report” — please do not publish details until we have had a chance to fix the issue.</p>
            <p className="mt-3 text-sm text-slate-600">See our <Link className="font-semibold text-brand-700 underline" href="/privacy">Privacy Policy</Link>, <Link className="font-semibold text-brand-700 underline" href="/student-data">Student & Children’s Data</Link> and <Link className="font-semibold text-brand-700 underline" href="/security">Security</Link> pages.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
