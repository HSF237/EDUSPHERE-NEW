"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/scope";
import { db } from "@/lib/db";
import { AgentError } from "@/lib/ai/policy";
import { configured, GeminiProvider, runAgent, type AgentReply } from "@/lib/ai/provider";
import { assertActor, cancelProposal, confirmProposal, declarations, dispatch, reserveBudget, type Actor } from "@/lib/ai/runtime";

const requestSchema=z.object({message:z.string().trim().min(1).max(4000),history:z.array(z.object({role:z.enum(["user","assistant"]),text:z.string().max(4000)}).strict()).max(6)}).strict();
const approvalSchema=z.object({id:z.string().min(1).max(128),fingerprint:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export async function copilotActor():Promise<Actor> {
  const ctx=await getCtx({allowLocked:true});
  const actor:Actor={...ctx,user:{id:ctx.user.id,mustChangePassword:ctx.user.mustChangePassword},timezone:ctx.user.school?.timezone ?? "Asia/Kolkata",readOnly:ctx.access?.state==="LOCKED"||ctx.access?.state==="SETUP"};
  assertActor(actor);
  if (!ctx.user.school?.active) throw new AgentError("This school is inactive.");
  return actor;
}
export async function chatWithCopilot(input:unknown):Promise<AgentReply> {
  const actor=await copilotActor();
  try {
    const parsed=requestSchema.safeParse(input);
    if (!parsed.success) throw new AgentError("Please enter a request under 4,000 characters.");
    if (!configured()) throw new AgentError("Gemini is not configured. Ask the site administrator to add GEMINI_API_KEY to the server environment.");
    await reserveBudget(actor);
    const {localDay}=await import("@/lib/ai/policy");
    return await runAgent(new GeminiProvider(),parsed.data.message,parsed.data.history,declarations(actor),call=>dispatch(actor,parsed.data.message,call),`Role: ${actor.role}. School timezone: ${actor.timezone}. Today's local date: ${localDay(new Date(),actor.timezone)}. Read-only account: ${actor.readOnly}. Validate exact values against the current user request.`);
  } catch (e) {
    await db.auditLog.create({data:{schoolId:actor.schoolId,userId:actor.user.id,action:"AI_REJECTED",entity:"Copilot",detail:JSON.stringify({reason:e instanceof AgentError?"policy_or_provider":"internal_error"})}}).catch(()=>{});
    return {text:"",error:e instanceof AgentError?e.message:"Copilot could not complete that request. No school actions were executed. Please try again."};
  }
}
export async function approveCopilot(input:unknown):Promise<{message?:string;error?:string;links?:{label:string;path:string}[]}> {
  const actor=await copilotActor();
  try {
    const parsed=approvalSchema.safeParse(input);
    if (!parsed.success) throw new AgentError("Invalid approval.");
    const result=await confirmProposal(actor,parsed.data.id,parsed.data.fingerprint) as Record<string,unknown>;
    revalidatePath("/","layout");
    if(result.kind==="executed"&&typeof result.completedActions==="number") {
      const actions=result.actions as {message:string;path?:string}[];
      return {message:String(result.message),links:actions.filter(a=>a.path&&/^\/(?:join\/(?:teacher|parent)|reset)\/[A-Za-z0-9_-]+$/.test(a.path)).map(a=>({label:a.message,path:a.path!}))};
    }
    return {message:Array.isArray(result.createdClasses)?`Created ${result.createdClasses.join(", ")} for ${result.academicYear}.`:`Assigned ${result.assignedPeriods} substitute periods on ${result.date}. Teacher notifications were not sent.`};
  } catch (e) {return {error:e instanceof AgentError?e.message:"Could not confirm the action. Refresh the preview before retrying."};}
}
export async function cancelCopilot(id:unknown):Promise<{error?:string}> {
  const actor=await copilotActor();
  try {
    const parsed=z.string().min(1).max(128).safeParse(id);
    if (!parsed.success) throw new AgentError("Invalid proposal.");
    await cancelProposal(actor,parsed.data);
    revalidatePath("/copilot");
    return {};
  } catch (e) {return {error:e instanceof AgentError?e.message:"Could not cancel the proposal. Please retry."};}
}

export async function saveCopilotAvailability(input:unknown):Promise<{error?:string}> {
  const actor=await copilotActor();
  try {const {saveAvailability}=await import("@/lib/ai/availability");await saveAvailability(actor,input);revalidatePath("/copilot");return {};}
  catch(e){return {error:e instanceof AgentError?e.message:"Could not save availability. Please refresh and retry."};}
}
export async function removeCopilotAvailability(id:unknown):Promise<{error?:string}> {
  const actor=await copilotActor();
  try {
    const parsed=z.string().min(1).max(128).safeParse(id);if(!parsed.success)throw new AgentError("Invalid availability record.");
    const {removeAvailability}=await import("@/lib/ai/availability");await removeAvailability(actor,parsed.data);revalidatePath("/copilot");return {};
  } catch(e){return {error:e instanceof AgentError?e.message:"Could not remove availability. Please retry."};}
}
