import { AgentError, overlap, type Interval } from "./policy";
export type Slot = Interval & { id:string; teacherId:string; classId:string; className:string; subjectId:string; subjectName:string; period:number };
export type Candidate = {id:string;name:string;userId:string;subjectIds:string[];maxSubstitutePeriods:number;maxDailyPeriods:number};
export type Availability = {teacherId:string;kind:string;startTime:string|null;endTime:string|null};
export type Assignment = {slotId:string;className:string;subjectName:string;period:number;startTime:string;endTime:string;absentTeacherId:string;subTeacherId:string;subTeacherName:string;subUserId:string};
export type PlanningData = {slots:Slot[];teachers:Candidate[];availability:Availability[];existing:{slotId:string;subTeacherId:string}[]};
export function isFree(data: PlanningData, teacher: Candidate, interval: Interval, planned: Assignment[] = []): boolean {
  overlap(interval, interval); // Validate even when the teacher has no other bookings.
  const blocked = data.availability.filter(a=>a.teacherId===teacher.id);
  if (blocked.some(a=>a.kind==="ABSENT" || !a.startTime || !a.endTime || overlap(interval,{startTime:a.startTime,endTime:a.endTime}))) return false;
  const regular = data.slots.filter(s=>s.teacherId===teacher.id);
  const subs = data.existing.filter(s=>s.subTeacherId===teacher.id).map(s=>data.slots.find(slot=>slot.id===s.slotId));
  // A missing referenced slot is inconsistent input, never a free teacher.
  if (subs.some(s=>!s)) throw new AgentError("Substitution data is inconsistent. Please fix it before planning.");
  const extra = planned.filter(p=>p.subTeacherId===teacher.id);
  if (subs.length+extra.length >= teacher.maxSubstitutePeriods || regular.length+subs.length+extra.length >= teacher.maxDailyPeriods) return false;
  return ![...regular,...subs as Slot[],...extra].some(s=>overlap(interval,s));
}
export function planCoverage(data: PlanningData, absentTeacherId:string): {assignments:Assignment[];gaps:{className:string;period:number}[]} {
  const covered = new Set(data.existing.map(s=>s.slotId));
  const eligible = (s:Slot,p:Assignment[]) => data.teachers.filter(t=>t.id!==absentTeacherId && t.subjectIds.includes(s.subjectId) && isFree(data,t,s,p));
  const affected = data.slots.filter(s=>s.teacherId===absentTeacherId && !covered.has(s.id));
  affected.sort((a,b)=>eligible(a,[]).length-eligible(b,[]).length || a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
  const assignments:Assignment[] = [], gaps:{className:string;period:number}[] = [];
  for (const slot of affected) {
    const options = eligible(slot,assignments);
    const load = (id:string) => data.slots.filter(s=>s.teacherId===id).length + data.existing.filter(s=>s.subTeacherId===id).length + assignments.filter(s=>s.subTeacherId===id).length;
    options.sort((a,b)=>load(a.id)-load(b.id) || a.id.localeCompare(b.id));
    const teacher = options[0];
    if (!teacher) {gaps.push({className:slot.className,period:slot.period});continue;}
    assignments.push({slotId:slot.id,className:slot.className,subjectName:slot.subjectName,period:slot.period,startTime:slot.startTime,endTime:slot.endTime,absentTeacherId,subTeacherId:teacher.id,subTeacherName:teacher.name,subUserId:teacher.userId});
  }
  return {assignments:assignments.sort((a,b)=>a.startTime.localeCompare(b.startTime)||a.slotId.localeCompare(b.slotId)),gaps};
}
