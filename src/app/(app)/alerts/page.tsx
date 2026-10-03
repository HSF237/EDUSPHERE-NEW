import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, getCtx } from "@/lib/scope";
import { Badge, Card, Empty, PageHeader, Table } from "@/components/ui";
import { providerConfigured, waLink } from "@/lib/alerts";
import { fmtDate } from "@/lib/utils";
import { markAlertSent } from "./actions";

export const metadata = { title: "Parent alerts" };

export default async function Alerts() {
  const ctx = await getCtx();
  if (ctx.role !== "ADMIN" && !can(ctx, "ATTENDANCE_APPROVE")) redirect("/dashboard");
  const list = await db.alertLog.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { createdAt: "desc" }, take: 100 });
  const auto = providerConfigured();
  const pending = list.filter((a) => a.status === "MANUAL").length;
  return (
    <>
      <PageHeader title="Parent alerts" sub="Absence and fee messages for parents’ phones.">
        <Badge tone={auto ? "green" : "amber"}>{auto ? "Sending automatically" : `${pending} waiting to send`}</Badge>
      </PageHeader>
      {!auto && (
        <Card title="Turn on automatic sending" className="mb-6">
          <p className="text-sm text-slate-600">Right now each alert is prepared for you: tap <b>Send on WhatsApp</b> and the message opens ready to send from your phone. To send them automatically (WhatsApp or SMS), create a Twilio account and add <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code> and <code>TWILIO_FROM</code> (for example <code>whatsapp:+14155238886</code> or an SMS number) to the hosting settings. No code changes are needed.</p>
        </Card>
      )}
      <Card flush>
        {list.length === 0 ? <Empty title="No alerts yet" hint="When a class register is approved, an absence alert is prepared for each absent child’s parent who has a phone number saved." /> : (
          <Table head={["Date", "Phone", "Message", "Status", ""]}>{list.map((a) => (
            <tr key={a.id}><td className="td whitespace-nowrap">{fmtDate(a.createdAt)}</td><td className="td whitespace-nowrap">+{a.phone}</td><td className="td max-w-md text-xs">{a.body}</td>
              <td className="td"><Badge tone={a.status === "SENT" ? "green" : a.status === "FAILED" ? "red" : "amber"}>{a.status === "MANUAL" ? "Ready" : a.status.toLowerCase()}</Badge>{a.error && <div className="text-[11px] text-red-600">{a.error}</div>}</td>
              <td className="td whitespace-nowrap">{a.status !== "SENT" && <div className="flex items-center gap-3"><a className="btn !px-3 !py-1.5 text-xs" href={waLink(a.phone, a.body)} target="_blank" rel="noreferrer">Send on WhatsApp</a>{a.status === "MANUAL" && <form action={markAlertSent.bind(null, a.id)}><button className="text-xs font-semibold text-brand-600 hover:underline">Mark sent</button></form>}</div>}</td></tr>))}</Table>
        )}
      </Card>
    </>
  );
}
