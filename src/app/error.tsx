"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 via-white to-sun-50 px-6">
      <div className="max-w-md text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="EduSphere" className="mx-auto mb-8 h-10 w-auto" />
        <p className="text-sm font-bold uppercase tracking-widest text-red-600">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-950">We hit a problem loading this page</h1>
        <p className="mt-3 text-slate-600">It’s on us, not you. Please try again. If it keeps happening, tell your school and quote this code{error.digest ? <>: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{error.digest}</code></> : "."}</p>
        <div className="mt-6 flex justify-center gap-3"><button onClick={reset} className="btn">Try again</button><Link href="/dashboard" className="btn-ghost">Dashboard</Link></div>
      </div>
    </main>
  );
}
