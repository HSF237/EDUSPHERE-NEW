"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
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
    {pathname.includes("/dashboard") && <section aria-label="Your daily AI update" className="mx-auto mt-4 max-w-6xl px-4 sm:px-8"><div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold text-brand-900"><Icon name="bolt" className="h-5 w-5"/>Your daily update</h2><button type="button" onClick={()=>{void refresh();}} className="text-xs font-semibold text-brand-700">Refresh</button></div>{error?<p role="status" className="mt-2 text-sm text-slate-600">{error}</p>:!data?<p className="mt-2 text-sm text-slate-500">Checking your school updates…</p>:data.updates.length?<><p className="mt-2 text-sm text-slate-700">{data.updates[0].text}</p><button type="button" className="btn-ghost mt-3" onClick={()=>show(data.updates[0].prompt)}>{data.updates[0].label}</button>{data.updates.length>1&&<button type="button" onClick={()=>show()} className="ml-3 text-sm text-brand-700">View all {data.updates.length} updates</button>}</>:<p className="mt-2 text-sm text-slate-600">No urgent updates in your available records today. Your assistant is here whenever you need help.</p>}</div></section>}
    {notice&&!open&&data?.updates[0]&&<aside aria-label="New daily update" className="fixed bottom-40 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-brand-200 bg-white p-4 shadow-xl lg:bottom-24"><div className="flex items-center justify-between"><b className="text-sm text-brand-900">EduSphere · Today</b><button aria-label="Dismiss daily update" className="min-h-10 min-w-10" onClick={()=>setNotice(false)}>×</button></div><p className="text-sm leading-6 text-slate-700">{data.updates[0].text}</p><button className="btn-ghost mt-3" onClick={()=>show(data.updates[0].prompt)}>{data.updates[0].label}</button></aside>}
    <button ref={launcher} type="button" aria-label="Open EduSphere AI assistant" aria-expanded={open} aria-controls="global-assistant" onClick={()=>open?hide():show()} className="fixed bottom-24 right-4 z-40 flex min-h-12 items-center gap-2 rounded-full bg-brand-700 px-5 py-3 font-semibold text-white shadow-xl hover:bg-brand-800 lg:bottom-5"><Icon name="bolt" className="h-5 w-5"/>Ask AI{data?.updates.length? <span className="rounded-full bg-white/20 px-2 text-xs">{data.updates.length}</span>:null}</button>
    {started&&<section id="global-assistant" aria-label="EduSphere AI assistant" hidden={!open} onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();hide();}}} className="fixed inset-x-2 bottom-24 top-4 z-50 flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:top-auto sm:h-[min(48rem,85dvh)] sm:w-[min(42rem,calc(100vw-2rem))] lg:bottom-20" style={open?undefined:{display:"none"}}>
      <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3"><h2 className="font-semibold">Your assistant</h2><div className="flex items-center gap-4"><Link href="/copilot" onClick={hide} className="text-xs text-brand-700">Full page</Link><button ref={closeButton} type="button" onClick={hide} aria-label="Close assistant" className="min-h-10 min-w-10 text-2xl">×</button></div></header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><div className="space-y-3 bg-brand-50 p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-brand-700">TODAY · {data?.date??"Your school"}</p><button className="text-xs text-brand-700" onClick={()=>{void refresh(true);}}>Refresh</button></div>{error&&<p role="status" className="text-sm text-slate-600">{error}</p>}{data?.updates.map(u=><div key={u.id} className="rounded-xl bg-white p-3"><p className="text-sm leading-6 text-slate-700">{u.text}</p><div className="mt-2 flex gap-4"><button type="button" onClick={()=>setDraft(d=>({text:u.prompt,id:d.id+1}))} className="text-sm font-semibold text-brand-700">{u.label}</button><Link href={u.href} onClick={hide} className="text-xs text-slate-500">Open page</Link></div></div>)}{data?.updates.length===0&&<p className="text-sm text-slate-600">No urgent updates today. What can I help with?</p>}</div>
      <Chat learner={learner} ready={ready} principal={principal} readOnly={readOnly} initialPreviews={data?.previews??[]} draft={draft}/></div>
    </section>}
  </>;
}
