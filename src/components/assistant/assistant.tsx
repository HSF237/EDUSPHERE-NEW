"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { AiArt } from "@/components/assistant/ai-art";
import type { Approval } from "@/lib/ai/provider";
import type { PersonalUpdates } from "@/lib/ai/updates";
const Chat = dynamic(() => import("@/app/(app)/copilot/chat").then(m=>m.CopilotChat), {loading:()=> <p role="status" className="p-5 text-sm text-slate-500">Opening your assistant…</p>});
type Data = PersonalUpdates & {previews:Approval[]};

export function Assistant({userId,login,ready,principal,readOnly,learner}:{userId:string;login:string;ready:boolean;principal:boolean;readOnly:boolean;learner:boolean}) {
  const pathname = usePathname(), [data,setData]=useState<Data|null>(null), [error,setError]=useState(""), [open,setOpen]=useState(false), [started,setStarted]=useState(false), [notice,setNotice]=useState(false), [draft,setDraft]=useState<{text:string;id:number}>({text:"",id:0});
  const launcher=useRef<HTMLButtonElement>(null),closeButton=useRef<HTMLButtonElement>(null),busy=useRef(false),queuedPreviews=useRef(false),latestOpen=useRef(open);
  latestOpen.current=open;
  const refresh=useCallback(async (previews=false)=>{
    if(busy.current){if(previews)queuedPreviews.current=true;return;}
    busy.current=true;
    try {
      const r=await fetch(`/api/assistant${previews?"?previews=1":""}`,{cache:"no-store"});
      if(!r.ok)throw new Error("Unavailable");
      const next:Data=await r.json();
      setData(previous=>({...next,previews:previews?next.previews:previous?.previews??[]}));setError("");
      const key=`es-assistant-v1:${userId}:${login}:${next.date}`;
      try {if(!sessionStorage.getItem(key)&&next.updates.length){setNotice(true);sessionStorage.setItem(key,"seen");}}catch {/* Updates remain visible without browser storage. */}
    }catch {setError("Could not load today’s updates. Try refreshing them.");}
    finally{busy.current=false;if(queuedPreviews.current){queuedPreviews.current=false;void refresh(true);}}
  },[userId,login]);
  useEffect(()=>{void refresh();},[refresh,pathname]);
  useEffect(()=>{
    const focus=()=>{if(document.visibilityState==="visible")void refresh(latestOpen.current);};
    const timer=window.setInterval(focus,300000);
    window.addEventListener("focus",focus);document.addEventListener("visibilitychange",focus);
    return ()=>{window.clearInterval(timer);window.removeEventListener("focus",focus);document.removeEventListener("visibilitychange",focus);};
  },[refresh]);
  const show=useCallback((prompt="")=>{
    window.dispatchEvent(new CustomEvent("edusphere-overlay-open",{detail:"assistant"}));
    setDraft(d=>({text:prompt,id:d.id+1}));setStarted(true);setOpen(true);setNotice(false);void refresh(true);
  },[refresh]);
  useEffect(()=>{
    const closeForGuide=(event:Event)=>{if((event as CustomEvent).detail==="guide"){setOpen(false);setNotice(false);}};
    window.addEventListener("edusphere-overlay-open",closeForGuide);
    return()=>window.removeEventListener("edusphere-overlay-open",closeForGuide);
  },[]);
  useEffect(()=>{
    const handle=(event:Event)=>{const prompt=(event as CustomEvent<{prompt?:string}>).detail?.prompt;if(typeof prompt==="string")show(prompt.slice(0,4000));};
    window.addEventListener("edusphere-assistant",handle);return()=>window.removeEventListener("edusphere-assistant",handle);
  },[show]);
  useEffect(()=>{if(open)closeButton.current?.focus();},[open]);
  function hide(){setOpen(false);launcher.current?.focus();}
  return <>
    {pathname.includes("/dashboard") && <section aria-label="Your daily AI update" className="mx-auto mt-4 max-w-6xl px-4 sm:px-8"><div className="es-ai-daily relative overflow-hidden rounded-[25px] border border-white/90 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(38,45,107,.36)] sm:p-6"><div className="relative z-10 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold tracking-tight text-slate-900"><span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-indigo-100 p-0.5"><AiArt kind="mascot" decorative sizes="44px"/></span><span><span className="block text-[11px] font-bold uppercase tracking-[.16em] text-indigo-500">EDUSPHERE INTELLIGENCE</span>Your school, in focus</span></h2><button type="button" onClick={()=>{void refresh();}} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">Refresh</button></div><div aria-hidden="true" className="pointer-events-none absolute -bottom-9 -right-4 w-28 opacity-65 sm:-bottom-14 sm:right-2 sm:w-40"><AiArt kind="network" decorative sizes="(max-width: 640px) 112px, 160px"/></div><div className="relative z-10 pr-12 sm:pr-32">{error?<p role="status" className="mt-2 text-sm text-slate-600">{error}</p>:!data?<p className="mt-2 text-sm text-slate-500">Checking your school updates…</p>:data.updates.length?<><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700">{data.updates[0].text}</p><button type="button" className="btn-ghost mt-3" onClick={()=>show(data.updates[0].prompt)}>{data.updates[0].label}</button>{data.updates.length>1&&<button type="button" onClick={()=>show()} className="ml-3 text-sm font-semibold text-indigo-700 hover:underline">View all {data.updates.length} updates</button>}</>:<p className="mt-2 text-sm text-slate-600">No urgent updates in your available records today. Your assistant is here whenever you need help.</p>}</div></div></section>}
    {notice&&!open&&data?.updates[0]&&<aside aria-label="New daily update" className="es-ai-notice fixed bottom-40 right-4 z-40 w-[min(23rem,calc(100vw-2rem))] rounded-[25px] border border-white/70 bg-white p-5 shadow-[0_24px_75px_-23px_rgba(30,41,90,.45)] lg:bottom-24"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><span className="h-9 w-9"><AiArt kind="mascot" decorative sizes="36px"/></span><b className="text-sm text-brand-900">EduSphere · Today</b></span><button aria-label="Dismiss daily update" className="min-h-10 min-w-10" onClick={()=>setNotice(false)}>×</button></div><p className="text-sm leading-6 text-slate-700">{data.updates[0].text}</p><button className="btn-ghost mt-3" onClick={()=>show(data.updates[0].prompt)}>{data.updates[0].label}</button></aside>}
    <button ref={launcher} type="button" aria-label="Open EduSphere AI assistant" aria-expanded={open} aria-controls="global-assistant" onClick={()=>open?hide():show()} className="es-ai-launcher fixed bottom-24 right-4 z-40 flex min-h-14 items-center gap-2.5 rounded-full border border-white/20 bg-gradient-to-r from-[#192958] via-[#4338ca] to-[#7058d6] px-5 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_16px_38px_-10px_rgba(49,46,129,.62)] transition hover:-translate-y-1 hover:shadow-[0_22px_42px_-10px_rgba(49,46,129,.75)] lg:bottom-5"><span className="es-ai-orb grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/20 bg-white/15 p-0.5"><AiArt kind="mascot" decorative sizes="36px"/></span>EduSphere AI{data?.updates.length? <span className="rounded-full bg-white/20 px-2 text-xs">{data.updates.length}</span>:null}</button>
    {started&&<section id="global-assistant" aria-label="EduSphere AI assistant" hidden={!open} onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();hide();}}} className="es-ai-window fixed inset-x-2 bottom-24 top-3 z-50 flex flex-col overflow-hidden rounded-[30px] border border-slate-200/50 bg-white shadow-[0_36px_100px_-25px_rgba(20,30,65,.55)] sm:inset-x-auto sm:right-4 sm:top-auto sm:h-[min(50rem,86dvh)] sm:w-[min(45rem,calc(100vw-2rem))] lg:bottom-20" style={open?undefined:{display:"none"}}>
      <header className="flex shrink-0 items-center justify-between gap-3 bg-[#111c3c] px-5 py-3.5 text-white"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center overflow-hidden rounded-[15px] border border-white/20 bg-indigo-400/20 p-0.5"><AiArt kind="mascot" decorative sizes="44px"/></span><div><h2 className="text-sm font-bold tracking-tight">EduSphere Intelligence</h2><p className="text-[11px] text-indigo-200">Your secure school companion</p></div></div><div className="flex items-center gap-2"><Link href="/copilot" onClick={hide} className="rounded-full border border-white/20 px-3 py-2 text-[11px] font-semibold text-white/90 hover:bg-white/10">Expand</Link><button ref={closeButton} type="button" onClick={hide} aria-label="Close assistant" className="grid min-h-10 min-w-10 place-items-center rounded-full text-xl text-white/75 hover:bg-white/10 hover:text-white">×</button></div></header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><div className="space-y-3 border-b border-indigo-100 bg-gradient-to-br from-[#f0f3ff] via-white to-[#fff8f1] p-4 sm:p-5"><div className="relative flex items-center justify-between gap-3"><span className="flex items-center gap-2"><span className="h-12 w-12 shrink-0"><AiArt kind="workflow" decorative sizes="48px"/></span><span><span className="block text-[10px] font-bold uppercase tracking-[.15em] text-indigo-600">SCHOOL INTELLIGENCE</span><span className="block text-xs font-semibold text-brand-700">TODAY · {data?.date??"Your school"}</span></span></span><button className="text-xs text-brand-700" onClick={()=>{void refresh(true);}}>Refresh</button></div>{error&&<p role="status" className="text-sm text-slate-600">{error}</p>}{data?.updates.map(u=><div key={u.id} className="rounded-[17px] border border-indigo-100/60 bg-white/90 p-4 shadow-sm"><p className="text-sm leading-6 text-slate-700">{u.text}</p><div className="mt-2 flex gap-4"><button type="button" onClick={()=>setDraft(d=>({text:u.prompt,id:d.id+1}))} className="text-sm font-semibold text-brand-700">{u.label}</button><Link href={u.href} onClick={hide} className="text-xs text-slate-500">Open page</Link></div></div>)}{data?.updates.length===0&&<p className="text-sm text-slate-600">No urgent updates today. What can I help with?</p>}</div>
      <Chat learner={learner} ready={ready} principal={principal} readOnly={readOnly} initialPreviews={data?.previews??[]} draft={draft}/></div>
    </section>}
  </>;
}
