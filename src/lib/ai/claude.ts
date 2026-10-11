import { AgentError } from "./policy";
import type { FunctionCall, ModelProvider, ProviderTurn } from "./provider";

type ClaudeBlock = Record<string,unknown>;
type ClaudeMessage = {role:"user"|"assistant";content:ClaudeBlock[]};

/** CLI/consumer subscriptions are NOT API access. Only official server credentials work here. */
export function claudeConfigured() { return Boolean(process.env.ANTHROPIC_API_KEY?.trim()); }

/** Translate only our bounded, trusted agent-runtime message envelopes. */
function buildMessages(input:Record<string,unknown>[]):ClaudeMessage[] {
  const result:ClaudeMessage[]=[];
  const makeText=(raw:unknown)=>Array.isArray(raw)
    ? raw.filter(x=>x&&typeof x==="object"&&(x as {type?:string}).type==="text"&&typeof (x as {text?:unknown}).text==="string") as ClaudeBlock[]
    : [];
  for(const step of input){
    if(step.type==="user_input" || step.type==="model_output") {
      const role=step.type==="user_input"?"user":"assistant";
      const content=makeText(step.content);
      if(!content.length)continue;
      const last=result[result.length-1];
      if(last?.role===role && !(role==="user" && last.content.some(c=>c.type==="tool_result"))) last.content.push(...content);
      else result.push({role,content});
    }else if(step.type==="claude_assistant"){
      if(!Array.isArray(step.content))throw new AgentError("Invalid Claude conversation state.");
      result.push({role:"assistant",content:step.content as ClaudeBlock[]});
    }else if(step.type==="function_result"){
      if(typeof step.call_id!=="string" || typeof step.name!=="string")throw new AgentError("Invalid Claude tool result.");
      const blocks=makeText(step.result);
      const toolResult:ClaudeBlock={
        type:"tool_result",tool_use_id:step.call_id,
        content:blocks.map(b=>String(b.text)).join("\n") || "{}"
      };
      const previous=result[result.length-1];
      if(previous?.role==="user" && previous.content.every(b=>b.type==="tool_result"))previous.content.push(toolResult);
      else result.push({role:"user",content:[toolResult]});
    }else{
      throw new AgentError("Unrecognized Claude conversation input.");
    }
  }
  // A model call cannot be issued with an unpaired tool invocation from the previous turn.
  return result;
}

/** Claude Messages API adapter preserving the shared validation/approval workflow. */
export class ClaudeProvider implements ModelProvider {
  constructor(
    private apiKey=process.env.ANTHROPIC_API_KEY ?? "",
    private model=process.env.CLAUDE_MODEL ?? "claude-haiku-5-5",
    private transport:typeof fetch=fetch,
    private log:(message:string)=>void=message=>console.warn(message),
  ) {}

  async generate(input:Record<string,unknown>[],system:string,tools:Record<string,unknown>[]):Promise<ProviderTurn> {
    if(!this.apiKey.trim())throw new AgentError("Claude is not configured. A Claude consumer login cannot be used as an API credential.");
    const messages=buildMessages(input);
    if(!messages.length)throw new AgentError("Claude needs a message before it can respond.");
    const declared=tools.map(t=>({
      name:String(t.name),description:String(t.description ?? ""),
      input_schema:t.parameters
    }));
    const body=JSON.stringify({
      model:this.model,
      max_tokens:4096,
      system,
      messages,
      tools:declared,
      tool_choice:{type:"auto",disable_parallel_tool_use:true},
    });
    let response:Response;
    try {
      response=await this.transport("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":"Bearer "+this.apiKey,
          "anthropic-version":"2023-06-01"
        },
        body,signal:AbortSignal.timeout(20000),cache:"no-store",
      });
    }catch{
      throw new AgentError("Claude did not respond in time. No school actions were executed.");
    }
    if(!response.ok){
      this.log("COPILOT_CLAUDE_HTTP "+JSON.stringify({status:response.status}));
      if(response.status===429)throw new AgentError("Claude's request limit was reached. Please try later.");
      if(response.status===402)throw new AgentError("Claude API usage is not available for this account. Ask your school's administrator.");
      if([401,403].includes(response.status))throw new AgentError("Claude rejected the server credentials. Ask the administrator to check the provider configuration.");
      if([400,404,422].includes(response.status))throw new AgentError("Claude rejected the model or request configuration. Check the Copilot provider settings.");
      if(response.status>=500)throw new AgentError("Claude is temporarily unavailable. No school actions were executed.");
      throw new AgentError("Claude could not process the request.");
    }
    let raw:string;
    try { raw=await response.text(); }
    catch {throw new AgentError("Claude returned an incomplete response.");}
    if(raw.length>1_000_000)throw new AgentError("Claude returned an oversized response.");
    let val:Record<string,unknown>;
    try {val=JSON.parse(raw);}
    catch {throw new AgentError("Claude returned an invalid response.");}
    if(!Array.isArray(val.content) || !val.content.every(x=>x&&typeof x==="object"))throw new AgentError("Claude returned an invalid message.");
    if(val.stop_reason==="refusal")throw new AgentError("Claude declined to complete this request.");
    if(val.stop_reason==="max_tokens" || val.stop_reason==="model_context_window_exceeded" || val.stop_reason==="pause_turn")throw new AgentError("Claude could not finish that request. Try a smaller task.");
    const blocks=val.content as ClaudeBlock[];
    const calls:FunctionCall[]=blocks.filter(b=>b.type==="tool_use").map(b=>{
      if(typeof b.id!=="string"||!b.id||typeof b.name!=="string"||!b.input||typeof b.input!=="object"||Array.isArray(b.input))throw new AgentError("Claude returned an invalid function call.");
      return {id:b.id,name:b.name,arguments:b.input};
    });
    if(new Set(calls.map(c=>c.id)).size!==calls.length)throw new AgentError("Claude returned duplicate tool IDs.");
    if(calls.length && val.stop_reason!=="tool_use")throw new AgentError("Claude returned an incomplete tool request.");
    if(val.stop_reason==="tool_use" && !calls.length)throw new AgentError("Claude did not provide a tool call.");
    return {
      steps:[{type:"claude_assistant",content:blocks}],
      calls,
      text:blocks.filter(b=>b.type==="text" && typeof b.text==="string").map(b=>b.text).join("\n").slice(0,16000)
    };
  }
}
