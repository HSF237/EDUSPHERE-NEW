import { z } from "zod";
import { classCode, AgentError } from "./policy";
export type Capability = "CLASSES" | "SUBSTITUTES" | "REPORTS" | "STAFF" | "SCOPED";
export type Tool = { name: string; description: string; schema: z.ZodTypeAny; parameters: Record<string,unknown>; allowedRoles: string[]; capability: Capability; readOnly: boolean; requiresConfirmation: boolean; riskLevel: "low"|"medium"|"high"; audit: boolean; enabled: boolean };
const text = { type:"string" };
const date = { type:"string", description:"Copy the date phrase exactly from the user: today, tomorrow, yesterday or YYYY-MM-DD. Never guess." };
const teacher = { type:"string", description:"Exact teacher name as written in the user request. Backend resolves within this school." };
const cls = { type:"string", description:"Exact class name including division, e.g. 8B. Never infer section letters." };
const string = z.string().trim().min(1).max(256);
const params = (properties: Record<string,unknown>) => ({type:"object",properties,required:Object.keys(properties),additionalProperties:false});
const define = (name:string, description:string, schema:z.ZodTypeAny, properties:Record<string,unknown>, capability:Capability, readOnly=true): Tool => ({name,description,schema,parameters:params(properties),capability,allowedRoles:readOnly?["ADMIN","TEACHER","PARENT"]:["ADMIN"],readOnly,requiresConfirmation:!readOnly,riskLevel:readOnly?"low":"medium",audit:true,enabled:true});
export const TOOLS: Tool[] = [
  define("create_classes","Prepare a batch of explicitly named class divisions for principal approval. Does not execute changes.",z.object({class_codes:z.array(classCode).min(1).max(20),academic_year:string}).strict(),{class_codes:{type:"array",items:cls},academic_year:{type:"string",description:"Exact academic year from request, or 'active' when omitted. Backend year appears in preview."}},"CLASSES",false),
  define("plan_substitute_coverage","Prepare substitutions for one explicitly named absent teacher. Requires principal confirmation; never writes from a model call.",z.object({teacher_name:string,date:string}).strict(),{teacher_name:teacher,date},"SUBSTITUTES",false),
  define("get_school_status","Read date-specific attendance summary, absent teachers, uncovered lessons, and pending approvals. No individual student details.",z.object({date:string}).strict(),{date},"REPORTS"),
  define("get_attendance","Read approved attendance totals for an exact authorized class and date. Returns aggregate counts, not student identities.",z.object({class_code:classCode,date:string}).strict(),{class_code:cls,date},"STAFF"),
  define("get_class_timetable","Read the exact class timetable and approved substitutions for a date.",z.object({class_code:classCode,date:string}).strict(),{class_code:cls,date},"SCOPED"),
  define("get_teacher_timetable","Read a named teacher’s timetable. Staff with substitute permission can query school staff; ordinary teachers can query only themselves.",z.object({teacher_name:string,date:string}).strict(),{teacher_name:teacher,date},"SUBSTITUTES"),
  define("get_available_teachers","Read free, available teachers for an explicit period/date. Planning still checks subject qualification and workload limits.",z.object({period:z.number().int().min(1).max(20),date:string}).strict(),{period:{type:"integer",minimum:1,maximum:20},date},"SUBSTITUTES"),
];
// Full roadmap catalog: declarations stay disabled until validated backend handlers exist.
const future: [string,Record<string,unknown>,Capability,boolean][] = [
  ["create_class",{grade:{type:"integer"},section:text,academic_year:text},"CLASSES",false],
  ["update_class",{class_code:cls,new_class_code:cls,academic_year:text},"CLASSES",false],
  ["archive_class",{class_code:cls,academic_year:text},"CLASSES",false],
  ["get_attendance_summary",{date,below_percent:{type:"number"}},"REPORTS",true],
  ["assign_substitute",{approved_plan_id:text},"SUBSTITUTES",false],
  ["assign_class_teacher",{class_code:cls,teacher_name:teacher},"CLASSES",false],
  ["assign_subject_teacher",{class_code:cls,teacher_name:teacher,subject:text},"CLASSES",false],
  ["move_class_period",{class_code:cls,subject:text,date,from_period:{type:"integer"},to_period:{type:"integer"}},"SUBSTITUTES",false],
  ["create_homework_draft",{class_code:cls,subject:text,topic:text,question_count:{type:"integer"}},"STAFF",false],
  ["publish_homework",{draft_id:text},"STAFF",false],
  ["generate_class_report",{class_code:cls,from_date:date,to_date:date},"STAFF",true],
  ["generate_student_report",{student_id:text,from_date:date,to_date:date},"STAFF",true],
  ["create_announcement_draft",{audience_id:text,title:text,body:text},"STAFF",false],
  ["publish_announcement",{draft_id:text},"STAFF",false],
  ["create_teacher_account",{display_name:text,email:text,subject:text},"CLASSES",false],
  ["create_student_account",{display_name:text,class_code:cls,guardian_email:text},"CLASSES",false],
  ["get_student_performance",{student_id:text},"STAFF",true],
  ["get_class_performance",{class_code:cls},"STAFF",true],
  ["calculator",{expression:text},"SCOPED",true],
];
for (const [name,properties,capability,readOnly] of future) TOOLS.push({...define(name,"Planned integration; unavailable until implemented.",z.never(),properties,capability,readOnly),enabled:false});
export function toolByName(name: string): Tool {
  const tool = TOOLS.find(t=>t.name===name && t.enabled);
  if (!tool) throw new AgentError("That action is not available yet. No changes were made.");
  return tool;
}
export function validateCall(name: string, arguments_: unknown): Record<string,unknown> {
  const parsed = toolByName(name).schema.safeParse(arguments_);
  if (!parsed.success) throw new AgentError("The AI supplied incomplete or invalid arguments. Please restate the request with exact values.");
  return parsed.data;
}
