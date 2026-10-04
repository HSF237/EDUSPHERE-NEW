import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { KINDS, parsePrefs } from "@/lib/notif";
import { saveNotifPrefs } from "./notif-actions";

export async function NotifPrefsCard({ userId }: { userId: string }) {
  const u = await db.user.findUnique({ where: { id: userId }, select: { notifPrefs: true } });
  const p = parsePrefs(u?.notifPrefs);
  return (
    <Card title="What to notify me about">
      <form action={saveNotifPrefs} className="space-y-4 text-sm">
        <p className="text-slate-600">Choose what pops up and what is sent to your phone. Everything is still kept in your Notifications list.</p>
        <div className="space-y-2">
          {KINDS.map((k) => (
            <label key={k.id} className="flex items-center gap-3"><input type="checkbox" name="kind" value={k.id} defaultChecked={!p.off.includes(k.id)} className="h-4 w-4 rounded border-slate-300" />{k.label}</label>
          ))}
          <p className="text-xs text-slate-500">Account and school alerts (billing, support access) are always shown.</p>
        </div>
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <label className="flex items-center gap-3"><input type="checkbox" name="quietOn" defaultChecked={!!p.quiet} className="h-4 w-4 rounded border-slate-300" />Quiet hours (no pop-ups or phone alerts)</label>
          <div className="flex items-center gap-2 pl-7">
            <input type="time" name="from" defaultValue={p.quiet?.from ?? "22:00"} aria-label="Quiet from" className="input !w-auto" /> <span>to</span> <input type="time" name="to" defaultValue={p.quiet?.to ?? "07:00"} aria-label="Quiet until" className="input !w-auto" />
          </div>
          <p className="pl-7 text-xs text-slate-500">India time.</p>
        </div>
        <label className="flex items-center gap-3 border-t border-slate-100 pt-3"><input type="checkbox" name="sound" defaultChecked={p.sound} className="h-4 w-4 rounded border-slate-300" />Play a short sound for pop-ups</label>
        <button className="btn">Save</button>
      </form>
    </Card>
  );
}
