"use client";
export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return <button type="button" onClick={() => window.print()} className="btn no-print">{label}</button>;
}
