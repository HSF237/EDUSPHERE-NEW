"use client";
import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
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
    <div className="flex items-center gap-3 border-b border-brand-100 bg-brand-50 px-4 py-3"><Icon name="shield" className="h-5 w-5 text-brand-600" /><div><h3 className="font-semibold text-brand-950">{classes?"Create class divisions":steps?"Principal approval required":"Proposed substitute plan"}</h3><p className="text-xs text-brand-700">Waiting for your approval</p></div></div>
    <div className="space-y-3 p-4">
      {steps && <><p className="text-sm font-medium">{String(changes.summary)}</p><ol className="space-y-4">{steps.map((s,i)=><li key={i} className="rounded-xl border border-slate-200 p-3"><h4 className="mb-3 font-semibold">{i+1}. {s.title}</h4><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-3"><p className="mb-2 text-xs font-semibold text-slate-500">Before</p><ChangeDetails value={s.before}/></div><div className="rounded-lg bg-brand-50 p-3"><p className="mb-2 text-xs font-semibold text-brand-700">After approval</p><ChangeDetails value={s.after}/></div></div>{s.effects.length>0&&<ul className="mt-3 space-y-1 text-xs text-amber-800">{s.effects.map((effect,j)=><li key={j}>{effect}</li>)}</ul>}</li>)}</ol><p className="text-xs text-slate-600">Approve all {steps.length} changes together. If any step becomes invalid, the entire batch is rolled back.</p></>}
      {classes && <><p className="text-sm text-slate-600">Academic year: <b>{String(changes.academicYear)}</b></p><ul className="flex flex-wrap gap-2">{classes.map(code=><li key={code} className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-800">+ Class {code}</li>)}</ul></>}
      {assignments && <><p className="text-sm text-slate-600"><b>{String(changes.absentTeacherName)}</b> will be recorded absent on <b>{String(changes.date)}</b>. Teacher notifications are off.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Substitute assignments to approve</caption><thead><tr className="text-slate-500"><th className="pb-2 pr-4">Period</th><th className="pb-2 pr-4">Class / subject</th><th className="pb-2">Substitute</th></tr></thead><tbody>{assignments.map((a,i)=><tr key={i} className="border-t border-slate-100"><td className="py-3 pr-4">{a.period}<span className="block text-xs text-slate-500">{a.startTime}–{a.endTime}</span></td><td className="py-3 pr-4">{a.className}<span className="block text-xs text-slate-500">{a.subjectName}</span></td><td className="py-3 font-medium">{a.subTeacherName}</td></tr>)}</tbody></table></div></>}
      <p className="text-xs text-slate-500">Preview expires at {new Date(approval.expiresAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"})} IST. School data and permissions are checked again when you confirm.</p>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2"><button disabled={pending} onClick={()=>act("confirm")} className="btn disabled:opacity-50">{pending?"Checking…":classes?"Confirm and create":"Approve all"}</button><button disabled={pending} onClick={()=>act("edit")} className="btn-ghost">Edit command</button><button disabled={pending} onClick={()=>act("cancel")} className="btn-ghost">Cancel</button></div>
    </div>
  </section>;
}
export function CopilotChat({ready,principal,readOnly,initialPreviews}:{ready:boolean;principal:boolean;readOnly:boolean;initialPreviews:Approval[]}) {
  const [messages,setMessages]=useState<Message[]>(initialPreviews.map(a=>({id:a.id,role:"assistant",text:"You have a pending preview to review.",approval:a})));
  const [input,setInput]=useState("");
  const [pending,startTransition]=useTransition();
  const textarea=useRef<HTMLTextAreaElement>(null),sending=useRef(false);
  const examples=principal?["Schedule a meeting for the teachers of Class IX. Ask me for the date, time and venue.","Create 4 new Class 8 divisions: 8A, 8B, 8C and 8D.","Find pending attendance and leave requests for my review."]:["Show the timetable for 8B tomorrow.","Help me explain photosynthesis.","Help me draft five science questions."];
  function edit(text:string) {setInput(text);textarea.current?.focus();}
  function complete(id:string,text:string,links?:{label:string;path:string}[]) {setMessages(previous=>previous.map(m=>m.approval?.id===id?{...m,text,approval:undefined,links}:m));}
  function submit(event:React.FormEvent) {
    event.preventDefault();
    const message=input.trim();
    if (!message || !ready || sending.current) return;
    sending.current=true;setInput("");
    const history=messages.filter(m=>!m.approval).slice(-6).map(m=>({role:m.role,text:m.text.slice(0,4000)}));
    setMessages(previous=>[...previous,{id:crypto.randomUUID(),role:"user",text:message}]);
    startTransition(async()=>{
      try {
        const result=await chatWithCopilot({message,history});
        setMessages(previous=>[...previous,{id:crypto.randomUUID(),role:"assistant",text:result.error ?? result.text,approval:result.approval}]);
      } catch {setMessages(previous=>[...previous,{id:crypto.randomUUID(),role:"assistant",text:"Could not connect to Copilot. Please try again."}]);}
      finally {sending.current=false;}
    });
  }
  return <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Icon name="bolt" /></span><div><h2 className="font-semibold text-slate-900">EduSphere AI</h2><p className="text-xs text-slate-500">Powered by Gemini · {principal?"School operations and insights":"Help for your authorized workspace"}</p></div></div>
    {!ready && <p role="status" className="m-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">AI setup is pending. Ask the site administrator to configure Gemini on the server.</p>}
    {readOnly && <p className="mx-5 mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">Your school is read-only. Copilot can answer permitted questions; school changes are disabled.</p>}
    <div className="space-y-5 p-5 sm:p-7" role="log" aria-live="polite" aria-relevant="additions">
      {!messages.length && <div className="py-6"><h3 className="text-xl font-semibold text-slate-900">What would you like to get done?</h3><p className="mt-2 text-sm text-slate-500">Use exact class divisions and teacher names. Proposed changes appear here for your review.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{examples.map(text=><button key={text} onClick={()=>edit(text)} disabled={!ready || pending} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50">{text}</button>)}</div></div>}
      {messages.map(m=><div key={m.id} className={m.role==="user"?"ml-auto max-w-[90%] rounded-2xl bg-brand-600 px-4 py-3 text-white":"max-w-full rounded-2xl bg-slate-50 px-4 py-3 text-slate-800"}><p className="mb-1 text-xs font-semibold opacity-65">{m.role==="user"?"You":"EduSphere"}</p><MessageText text={m.text}/>{m.links?.map(link=><a key={link.path} href={link.path} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl border border-brand-200 bg-white p-3 text-sm font-semibold text-brand-700">Open private link: {link.label}</a>)}{m.approval && <ApprovalCard approval={m.approval} onEdit={edit} onComplete={complete} />}</div>)}
      {pending && <p role="status" className="text-sm text-slate-500">EduSphere is checking your request…</p>}
    </div>
    <form onSubmit={submit} className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5"><label className="sr-only" htmlFor="copilot-message">Your request to EduSphere</label><div className="flex items-end gap-3"><textarea id="copilot-message" ref={textarea} value={input} onChange={e=>setInput(e.target.value)} maxLength={4000} rows={3} disabled={!ready || pending} placeholder="Ask a question or describe a school action…" className="input min-h-24 flex-1 resize-y disabled:opacity-50" /><button type="submit" disabled={!ready || pending || !input.trim()} className="btn shrink-0 disabled:opacity-50"><Icon name="send" className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Send</span></button></div><p className="mt-3 text-xs text-slate-500">AI responses can contain mistakes. School changes require a confirmed preview. Do not share passwords.</p></form>
  </div>;
}
