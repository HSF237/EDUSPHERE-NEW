import type { SchoolBrand } from "@/lib/school-brand";

/* eslint-disable @next/next/no-img-element */
export function DocHead({ b, line }: { b: SchoolBrand; line: string }) {
  return (
    <div className="flex items-center gap-4 border-b-2 border-brand-600 pb-4">
      {b.logo ? <img src={b.logo} alt="" className="h-16 w-16 object-contain" /> : <img src="/logo-icon.png" alt="" className="h-14 w-14 object-contain" />}
      <div className="min-w-0 flex-1"><div className="text-xl font-extrabold leading-tight text-brand-900">{b.name}</div><div className="text-sm text-slate-500">{line}</div></div>
    </div>
  );
}
export function SignBlock({ b }: { b: SchoolBrand }) {
  return (
    <div className="mt-10 flex justify-end">
      <div className="w-56 text-center">
        {b.signature ? <img src={b.signature} alt="" className="mx-auto h-14 object-contain" /> : <div className="h-14" />}
        <div className="border-t border-slate-400 pt-1 text-xs"><b>{b.signatory || b.title}</b>{b.signatory && <div className="text-slate-500">{b.title}</div>}</div>
      </div>
    </div>
  );
}
