"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startPayment, demoPay, confirmPayment } from "./actions";

type Price = { amount: number; months: number; gross: number; discount: number; kind: string };
export type Matrix = Record<string, { label: string; students: number; plans: Record<string, Price & { label: string }> }>;
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open(): void } } }

function loadRzp() {
  return new Promise<boolean>((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

export function PayPanel({ matrix, tier: t0, live }: { matrix: Matrix; tier: string; live: boolean }) {
  const router = useRouter();
  const [tier, setTier] = useState(matrix[t0] ? t0 : "STARTER");
  const [plan, setPlan] = useState("YEAR");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const cur = matrix[tier].plans[plan];

  async function pay() {
    setBusy(true); setMsg(null);
    try {
      const r = await startPayment(tier, plan);
      if ("error" in r) { setMsg({ ok: false, t: r.error }); return; }
      if (r.demo) {
        const d = await demoPay(r.paymentId);
        if (d.error) setMsg({ ok: false, t: d.error }); else { setMsg({ ok: true, t: "Demo payment recorded. Your plan is active." }); router.refresh(); }
        return;
      }
      if (!(await loadRzp()) || !window.Razorpay) { setMsg({ ok: false, t: "Couldn't load the payment window. Check your connection." }); return; }
      new window.Razorpay({
        key: r.keyId, amount: r.amount * 100, currency: "INR", order_id: r.orderId, name: "EduSphere", description: `${matrix[tier].label} · ${cur.label}`, prefill: {},
        handler: async (resp: { razorpay_payment_id: string; razorpay_signature: string }) => {
          const c = await confirmPayment(r.paymentId, resp.razorpay_payment_id, resp.razorpay_signature);
          if (c.error) setMsg({ ok: false, t: c.error }); else { setMsg({ ok: true, t: "Payment received. Thank you!" }); router.refresh(); }
        },
      }).open();
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-3">
        {Object.entries(matrix).map(([k, v]) => (
          <button key={k} type="button" onClick={() => setTier(k)} aria-pressed={tier === k} className={`rounded-xl border p-3 text-left transition ${tier === k ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200" : "border-slate-200 bg-white hover:border-brand-300"}`}>
            <div className="font-bold text-slate-800">{v.label}</div><div className="text-xs text-slate-500">Up to {v.students.toLocaleString("en-IN")} students</div>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(matrix[tier].plans).map(([k, p]) => (
          <button key={k} type="button" onClick={() => setPlan(k)} aria-pressed={plan === k} className={`relative rounded-xl border p-3 text-left transition ${plan === k ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200" : "border-slate-200 bg-white hover:border-brand-300"}`}>
            {p.discount > 0 && <span className="absolute right-2 top-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Save {p.discount}%</span>}
            <div className="text-sm font-semibold text-slate-700">{p.label}</div>
            <div className="mt-1 text-xl font-extrabold text-brand-900">{inr(p.amount)}</div>
            {p.discount > 0 && <div className="text-xs text-slate-400 line-through">{inr(p.gross)}</div>}
            {p.kind === "INTRO" && <div className="text-xs font-medium text-emerald-700">Intro price (first 3 months)</div>}
            {p.months > 1 && <div className="text-xs text-slate-500">{inr(Math.round(p.amount / p.months))}/month</div>}
          </button>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={pay} disabled={busy} className="btn">{busy ? "Please wait…" : `${live ? "Pay" : "Pay (demo)"} ${inr(cur.amount)}`}</button>
        {!live && <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-amber-100">Demo payment: no real money is charged.</span>}
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-3 rounded-lg border px-3 py-2 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>{msg.t}</p>}
    </div>
  );
}
