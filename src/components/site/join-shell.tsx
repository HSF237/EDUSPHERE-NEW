export function JoinShell({ title, sub, children, wide }: { title: string; sub?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="blob-bg bg-gradient-to-br from-brand-50 via-white to-sun-50">
      <div className={`mx-auto px-5 py-10 sm:py-16 ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-950">{title}</h1>
        {sub && <p className="mt-2 text-slate-600">{sub}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
export const Problem = ({ text }: { text: string }) => (
  <div role="alert" className="card p-6 text-center">
    <p className="font-semibold text-brand-950">This link can’t be used</p>
    <p className="mt-2 text-sm text-slate-600">{text}</p>
  </div>
);
export const FormError = ({ msg }: { msg?: string }) => (msg ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div> : null);
