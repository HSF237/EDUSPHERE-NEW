import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { waConfigured, waNumber } from "@/lib/whatsapp";
import { disconnectWhatsApp, startWhatsApp, toggleWhatsApp } from "./wa-actions";

export async function WhatsAppCard({ userId, error }: { userId: string; error?: string }) {
  const link = await db.whatsAppLink.findUnique({ where: { userId } });
  const live = waConfigured();
  const num = waNumber().replace(/\D/g, "");
  return (
    <Card title="WhatsApp" className="mb-6">
      {error && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!live ? (
        <p className="text-sm text-slate-600">WhatsApp isn&apos;t switched on for this EduSphere yet. Once the platform owner connects it, you&apos;ll be able to get notifications and reply to chats from WhatsApp here.</p>
      ) : !link ? (
        <form action={startWhatsApp} className="space-y-3">
          <p className="text-sm text-slate-600">Get EduSphere notifications on WhatsApp, and answer chat messages by replying right there. Your reply appears in your EduSphere Messages.</p>
          <div className="flex flex-wrap items-end gap-3">
            <div><label className="label" htmlFor="wph">Your WhatsApp number</label><input id="wph" name="phone" type="tel" autoComplete="tel" required placeholder="98765 43210" className="input" /></div>
            <button className="btn">Connect WhatsApp</button>
          </div>
        </form>
      ) : !link.verified ? (
        <div className="space-y-3 text-sm text-slate-600">
          <p>One last step to prove this number is yours. Send this message from <b>+{link.phone}</b> on WhatsApp:</p>
          <p className="inline-block rounded-lg bg-slate-100 px-3 py-2 font-mono text-base font-bold tracking-wider text-slate-900">LINK {link.code}</p>
          <div className="flex flex-wrap gap-3">
            {num && <a className="btn" href={`https://wa.me/${num}?text=${encodeURIComponent(`LINK ${link.code}`)}`} target="_blank" rel="noreferrer">Open WhatsApp</a>}
            <form action={disconnectWhatsApp}><button className="btn-ghost">Cancel</button></form>
          </div>
          <p className="text-xs text-slate-500">Reload this page after you&apos;ve sent it.</p>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-slate-600">
          <p className="flex items-center gap-2">+{link.phone} <Badge tone={link.optIn ? "green" : "amber"}>{link.optIn ? "On" : "Paused"}</Badge></p>
          <p>To answer a chat, swipe to reply to the message in WhatsApp. Send <b>STOP</b> there to pause, <b>START</b> to resume.</p>
          <div className="flex flex-wrap gap-3">
            <form action={toggleWhatsApp}><button className="btn-ghost">{link.optIn ? "Pause" : "Resume"}</button></form>
            <form action={disconnectWhatsApp}><button className="btn-ghost">Disconnect</button></form>
          </div>
        </div>
      )}
    </Card>
  );
}
