import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 via-white to-sun-50 px-6">
      <div className="max-w-md text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="EduSphere" className="mx-auto mb-8 h-10 w-auto" />
        <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Error 404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-950">We can’t find that page</h1>
        <p className="mt-3 text-slate-600">The link may be old, mistyped, or meant for a different account. Try going back to your dashboard.</p>
        <div className="mt-6 flex justify-center gap-3"><Link href="/dashboard" className="btn">Go to dashboard</Link><Link href="/" className="btn-ghost">Home</Link></div>
      </div>
    </main>
  );
}
