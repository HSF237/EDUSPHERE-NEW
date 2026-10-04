"use client";
import { useState } from "react";

/** Password box with a show/hide button so people can check what they typed. */
export function PasswordInput({ className = "input", ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...rest} type={show ? "text" : "password"} className={`${className} pr-11 [&::-ms-reveal]:hidden`} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} title={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-slate-500 hover:text-brand-700 focus-visible:text-brand-700">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {show ? (
            <><path d="M3 3l18 18" /><path d="M10.6 6.1A9.7 9.7 0 0112 6c5 0 8.5 4.2 9.5 6-.4.8-1.3 2.1-2.6 3.3M6.6 6.7C4.5 8.1 3.1 10.1 2.5 12c1 1.8 4.5 6 9.5 6 1.5 0 2.8-.4 4-1" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></>
          ) : (
            <><path d="M2.5 12C3.5 10.2 7 6 12 6s8.5 4.2 9.5 6c-1 1.8-4.5 6-9.5 6s-8.5-4.2-9.5-6z" /><circle cx="12" cy="12" r="3" /></>
          )}
        </svg>
      </button>
    </div>
  );
}
