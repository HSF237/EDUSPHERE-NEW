"use client";
import { useActionState } from "react";
import { saveBranding } from "./branding-actions";

type Props = { colour: string; signatoryName: string; signatoryTitle: string; hasLogo: boolean; hasSignature: boolean };
export function BrandingForm({ colour, signatoryName, signatoryTitle, hasLogo, hasSignature }: Props) {
  const [st, action, pending] = useActionState(saveBranding, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {st?.error && <p role="alert" className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{st.error}</p>}
      {st?.ok && <p role="status" className="sm:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{st.ok} Refresh to see the new colours everywhere.</p>}
      <div><label className="label" htmlFor="bc">School colour</label><div className="flex items-center gap-3"><input id="bc" name="brandColor" type="color" defaultValue={colour || "#4f46e5"} className="h-11 w-16 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" /><span className="text-xs text-slate-500">Used for buttons, menus and highlights in your school’s workspace.</span></div></div>
      <div />
      <div><label className="label" htmlFor="bl">School logo (PNG/JPG, shown on the menu, report cards, ID cards and receipts)</label><input id="bl" name="logo" type="file" accept=".png,.jpg,.jpeg,.webp" className="input !py-2" />{hasLogo && <label className="mt-1 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" name="removeLogo" className="accent-brand-600" /> Remove current logo</label>}</div>
      <div><label className="label" htmlFor="bs">Principal’s signature image (printed on report cards and receipts)</label><input id="bs" name="signature" type="file" accept=".png,.jpg,.jpeg,.webp" className="input !py-2" />{hasSignature && <label className="mt-1 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" name="removeSignature" className="accent-brand-600" /> Remove current signature</label>}</div>
      <div><label className="label" htmlFor="sn">Signatory name</label><input id="sn" name="signatoryName" defaultValue={signatoryName} className="input" placeholder="e.g. Dr. A. Kumar" maxLength={80} /></div>
      <div><label className="label" htmlFor="st">Signatory title</label><input id="st" name="signatoryTitle" defaultValue={signatoryTitle} className="input" placeholder="Principal" maxLength={80} /></div>
      <div className="sm:col-span-2 text-right"><button className="btn" disabled={pending}>{pending ? "Saving…" : "Save branding"}</button></div>
    </form>
  );
}
