"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {Icon} from "@/components/icons";
import {AiArt} from "@/components/assistant/ai-art";

type Message={id:number;role:"assistant"|"user";text:string;kind?:"plan"|"summary"|"attendance"};
type Action={icon:"swap"|"attendance"|"chart"|"book";title:string;description:string;prompt:string;kind:Message["kind"]};

const actions:Action[]=[
  {icon:"swap",title:"Find substitutes",description:"Plan cover for an absent teacher",prompt:"Kavya ma'am is absent today. Find substitutes.",kind:"plan"},
  {icon:"attendance",title:"Mark attendance",description:"Transform roll numbers into a register",prompt:"Mark rolls 5 and 17 absent, roll 9 late today.",kind:"attendance"},
  {icon:"chart",title:"Morning overview",description:"Today's school, at a glance",prompt:"Show me today's school status.",kind:"summary"},
  {icon:"book",title:"Homework assistant",description:"Support your next classroom lesson",prompt:"Help me prepare a science homework assignment.",kind:undefined},
];

const reply:Record<string,string>={
  plan:"I found three lesson periods requiring cover. Here is a sample recommendation, ranked by availability, subject and today's workload. Nothing has been assigned.",
  attendance:"I've prepared a sample attendance register for your review. No student records were changed.",
  summary:"Here is a sample school overview. All figures on this page are fictional and illustrate the proposed dashboard.",
};
const starter:Message={id:1,role:"assistant",text:"Good morning! ✨ I'm your EduSphere Intelligence companion. Explore sample school workflows below. This design preview is not connected to a real database."};

