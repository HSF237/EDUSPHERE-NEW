export const PROMISES = [
  "Cancelling never deletes your data. Your account simply becomes read-only.",
  "The principal can always export school data, even when the account is read-only.",
  "Subscribe again at any time and everything is restored exactly as you left it.",
  "We delete data only when your school asks us to, or after 30 days’ written notice if an inactive account is to be archived.",
  "We protect your data with access controls, encryption in transit and regular backups. If something ever goes wrong, we will tell you promptly.",
];
export function DataPromise() {
  return (
    <ul className="space-y-2 text-sm text-slate-600">
      {PROMISES.map((p) => <li key={p} className="flex gap-2"><span className="mt-0.5 text-emerald-600">✓</span><span>{p}</span></li>)}
    </ul>
  );
}
