import { z } from "zod";
import { PERM_KEYS } from "../perms";
import { AgentError } from "./policy";
const id=z.string().min(1).max(128).describe("Existing ID returned by search_school_records. Never invent IDs.");
const text=z.string().trim().min(1).max(120);
const content=z.string().trim().min(1).max(4000);
const nullableText=z.string().trim().max(1000).nullable();
export const calendarDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{
  const d=new Date(s+"T00:00:00Z");return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;
},"Use a real calendar date.");
const time=z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).describe("Explicit school local time in 24-hour HH:MM.");
const money=z.number().int().min(1).max(10000000).describe("Whole Indian rupees, copied exactly from the user.");
const action=<N extends string,S extends z.ZodRawShape>(name:N,fields:S)=>z.object({action:z.literal(name),...fields}).strict();
export const operationSchema=z.discriminatedUnion("action",[
  action("create_subject",{name:text,code:z.string().trim().regex(/^[A-Z0-9_-]{1,6}$/)}),
  action("update_class",{class_id:id,room:nullableText,class_teacher_id:id.nullable()}),
  action("assign_subject_teacher",{class_id:id,subject_id:id,teacher_id:id}),
  action("remove_subject_assignment",{assignment_id:id}),
  action("update_teacher_access",{teacher_id:id,position:nullableText,permissions:z.array(z.enum(PERM_KEYS as [typeof PERM_KEYS[number],...typeof PERM_KEYS[number][]])).max(PERM_KEYS.length),max_daily_periods:z.number().int().min(1).max(20),max_substitute_periods:z.number().int().min(0).max(10)}),
  action("set_account_active",{user_id:id,active:z.boolean()}),
  action("create_teacher_invitation",{}),
  action("create_parent_invitation",{student_id:id}),
  action("create_reset_link",{user_id:id}),
  action("revoke_invitation",{invitation_id:id}),
  action("create_student",{class_id:id,name:text,gender:z.enum(["F","M"]),admission_number:text,roll_number:z.number().int().min(1).max(10000),date_of_birth:calendarDate.nullable()}),
  action("update_student",{student_id:id,class_id:id,name:text,roll_number:z.number().int().min(1).max(10000),active:z.boolean()}),
  action("link_parent",{student_id:id,user_id:id,relation:text}),
  action("schedule_staff_meeting",{title:text,agenda:content,date:calendarDate,start_time:time,end_time:time,venue:nullableText,class_ids:z.array(id).max(50),teacher_ids:z.array(id).max(100).describe("Empty to include teachers assigned to the selected classes. Ask for explicit audience.")}),
  action("cancel_staff_meeting",{meeting_id:id}),
  action("schedule_parent_meeting",{title:text,date:calendarDate,venue:nullableText,start_time:time,end_time:time,slot_minutes:z.number().int().min(5).max(30),class_ids:z.array(id).min(1).max(50)}),
  action("cancel_parent_meeting",{event_id:id}),
  action("post_announcement",{title:text,body:content,audience:z.enum(["ALL","TEACHERS","PARENTS","CLASS"]),class_id:id.nullable(),pinned:z.boolean()}),
  action("delete_announcement",{announcement_id:id}),
  action("send_message",{user_id:id,body:content}),
  action("create_homework",{class_id:id,subject_id:id,title:text,description:z.string().trim().min(3).max(2000),due_date:calendarDate}),
  action("close_homework",{homework_id:id}),
  action("set_homework_submission",{homework_id:id,student_id:id,done:z.boolean()}),
  action("add_diary_entry",{class_id:id,teacher_id:id,date:calendarDate,subject:text,topic:text,notes:nullableText}),
  action("add_portion",{class_id:id,subject_id:id,date:calendarDate,topic:text,notes:nullableText}),
  action("delete_portion",{portion_id:id}),
  action("set_timetable_period",{class_id:id,subject_id:id,teacher_id:id,day:z.number().int().min(0).max(6).describe("Monday=0 through Sunday=6"),period:z.number().int().min(1).max(20),start_time:time,end_time:time}),
  action("remove_timetable_period",{slot_id:id}),
  action("create_exam",{class_id:id,name:text,max_marks:z.number().int().min(1).max(1000),pass_marks:z.number().int().min(0).max(1000),start_date:calendarDate}),
  action("set_exam_schedule",{exam_id:id,subject_id:id,date:calendarDate,start_time:time}),
  action("set_exam_published",{exam_id:id,published:z.boolean()}),
  action("record_marks",{exam_id:id,subject_id:id,entries:z.array(z.object({student_id:id,score:z.number().min(0).max(1000)}).strict()).min(1).max(100)}),
  action("review_attendance",{session_id:id,approve:z.boolean(),note:nullableText}),
  action("record_attendance",{class_id:id,date:calendarDate,entries:z.array(z.object({student_id:id,status:z.enum(["PRESENT","ABSENT","LATE","EXCUSED"]),note:nullableText}).strict()).min(1).max(100)}),
  action("decide_leave",{leave_id:id,approve:z.boolean(),note:nullableText}),
  action("create_fee",{name:text,amount:money,due_date:calendarDate,class_id:id.nullable()}),
  action("delete_fee",{fee_id:id}),
  action("record_fee_payment",{student_id:id,fee_id:id.nullable(),amount:money,mode:z.enum(["Cash","UPI","Card","Bank transfer","Cheque","Waiver / concession"]),date:calendarDate,reference:nullableText,note:nullableText}),
  action("update_school_branding",{brand_color:z.string().regex(/^#[0-9a-fA-F]{6}$/),signatory_name:text,signatory_title:text}),
]);
export type SchoolOperation=z.infer<typeof operationSchema>;
export const batchSchema=z.object({summary:z.string().trim().min(3).max(300),actions:z.array(operationSchema).min(1).max(10)}).strict();
export const RESOURCES=["classes","subjects","teachers","students","parents","assignments","meetings","parent_meetings","announcements","homework","portions","diary","timetable","exams","exam_schedule","marks","attendance","leave","fees","payments","invitations","school_settings","my_conversations"] as const;
export const searchSchema=z.object({resource:z.enum(RESOURCES),query:z.string().trim().max(100),class_id:id.nullable(),grade:z.number().int().min(1).max(12).nullable(),offset:z.number().int().min(0).max(10000)}).strict();

// Convert only the small, explicit Zod vocabulary above; never expose an unvalidated JSON argument bag.
export function jsonSchema(schema:z.ZodTypeAny):Record<string,unknown> {
  const d=schema._def;
  let value:Record<string,unknown>;
  if (schema instanceof z.ZodEffects) return jsonSchema(d.schema);
  if (schema instanceof z.ZodNullable) return {anyOf:[jsonSchema(d.innerType),{type:"null"}],...(schema.description?{description:schema.description}:{})};
  if (schema instanceof z.ZodDiscriminatedUnion) return {anyOf:d.options.map(jsonSchema)};
  if (schema instanceof z.ZodObject) {
    const shape=schema.shape;
    value={type:"object",properties:Object.fromEntries(Object.entries(shape).map(([k,s])=>[k,jsonSchema(s as z.ZodTypeAny)])),required:Object.keys(shape),additionalProperties:false};
  } else if (schema instanceof z.ZodArray) value={type:"array",items:jsonSchema(d.type),...(d.minLength?{minItems:d.minLength.value}:{}),...(d.maxLength?{maxItems:d.maxLength.value}:{})};
  else if (schema instanceof z.ZodLiteral) value={type:typeof d.value,enum:[d.value]};
  else if (schema instanceof z.ZodEnum) value={type:"string",enum:d.values};
  else if (schema instanceof z.ZodBoolean) value={type:"boolean"};
  else if (schema instanceof z.ZodString) {
    value={type:"string"};
    for(const c of d.checks) {if(c.kind==="min")value.minLength=c.value;if(c.kind==="max")value.maxLength=c.value;if(c.kind==="regex")value.pattern=c.regex.source;}
  } else if (schema instanceof z.ZodNumber) {
    value={type:d.checks.some((c:{kind:string})=>c.kind==="int")?"integer":"number"};
    for(const c of d.checks) {if(c.kind==="min")value.minimum=c.value;if(c.kind==="max")value.maximum=c.value;}
  } else throw new AgentError("Unsupported operation schema.");
  if(schema.description)value.description=schema.description;
  return value;
}
export const OPERATION_NAMES=operationSchema.options.map(s=>s.shape.action.value);
