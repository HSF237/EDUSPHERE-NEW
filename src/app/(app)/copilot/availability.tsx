"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeCopilotAvailability, saveCopilotAvailability } from "./actions";
type Record_={id:string;teacher:string;date:string;kind:string;startTime:string|null;endTime:string|null;reason?:string|null};
export function TeacherAvailability({teachers,records,today,readOnly}:{teachers:{id:string;name:string;maxDailyPeriods:number;maxSubstitutePeriods:number}[];records:Record_[];today:string;readOnly:boolean}) {
  const [teacherId,setTeacherId]=useState(teachers[0]?.id ?? ""),[date,setDate]=useState(today),[kind,setKind]=useState("ABSENT"),[startTime,setStartTime]=useState("09:00"),[endTime,setEndTime]=useState("10:00"),[error,setError]=useState(""),[notice,setNotice]=useState(""),[reason,setReason]=useState("");
  const [pending,startTransition]=useTransition(),router=useRouter();
  const selected=teachers.find(t=>t.id===teacherId);
  function save(event:React.FormEvent) {
    event.preventDefault();setError("");setNotice("");
    startTransition(async()=>{try{const result=await saveCopilotAvailability({teacherId,date,kind,reason,startTime:kind==="BLOCKED"?startTime:"",endTime:kind==="BLOCKED"?endTime:""});if(result.error)setError(result.error);else{setNotice("Availability saved. Prepare a new substitute plan using the updated records.");router.refresh();}}catch{setError("Connection lost. Refresh to check the record before retrying.");}});
  }
  function remove(id:string) {
    setError("");startTransition(async()=>{try{const result=await removeCopilotAvailability(id);if(result.error)setError(result.error);else router.refresh();}catch{setError("Could not connect. Please retry.");}});
  }
  return <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-semibold text-slate-800">Teacher availability for substitute planning</summary><p className="mt-3 text-sm text-slate-500">Record known absences, exam duties and other blocked times before planning. Current subject assignments determine eligibility.</p>
    <form onSubmit={save} className="mt-4 space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div><label className="label" htmlFor="ai-availability-teacher">Teacher</label><select id="ai-availability-teacher" className="input" value={teacherId} onChange={e=>setTeacherId(e.target.value)} required disabled={pending||readOnly}>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div><div><label className="label" htmlFor="ai-availability-date">Date</label><input id="ai-availability-date" type="date" min={today} value={date} onChange={e=>setDate(e.target.value)} className="input" required disabled={pending||readOnly}/></div><div><label className="label" htmlFor="ai-availability-kind">Availability</label><select id="ai-availability-kind" className="input" value={kind} onChange={e=>setKind(e.target.value)} disabled={pending||readOnly}><option value="ABSENT">Absent all day</option><option value="BLOCKED">Blocked time / exam duty</option></select></div></div>
      {kind==="BLOCKED" && <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="ai-block-start">Start</label><input id="ai-block-start" type="time" className="input" value={startTime} onChange={e=>setStartTime(e.target.value)} required disabled={pending||readOnly}/></div><div><label className="label" htmlFor="ai-block-end">End</label><input id="ai-block-end" type="time" className="input" value={endTime} onChange={e=>setEndTime(e.target.value)} required disabled={pending||readOnly}/></div></div>}
      <div><label className="label" htmlFor="ai-availability-reason">Reason (optional; visible to the principal)</label><input id="ai-availability-reason" className="input" value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} disabled={pending||readOnly}/></div>
      {selected && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Proposed availability: <b>{selected.name}</b> — {date}, {kind==="ABSENT"?"absent all day":`blocked ${startTime}–${endTime}`}.<span className="mt-1 block text-xs">Workload limits: {selected.maxSubstitutePeriods} substitute periods and {selected.maxDailyPeriods} total periods per day.</span></p>}
      <button className="btn disabled:opacity-50" disabled={pending||readOnly||!teacherId}>{pending?"Saving…":"Confirm availability"}</button>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-3 text-sm text-brand-700">{notice}</p>}
    <ul className="mt-4 divide-y divide-slate-100">{records.map(r=><li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span><b>{r.teacher}</b> · {r.date} · {r.kind==="ABSENT"?"Absent":`${r.startTime}–${r.endTime} blocked`}{r.reason&&<span className="block text-xs text-slate-500">Reason: {r.reason}</span>}</span><button type="button" onClick={()=>remove(r.id)} disabled={pending||readOnly} className="btn-ghost text-xs">Remove unavailable period</button></li>)}</ul>
  </details>;
}
