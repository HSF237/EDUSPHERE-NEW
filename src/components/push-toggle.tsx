"use client";
import { useEffect, useState } from "react";

const toKey = (b64: string) => { const p = "=".repeat((4 - (b64.length % 4)) % 4); const raw = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(raw, (c) => c.charCodeAt(0)); };

export function PushToggle({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<"loading" | "unsupported" | "off" | "on" | "blocked">("loading");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.ready;
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);
  async function turnOn() {
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState("blocked");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) });
      const r = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!r.ok) throw new Error();
      setState("on");
    } catch { setMsg("Couldn’t turn on notifications on this device."); }
  }
  async function turnOff() {
    const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription();
    if (sub) { await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
    setState("off");
  }
  if (state === "loading") return null;
  return (
    <div className="space-y-2 text-sm">
      {state === "unsupported" && <p className="text-slate-500">This browser can’t show push notifications. On iPhone, add EduSphere to your Home Screen first.</p>}
      {state === "blocked" && <p className="text-amber-700">Notifications are blocked for this site. Allow them in your browser settings, then come back.</p>}
      {state === "off" && <button type="button" className="btn" onClick={turnOn}>Turn on notifications on this device</button>}
      {state === "on" && <div className="flex flex-wrap items-center gap-3"><span className="font-semibold text-emerald-700">Notifications are on for this device.</span><button type="button" className="btn-ghost" onClick={turnOff}>Turn off</button></div>}
      {msg && <p role="alert" className="text-red-600">{msg}</p>}
    </div>
  );
}
