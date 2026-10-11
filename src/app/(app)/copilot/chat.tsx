"use client";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { AiArt, type AiArtKind } from "@/components/assistant/ai-art";
import type { Approval } from "@/lib/ai/provider";
import { approveCopilot, cancelCopilot, chatWithCopilot } from "./actions";

type Message={id:string;role:"user"|"assistant";text:string;approval?:Approval;links?:{label:string;path:string}[]};
type PlannedStep={action:string;title:string;before:unknown;after:unknown;effects:string[]};
const label=(key:string)=>key.replace(/([a-z])([A-Z])/g,"$1 $2").replace(/_/g," ").replace(/^./,s=>s.toUpperCase());
function ChangeDetails({value}:{value:unknown}) {
  if(value===null)return <span className="text-slate-500">None</span>;
  if(Array.isArray(value))return value.length?<ul className="space-y-2">{value.map((v,i)=><li key={i} className="rounded-lg border border-slate-100 bg-white p-2"><ChangeDetails value={v}/></li>)}</ul>:<span className="text-slate-500">None</span>;
  if(typeof value==="object"&&value)return <dl className="space-y-2">{Object.entries(value).filter(([k])=>!/(?:^id$|Id$|Ids$|^createdAt$|^schoolId$)/.test(k)).map(([k,v])=><div key={k}><dt className="text-xs font-medium text-slate-500">{label(k)}</dt><dd className="whitespace-pre-wrap break-words text-sm"><ChangeDetails value={v}/></dd></div>)}</dl>;
  return <span>{typeof value==="boolean"?value?"Yes":"No":String(value)}</span>;
}
function MessageText({text}:{text:string}) {
  return <div className="space-y-1 whitespace-pre-wrap break-words text-sm leading-6">{text.split("\n").map((line,i)=><p key={i}>{line.replace(/^\s*\* /,"• ").split(/(\*\*[^*]+\*\*)/g).map((part,j)=>part.startsWith("**")&&part.endsWith("**")?<strong key={j}>{part.slice(2,-2)}</strong>:part)}</p>)}</div>;
}
type SubstituteRow={className:string;subjectName:string;period:number;subTeacherName:string;startTime:string;endTime:string};
function editableCommand(approval:Approval):string {
  const changes=approval.changes;
  if (approval.tool==="create_classes") return `Create ${(changes.classCodes as string[]).join(", ")} for ${changes.academicYear}.`;
  if (approval.tool==="prepare_school_actions") return String(changes.summary);
  if (approval.tool==="mark_attendance") return `Mark roll ${(changes.absentRollNumbers as number[]).join(" and ") || "none"} absent and roll ${(changes.lateRollNumbers as number[]).join(" and ") || "none"} late on ${changes.date}.`;
  return `${changes.absentTeacherName} is absent on ${changes.date}. Prepare suitable substitute coverage.`;
}
function ApprovalCard({approval,onEdit,onComplete}:{approval:Approval;onEdit:(text:string)=>void;onComplete:(id:string,text:string,links?:{label:string;path:string}[])=>void}) {
  const [pending,startTransition]=useTransition();
  const [error,setError]=useState("");
  const [finished,setFinished]=useState(false);
  const lock=useRef(false);
  const changes=approval.changes;
  const classes=approval.tool==="create_classes"?changes.classCodes as string[]:null;
  const assignments=approval.tool==="plan_substitute_coverage"?changes.assignments as SubstituteRow[]:null;
  const steps=approval.tool==="prepare_school_actions"?changes.steps as PlannedStep[]:null;
  const attendance=approval.tool==="mark_attendance"?changes as {className:string;date:string;absentRollNumbers:number[];lateRollNumbers:number[];registeredStudents:number}:null;
  function act(kind:"confirm"|"cancel"|"edit") {
    if (lock.current || finished) return;
    lock.current=true;setError("");
    startTransition(async()=>{
      try {
        if (kind==="confirm") {
          const result=await approveCopilot({id:approval.id,fingerprint:approval.fingerprint});
          if (result.error) {setError(result.error);return;}
          setFinished(true);onComplete(approval.id,result.message ?? "Action completed.",result.links);
        } else {
          const result=await cancelCopilot(approval.id);
          if (result.error) {setError(result.error);return;}
          setFinished(true);onComplete(approval.id,kind==="edit"?"Preview cancelled. Edit the command to prepare a new one.":"Preview cancelled. No school changes were made.");
          if (kind==="edit") onEdit(editableCommand(approval));
        }
      } catch {setError("Connection lost. Retry confirmation to retrieve the action’s status; it will not run twice.");}
      finally {lock.current=false;}
    });
  }
  if (finished) return null;
  return <section className="mt-4 overflow-hidden rounded-2xl border border-brand-200 bg-white" aria-label="Proposed school changes">
    <div className="flex items-center gap-3 border-b border-brand-100 bg-brand-50 px-4 py-3"><Icon name="shield" className="h-5 w-5 text-brand-600" /><div><h3 className="font-semibold text-brand-950">{classes?"Create class divisions":steps?"Principal approval required":attendance?"Attendance register · teacher confirmation":"Proposed substitute plan"}</h3><p className="text-xs text-brand-700">Waiting for your approval</p></div></div>
    <div className="space-y-3 p-4">
      {steps && <><p className="text-sm font-medium">{String(changes.summary)}</p><ol className="space-y-4">{steps.map((s,i)=><li key={i} className="rounded-xl border border-slate-200 p-3"><h4 className="mb-3 font-semibold">{i+1}. {s.title}</h4><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-3"><p className="mb-2 text-xs font-semibold text-slate-500">Before</p><ChangeDetails value={s.before}/></div><div className="rounded-lg bg-brand-50 p-3"><p className="mb-2 text-xs font-semibold text-brand-700">After approval</p><ChangeDetails value={s.after}/></div></div>{s.effects.length>0&&<ul className="mt-3 space-y-1 text-xs text-amber-800">{s.effects.map((effect,j)=><li key={j}>{effect}</li>)}</ul>}</li>)}</ol><p className="text-xs text-slate-600">Approve all {steps.length} changes together. If any step becomes invalid, the entire batch is rolled back.</p></>}
      {classes && <><p className="text-sm text-slate-600">Academic year: <b>{String(changes.academicYear)}</b></p><ul className="flex flex-wrap gap-2">{classes.map(code=><li key={code} className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-800">+ Class {code}</li>)}</ul></>}
      {attendance && <div className="space-y-3"><p className="text-sm font-semibold text-slate-800">Class {attendance.className} · {attendance.date}</p><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-2xl font-black text-emerald-700">{attendance.registeredStudents-attendance.absentRollNumbers.length-attendance.lateRollNumbers.length}</p><p className="text-[11px] text-emerald-800">Present</p></div><div className="rounded-xl bg-red-50 p-3"><p className="text-2xl font-black text-red-700">{attendance.absentRollNumbers.length}</p><p className="text-[11px] text-red-800">Absent</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-2xl font-black text-amber-700">{attendance.lateRollNumbers.length}</p><p className="text-[11px] text-amber-800">Late</p></div></div><p className="text-xs text-slate-600">Absent roll numbers: {attendance.absentRollNumbers.join(", ") || "None"} · Late roll numbers: {attendance.lateRollNumbers.join(", ") || "None"}. All other active students will be marked present. Confirming sends the complete register for principal approval.</p></div>}
      {assignments && <><p className="text-sm text-slate-600"><b>{String(changes.absentTeacherName)}</b> will be recorded absent on <b>{String(changes.date)}</b>. Teacher notifications are off.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Substitute assignments to approve</caption><thead><tr className="text-slate-500"><th className="pb-2 pr-4">Period</th><th className="pb-2 pr-4">Class / subject</th><th className="pb-2">Substitute</th></tr></thead><tbody>{assignments.map((a,i)=><tr key={i} className="border-t border-slate-100"><td className="py-3 pr-4">{a.period}<span className="block text-xs text-slate-500">{a.startTime}–{a.endTime}</span></td><td className="py-3 pr-4">{a.className}<span className="block text-xs text-slate-500">{a.subjectName}</span></td><td className="py-3 font-medium">{a.subTeacherName}</td></tr>)}</tbody></table></div></>}
      <p className="text-xs text-slate-500">Preview expires at {new Date(approval.expiresAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"})} IST. School data and permissions are checked again when you confirm.</p>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2"><button disabled={pending} onClick={()=>act("confirm")} className="btn disabled:opacity-50">{pending?"Checking…":classes?"Confirm and create":"Approve all"}</button><button disabled={pending} onClick={()=>act("edit")} className="btn-ghost">Edit command</button><button disabled={pending} onClick={()=>act("cancel")} className="btn-ghost">Cancel</button></div>
    </div>
  </section>;
}
export function CopilotChat({ready,principal,readOnly,initialPreviews,draft,learner=false,claudeReady=false}:{ready:boolean;claudeReady?:boolean;principal:boolean;readOnly:boolean;initialPreviews:Approval[];learner?:boolean;draft?:{text:string;id:number}}) {
  const [messages,setMessages]=useState<Message[]>(initialPreviews.map(a=>({id:a.id,role:"assistant",text:"You have a pending preview to review.",approval:a})));
  const [input,setInput]=useState("");
  const [mode,setMode]=useState<"auto"|"local"|"gemini"|"claude">("auto");
  const inputId = useId();
  useEffect(()=>{if(draft?.text){setInput(draft.text);textarea.current?.focus();}},[draft?.id,draft?.text]);
  useEffect(()=>{setMessages(previous=>{const ids=new Set(previous.map(m=>m.id));const extra=initialPreviews.filter(a=>!ids.has(a.id));return extra.length?[...previous,...extra.map(a=>({id:a.id,role:"assistant" as const,text:"You have a pending preview to review.",approval:a}))]:previous;});},[initialPreviews]);
  const [pending,startTransition]=useTransition();
  const textarea=useRef<HTMLTextAreaElement>(null),sending=useRef(false);
  const examples=principal?["Show school status today.","Find available teachers in Period 3 today.","Create 4 new Class 8 divisions: 8A, 8B, 8C and 8D."]:learner?["Show my updates today.","Help me work through my homework one step at a time.","Explain photosynthesis simply."]:["Mark roll 5 and 17 absent and roll 9 late today.","Show my updates today.","Help me draft five science questions."];
  const suggestions: {title:string;description:string;art:AiArtKind;command:string}[] = principal ? [
    {title:"Morning briefing",description:"See what's happening across your school today.",art:"network",command:examples[0]},
    {title:"Plan substitutions",description:"Find available teachers before assigning coverage.",art:"workflow",command:examples[1]},
    {title:"Organize divisions",description:"Prepare new class divisions with a confirmation step.",art:"mascot",command:examples[2]},
  ] : learner ? [
    {title:"Today's learning",description:"Check your latest authorized school updates.",art:"attendance",command:examples[0]},
    {title:"Understand homework",description:"Work through a question with guided explanations.",art:"mascot",command:examples[1]},
    {title:"Explore a topic",description:"Ask a question whenever an AI provider is available.",art:"network",command:examples[2]},
  ] : [
    {title:"Take attendance",description:"Prepare a complete register with one clear instruction.",art:"attendance",command:examples[0]},
    {title:"Classroom updates",description:"Catch up on your authorized school notices.",art:"network",command:examples[1]},
    {title:"Plan a lesson",description:"Get help drafting learning activities and questions.",art:"mascot",command:examples[2]},
  ];
  function edit(text:string) {setInput(text);textarea.current?.focus();}
  function complete(id:string,text:string,links?:{label:string;path:string}[]) {setMessages(previous=>previous.map(m=>m.approval?.id===id?{...m,text,approval:undefined,links}:m));}
  function submit(event:React.FormEvent) {
    event.preventDefault();
    const message=input.trim();
    if (!message || sending.current) return;
    sending.current=true;setInput("");
    const history=messages.filter(m=>!m.approval).slice(-6).map(m=>({role:m.role,text:m.text.slice(0,4000)}));
    setMessages(previous=>[...previous,{id:crypto.randomUUID(),role:"user",text:message}]);
    startTransition(async()=>{
      try {
        const result=await chatWithCopilot({message,history,mode});
        setMessages(previous=>[...previous,{id:crypto.randomUUID(),role:"assistant",text:result.error ?? result.text,approval:result.approval}]);
      } catch {setMessages(previous=>[...previous,{id:crypto.randomUUID(),role:"assistant",text:"Could not connect to Copilot. Please try again."}]);}
      finally {sending.current=false;}
    });
  }
  return <div className="es-ai-studio overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-32px_rgba(24,34,73,.32)]">
    <div className="es-ai-ambient relative isolate overflow-hidden bg-[#101a36] px-5 pb-6 pt-7 text-white sm:px-7">
      <div aria-hidden="true" className="es-ai-grid absolute inset-0 opacity-40" />
      <div aria-hidden="true" className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-28 left-10 h-60 w-60 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3">
        <span className="flex items-center gap-3"><span className="es-ai-orb grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[18px] border border-white/20 bg-white/10 p-0.5 shadow-xl"><AiArt kind="mascot" decorative priority sizes="48px" /></span><span><span className="block text-lg font-black tracking-tight">EduSphere Intelligence</span><span className="block text-xs tracking-wide text-indigo-200">A calmer way to run your school</span></span></span>
        <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold tracking-wide text-emerald-200">SCHOOL-SCOPED</span>
      </div>
      <div className="relative mt-7 max-w-[74%] pb-3 sm:mt-8 sm:max-w-[61%] sm:pb-8">
        <p className="text-[10px] font-bold uppercase tracking-[.22em] text-amber-200/90 sm:text-[11px]">YOUR OPERATIONS COPILOT</p>
        <h3 className="mt-2 text-[23px] font-bold leading-tight tracking-[-.035em] sm:text-[30px]">A brighter way to <span className="text-amber-200">get things done.</span></h3>
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-indigo-100/90 sm:text-sm">From attendance to smart substitute plans — ask, review, and stay in control.</p>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-10 z-0 w-[51%] max-w-[290px] es-ai-art-float sm:-bottom-16 sm:-right-2 sm:w-[43%]"><AiArt kind={principal?"workflow":learner?"mascot":"attendance"} decorative priority sizes="(max-width: 640px) 160px, 290px"/></div>
    </div>
    <div className="border-b border-slate-200/70 bg-white/95 px-4 py-4 sm:px-6">
      <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-[.13em] text-slate-500">Assistant mode</p><span className="text-[11px] text-slate-500">Switch anytime</span></div>
      <div role="group" aria-label="Assistant mode" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5 sm:grid-cols-4">
        <button type="button" aria-pressed={mode==="auto"} onClick={()=>setMode("auto")} className={mode==="auto"?"rounded-xl bg-white px-2 py-2.5 text-xs font-bold text-indigo-800 shadow-sm":"rounded-xl px-2 py-2.5 text-xs font-medium text-slate-600 hover:bg-white/70"}>Smart</button>
        <button type="button" aria-pressed={mode==="local"} onClick={()=>setMode("local")} className={mode==="local"?"rounded-xl bg-white px-2 py-2.5 text-xs font-bold text-indigo-800 shadow-sm":"rounded-xl px-2 py-2.5 text-xs font-medium text-slate-600 hover:bg-white/70"}>Free actions</button>
        <button type="button" aria-pressed={mode==="gemini"} disabled={!ready} onClick={()=>setMode("gemini")} className={mode==="gemini"?"rounded-xl bg-white px-2 py-2.5 text-xs font-bold text-indigo-800 shadow-sm":"rounded-xl px-2 py-2.5 text-xs font-medium text-slate-600 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-45"}>Gemini {ready?"":"· off"}</button>
        <button type="button" aria-pressed={mode==="claude"} disabled={!claudeReady} onClick={()=>setMode("claude")} className={mode==="claude"?"rounded-xl bg-white px-2 py-2.5 text-xs font-bold text-indigo-800 shadow-sm":"rounded-xl px-2 py-2.5 text-xs font-medium text-slate-600 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-45"}>Claude {claudeReady?"":"· off"}</button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{mode==="local"?"No AI model required: supported school queries and approval-based workflows only.":mode==="gemini"?"Gemini uses official server API access, not your personal Gemini subscription.":mode==="claude"?"Claude Haiku uses official server API access, not a personal Claude subscription.":"First tries free school actions. For other requests, uses configured Gemini or Claude (in that order)."}</p>
      <details className="group mt-3 rounded-xl border border-slate-200/70 bg-slate-50">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-slate-700">Other AI accounts <span className="float-right text-slate-500">Connection availability ↗</span></summary>
        <div className="space-y-2 border-t border-slate-200 px-3 py-3 text-xs text-slate-600">
          <p><b className="text-slate-800">ChatGPT:</b> Personal-plan integration for hosted apps requires official access and approval. <a href="https://developers.openai.com/siwc/quickstart" target="_blank" rel="noopener noreferrer" className="underline">Learn about eligibility</a>.</p>
          <p><b className="text-slate-800">Claude:</b> Haiku 5.5 is supported via an optional official server API connection; consumer Claude subscriptions are separate.</p>
          <p><b className="text-slate-800">Gemini:</b> Flash-Lite is supported via an optional official server API connection; Google login alone does not grant model access.</p>
          <p className="text-amber-800">No personal AI login credentials or API keys are collected here. Unavailable providers are not represented as connected.</p>
        </div>
      </details>
    </div>
    {!ready && !claudeReady && <p role="status" className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">No model provider is configured. Free school operations and preview cards are still available. Ask an authorized administrator to enable an official connection.</p>}
    {readOnly && <p className="mx-5 mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">Your school is read-only. Copilot can answer permitted questions; school changes are disabled.</p>}
    <div className="space-y-5 p-5 sm:p-7" role="log" aria-live="polite" aria-relevant="additions">
      {!messages.length && <section aria-label="Get started with EduSphere Intelligence" className="space-y-5">
        <div className="relative grid grid-cols-[minmax(0,1fr)_100px] items-center gap-2 overflow-hidden rounded-[23px] border border-indigo-100 bg-gradient-to-r from-[#f1f4ff] via-white to-[#fffaf0] px-5 py-4 sm:grid-cols-[minmax(0,1fr)_160px] sm:px-6">
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-indigo-600">READY WHEN YOU ARE</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{principal?"Your next decision, made simpler.":learner?"Curiosity starts here.":"Make more room for teaching."}</h3>
            <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-600 sm:text-sm">Choose a task below, or ask your own question. Important school changes always need your confirmation.</p>
          </div>
          <AiArt kind="mascot" decorative sizes="(max-width: 640px) 100px, 160px" className="relative z-0 es-ai-art-float" />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-800">What can we do together?</h3>
          <p className="mt-1 text-xs text-slate-500">Choose a guided action — or write your own instruction below.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {suggestions.map(item=><button key={item.title} type="button" onClick={()=>edit(item.command)} disabled={pending} className="group relative flex min-h-40 flex-col overflow-hidden rounded-[22px] border border-indigo-100/80 bg-gradient-to-br from-white to-[#f7f8ff] px-4 pb-4 pt-2 text-left shadow-[0_12px_32px_-24px_rgba(49,46,129,.3)] transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_20px_35px_-20px_rgba(49,46,129,.35)] focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50">
              <span className="ml-auto block h-[91px] w-[100px] transition duration-500 group-hover:scale-110 sm:h-[105px] sm:w-[116px]"><AiArt kind={item.art} decorative sizes="116px"/></span>
              <span className="mt-auto block text-[13px] font-bold text-slate-900">{item.title} <span aria-hidden="true" className="text-indigo-600">↗</span></span>
              <span className="mt-1 block text-[11px] leading-5 text-slate-500">{item.description}</span>
            </button>)}
          </div>
        </div>
      </section>}
      {messages.map(m=><div key={m.id} className={m.role==="user"?"ml-auto max-w-[90%] rounded-2xl bg-brand-600 px-4 py-3 text-white":"max-w-full rounded-2xl bg-slate-50 px-4 py-3 text-slate-800"}><p className="mb-1 text-xs font-semibold opacity-65">{m.role==="user"?"You":"EduSphere"}</p><MessageText text={m.text}/>{m.links?.map(link=><a key={link.path} href={link.path} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl border border-brand-200 bg-white p-3 text-sm font-semibold text-brand-700">Open private link: {link.label}</a>)}{m.approval && <ApprovalCard approval={m.approval} onEdit={edit} onComplete={complete} />}</div>)}
      {pending && <p role="status" className="text-sm text-slate-500">EduSphere is checking your request…</p>}
    </div>
    <form onSubmit={submit} className="border-t border-slate-100 bg-gradient-to-b from-white to-indigo-50/60 p-4 sm:p-5"><label className="sr-only" htmlFor={inputId}>Your request to EduSphere</label><div className="flex items-end gap-3"><textarea id={inputId} ref={textarea} value={input} onChange={e=>setInput(e.target.value)} maxLength={4000} rows={3} disabled={pending} placeholder="Ask a question or describe a school action…" className="input min-h-20 flex-1 resize-y rounded-2xl border-indigo-100 bg-white shadow-sm disabled:opacity-50" /><button type="submit" disabled={pending || !input.trim()} className="btn shrink-0 disabled:opacity-50"><Icon name="send" className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Send</span></button></div><p className="mt-3 text-xs text-slate-500">AI responses can contain mistakes. School changes require a confirmed preview. Do not share passwords.</p></form>
  </div>;
}
