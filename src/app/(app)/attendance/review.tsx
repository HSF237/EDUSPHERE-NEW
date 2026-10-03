"use client";
import { useTransition } from "react";
import { reviewAttendance } from "./actions";

export function ReviewButtons({ id }: { id: string }) {
  const [p, start] = useTransition();
  return (
    <div className="flex gap-2">
      <button className="btn" disabled={p} onClick={() => start(() => reviewAttendance(id, true))}>Approve</button>
      <button className="btn-ghost" disabled={p} onClick={() => { const n = prompt("Reason for returning the register?") ?? ""; start(() => reviewAttendance(id, false, n)); }}>Return</button>
    </div>
  );
}
