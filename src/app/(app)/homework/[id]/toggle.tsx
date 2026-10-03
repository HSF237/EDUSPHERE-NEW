"use client";
import { useOptimistic, useTransition } from "react";
import { toggleSubmission } from "../actions";

export function Toggle({ homeworkId, studentId, done }: { homeworkId: string; studentId: string; done: boolean }) {
  const [v, setV] = useOptimistic(done);
  const [, start] = useTransition();
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={v} onChange={(e) => start(async () => { setV(e.target.checked); await toggleSubmission(homeworkId, studentId, e.target.checked); })} className="h-4 w-4 accent-brand-600" />
      <span className={v ? "text-emerald-600" : "text-slate-500"}>{v ? "Done" : "Not done"}</span>
    </label>
  );
}
