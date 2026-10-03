"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Icon } from "../icons";

export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("es:menu", on);
    return () => window.removeEventListener("es:menu", on);
  }, []);
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-slate-700 hover:bg-slate-100" aria-label="Open menu"><Icon name="menu" /></button>
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-brand-950/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-brand-950 p-4 text-white">
            <button onClick={() => setOpen(false)} className="mb-2 ml-auto rounded-xl p-2 text-brand-200 hover:bg-white/10" aria-label="Close menu"><Icon name="close" /></button>
            {children}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
