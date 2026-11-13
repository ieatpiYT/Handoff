import { randomUUID } from "node:crypto";
import { backboard } from "@/lib/backboard";
import { sessionData, claim, release, finish } from "@/lib/store";
import { json, failure } from "@/lib/http";
export const maxDuration = 240;
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params, token = randomUUID(); let owned = false;
 try {
  const { session, project, handoffs } = await sessionData(id);
  const existing = handoffs.find(h=>h.sessionId===id); if (existing) return json({ handoff: existing });
  await claim(id,token); owned = true;
  const r = await backboard<{ content?: string }>("/threads/messages", { method: "POST", body: JSON.stringify({ thread_id: session.threadId, assistant_id: project.assistantId, content: "End this session and create a structured handoff. Return ONLY valid JSON with exactly these array keys: DONE, DECIDED, IN PROGRESS, BLOCKERS, NEXT STEPS. Use only facts from our conversation and shared memory.", llm_provider: session.modelProvider, model_name: session.modelName, memory: "Auto", json_output: true }) });
  const parsed = JSON.parse(r.content || "");
  const list = (key: string): string[] => {
   const value = parsed?.[key];
   if (!Array.isArray(value) || value.some(x=>typeof x!=="string")) throw new Error("Backboard returned an invalid handoff. Nothing was saved; please retry.");
   return value;
  };
  const handoff = { id: randomUUID(), projectId: project.id, sessionId: id, participantName: session.participantName, modelName: session.modelName, done: list("DONE"), decided: list("DECIDED"), inProgress: list("IN PROGRESS"), blockers: list("BLOCKERS"), nextSteps: list("NEXT STEPS"), createdAt: new Date().toISOString() };
  await finish(id,token,[],handoff); owned = false; return json({ handoff });
 } catch(e) { return failure(e); }
 finally { if (owned) await release(id,token).catch(()=>{}); }
}
