"use client";
export function HomeworkHelp({id}:{id:string}) {
  return <button type="button" className="mt-3 btn-ghost" onClick={() => window.dispatchEvent(new CustomEvent("edusphere-assistant", {detail:{prompt:`Read my authorized homework with ID ${id} and help me understand it step by step. Ask what I have tried before giving hints.`}}))}>Help with this homework</button>;
}