export default function AiStudioDemo(){
  const [messages,setMessages]=useState<Message[]>([starter]);
  const [active,setActive]=useState<"smart"|"fast"|"providers">("smart");
  const [draft,setDraft]=useState("");
  const [focused,setFocused]=useState<"overview"|"assistant">("overview");
  const end=useRef<HTMLDivElement>(null);
  const count=useRef(2);
  useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth",block:"end"});},[messages.length]);
  function ask(prompt:string,kind?:Message["kind"]){
    setFocused("assistant");
    const id=count.current;count.current+=2;
    setMessages(prev=>[...prev,{id,role:"user",text:prompt},{id:id+1,role:"assistant",text:kind ? reply[kind]??"Here's a mock response from the EduSphere assistant." : "That request would be handled by a connected model or an authorized EduSphere backend tool. This page is a safe interactive design demonstration.",kind}]);
    setDraft("");
  }
  function send(e:React.FormEvent){e.preventDefault();const val=draft.trim();if(val)ask(val,/substitut|cover|absent teacher/i.test(val)?"plan":/roll|attendance/i.test(val)?"attendance":/school status|overview/i.test(val)?"summary":undefined);}
  return <div className="min-h-screen bg-[#eff2f9] text-[#182444] selection:bg-indigo-200">
    <header className="sticky top-0 z-30 border-b border-white/40 bg-[#0d1632]/95 px-4 text-white backdrop-blur-2xl sm:px-7">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 py-3.5">
        <div className="flex items-center gap-3"><span className="es-ai-orb grid h-10 w-10 place-items-center rounded-[14px] border border-white/20 bg-gradient-to-br from-indigo-400 to-violet-600"><Icon name="bolt" className="h-5 w-5"/></span><div><span className="block text-[15px] font-black tracking-tight">EduSphere <span className="font-medium text-indigo-300">/ Intelligence</span></span><span className="block text-[10px] uppercase tracking-[.21em] text-indigo-200/80">Experience preview</span></div></div>
        <span className="rounded-full border border-amber-300/25 bg-amber-200/10 px-3 py-2 text-[10px] font-semibold tracking-wide text-amber-100 sm:text-xs">SAMPLE DATA · NO REAL ACTIONS</span>
      </div>
    </header>
    <main className="mx-auto max-w-[1440px] p-3 pb-9 sm:p-6 lg:p-8">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(390px,.9fr)]">
        <section className="space-y-5">
          <div className="es-ai-ambient relative isolate overflow-hidden rounded-[30px] p-6 text-white shadow-[0_25px_65px_-28px_rgba(24,33,70,.6)] sm:p-8 lg:p-10">
            <div className="es-ai-grid pointer-events-none absolute inset-0 opacity-35"/>
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl"/>
            <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-60 rounded-full bg-amber-200/15 blur-[55px]"/>
            <div className="relative z-10 max-w-[73%] sm:max-w-[62%]"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-indigo-100"><span className="h-2 w-2 rounded-full bg-emerald-300"/> YOUR SCHOOL. INTELLIGENTLY CONNECTED.</span>
              <h1 className="mt-7 max-w-xl text-[30px] font-bold leading-[1.08] tracking-[-.06em] sm:text-[42px] lg:text-[51px]">A more thoughtful <span className="bg-gradient-to-r from-[#ffe9ac] via-[#ffc4ac] to-[#cabdff] bg-clip-text text-transparent">school day.</span></h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-indigo-100/85 sm:text-base">From morning attendance to last-minute substitutions. A living workspace that surfaces what matters and helps you take action.</p>
              <button onClick={()=>{setFocused("assistant");document.getElementById("demo-assistant")?.scrollIntoView({behavior:"smooth",block:"center"});}} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-indigo-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50">Explore the assistant <Icon name="arrow" className="h-4 w-4"/></button>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-14 z-0 w-[66%] max-w-[420px] es-ai-art-float sm:-bottom-14 sm:right-0 sm:w-[51%]"><AiArt kind="mascot" priority decorative sizes="(max-width: 640px) 260px, 420px"/></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[{n:"03",l:"Uncovered lessons",s:"Needs attention",c:"text-amber-600",icon:"swap" as const},{n:"12",l:"Registers reviewed",s:"Today so far",c:"text-indigo-600",icon:"attendance" as const},{n:"04",l:"Action suggestions",s:"Ready to explore",c:"text-emerald-600",icon:"bolt" as const}].map(item=><div key={item.l} className="rounded-[24px] border border-white bg-white p-5 shadow-[0_15px_45px_-30px_rgba(25,40,83,.32)]"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-slate-500">{item.l}</span><Icon name={item.icon} className="h-5 w-5 text-indigo-300"/></div><div className={"mt-3 text-4xl font-black tracking-tight "+item.c}>{item.n}</div><p className="mt-1 text-xs text-slate-500">{item.s} · Sample</p></div>)}
          </div>

          <div className="rounded-[26px] border border-white bg-white p-5 shadow-[0_16px_48px_-31px_rgba(23,42,82,.38)] sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-indigo-600">Daily intelligence</p><h2 className="mt-1 text-xl font-bold tracking-tight">Actions worth your attention</h2></div><span className="rounded-full bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">2 priorities</span></div>
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap items-start gap-4 rounded-[20px] border border-amber-100 bg-gradient-to-r from-amber-50/80 to-white p-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-amber-100/70"><AiArt kind="workflow" decorative sizes="64px"/></span><div className="min-w-[180px] flex-1"><p className="text-sm font-bold">Kavya ma'am is absent today</p><p className="mt-1 text-xs leading-6 text-slate-600">3 scheduled lessons need substitute cover. Would you like a plan?</p><button onClick={()=>ask(actions[0].prompt,"plan")} className="mt-3 rounded-full bg-[#26376f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-800">Prepare coverage →</button></div>
              </div>
              <div className="flex flex-wrap items-start gap-4 rounded-[20px] border border-indigo-100 bg-gradient-to-r from-indigo-50/70 to-white p-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-indigo-100/70"><AiArt kind="attendance" decorative sizes="64px"/></span><div className="min-w-[180px] flex-1"><p className="text-sm font-bold">Today's attendance is waiting</p><p className="mt-1 text-xs leading-6 text-slate-600">A teacher's class register can be prepared from roll numbers and sent for approval.</p><button onClick={()=>ask(actions[1].prompt,"attendance")} className="mt-3 text-xs font-bold text-indigo-700 hover:underline">Try an attendance action →</button></div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white bg-white p-5 sm:p-6"><h2 className="font-bold tracking-tight">Your school. Your choices.</h2><p className="mt-2 text-xs leading-6 text-slate-600">The complete experience will support officially connected AI models where available. Each action stays subject to EduSphere's school and role permissions. This showcase uses no account or school records.</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-xs text-slate-600">Your AI connects tools across classes, teachers and lessons — after approval.</p><span className="w-28 shrink-0"><AiArt kind="network" decorative sizes="112px"/></span></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800">ChatGPT · access pending</span><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800">Gemini · provider configuration</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">Gemini · not enabled</span></div></div>
        </section>

        <section id="demo-assistant" className={"overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_28px_90px_-31px_rgba(17,29,68,.34)] lg:sticky lg:top-24 "+(focused==="assistant"?"ring-2 ring-indigo-200":"")}>
          <div className="es-ai-ambient relative overflow-hidden px-5 pb-5 pt-6 text-white sm:px-6">
            <div className="es-ai-grid pointer-events-none absolute inset-0 opacity-35"/>
            <div className="relative flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="es-ai-orb grid h-12 w-12 place-items-center overflow-hidden rounded-[18px] border border-white/20 bg-white/15 p-0.5"><AiArt kind="mascot" decorative sizes="48px"/></span><div><h2 className="text-base font-bold tracking-tight">EduSphere Intelligence</h2><p className="text-[11px] text-indigo-200">Your operations copilot</p></div></div><span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-100">DEMO</span></div>
            <p className="relative mt-6 max-w-sm text-[22px] font-semibold leading-snug tracking-tight">Good ideas deserve <span className="text-amber-200">beautiful execution.</span></p>
          </div>
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[.15em] text-slate-500">Assistant mode</span><span className="text-[10px] text-slate-400">Interactive visual preview</span></div>
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">{([{id:"smart",label:"Smart"},{id:"fast",label:"Free actions"},{id:"providers",label:"Gemini"}] as const).map(m=><button key={m.id} aria-pressed={active===m.id} onClick={()=>setActive(m.id)} className={"rounded-xl px-2 py-2.5 text-xs transition "+(active===m.id?"bg-white font-bold text-indigo-800 shadow-sm":"text-slate-500 hover:bg-white/70")}>{m.label}</button>)}</div>
            <p className="mt-2.5 min-h-[34px] text-[11px] leading-5 text-slate-500">{active==="smart"?"In the actual app, free school actions run first; Gemini handles other questions if configured.":active==="fast"?"School lookups and approval previews work without AI inference fees.": "Gemini chatting requires official API access and school eligibility review. Google AI subscription sign-in does not supply inference quota."}</p>
          </div>
          <div className="max-h-[410px] min-h-[290px] space-y-4 overflow-y-auto bg-gradient-to-b from-[#fafbff] to-white px-4 py-5 sm:px-5" role="log" aria-live="polite">
            {messages.map(m=><div key={m.id} className={m.role==="user"?"ml-auto max-w-[91%] rounded-[18px] rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-sm leading-6 text-white":"max-w-[95%] rounded-[18px] rounded-bl-md border border-indigo-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"}>
              {m.role==="assistant"&&<p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-indigo-500">EduSphere · Demo</p>}
              {m.text}
              {m.kind==="plan"&&<div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3"><p className="text-xs font-bold text-indigo-900">Sample substitution plan</p>{["Period 1 · Class 8A → Mr. Sameer","Period 3 · Class 9B → Ms. Aisha","Period 5 · Class 7A → Mr. Rahman"].map(t=><p key={t} className="mt-2 rounded-lg bg-white px-2.5 py-2 text-xs text-slate-700">{t}</p>)}<span className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-800">PREVIEW ONLY · NO DATABASE WRITE</span></div>}
              {m.kind==="attendance"&&<div className="mt-3 grid grid-cols-3 gap-2 text-center">{[["29","Present","emerald"],["2","Absent","rose"],["1","Late","amber"]].map(([n,l])=><div key={l} className="rounded-xl border border-slate-100 bg-slate-50 p-2"><p className="text-xl font-black text-indigo-700">{n}</p><p className="text-[10px] text-slate-500">{l}</p></div>)}</div>}
              {m.kind==="summary"&&<p className="mt-3 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800">3 absent-teacher lessons · 12 reviewed registers · 4 suggested actions.</p>}
            </div>)}
            <div ref={end}/>
          </div>
          <div className="border-t border-indigo-50 px-4 pb-4 pt-3 sm:px-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.15em] text-slate-500">Try a workflow</p>
            <div className="mb-4 grid grid-cols-2 gap-2">{actions.map(a=><button key={a.title} onClick={()=>ask(a.prompt,a.kind)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/60 hover:shadow-sm"><Icon name={a.icon} className="h-4 w-4 text-indigo-600"/><span className="mt-2 block text-xs font-bold">{a.title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{a.description}</span></button>)}</div>
            <form onSubmit={send} className="flex items-end gap-2 rounded-[18px] border border-indigo-100 bg-[#f7f8fe] p-2 focus-within:ring-2 focus-within:ring-indigo-100"><label htmlFor="demo-input" className="sr-only">Try a sample command</label><textarea id="demo-input" value={draft} rows={2} maxLength={250} onChange={e=>setDraft(e.target.value)} placeholder="Ask EduSphere to help with your school…" className="min-h-12 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"/><button disabled={!draft.trim()} type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300" aria-label="Try command"><Icon name="send" className="h-4 w-4"/></button></form>
            <p className="mt-3 text-center text-[10px] text-slate-500">Interactive design demo · Fictional school data · No credentials required</p>
          </div>
        </section>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 px-2 pb-4 pt-7 text-xs text-slate-500"><span>© EduSphere · AI Studio design preview</span><Link href="/privacy" className="underline hover:text-indigo-800">Privacy</Link></footer>
    </main>
  </div>;
}
