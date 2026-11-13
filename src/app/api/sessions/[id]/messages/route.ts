import { randomUUID } from "node:crypto";
import { backboard } from "@/lib/backboard";
import { sessionData, claim, release, finish } from "@/lib/store";
import { input, json, failure } from "@/lib/http";
export const maxDuration = 240;
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params, token = randomUUID(); let owned = false;
 try {
  const content = input((await req.json()).content, "Message", 32000);
  const { session, project } = await sessionData(id); await claim(id,token); owned = true;
  const user = { id: randomUUID(), sessionId: id, role: "user" as const, content, modelName: session.modelName, createdAt: new Date().toISOString() };
  const r = await backboard<{ content?: string }>("/threads/messages", { method: "POST", body: JSON.stringify({ thread_id: session.threadId, assistant_id: project.assistantId, content, llm_provider: session.modelProvider, model_name: session.modelName, memory: "Auto", memory_response_citation: true }) });
  if (!r.content?.trim()) throw new Error("Backboard returned an empty response.");
  const assistant = { ...user, id: randomUUID(), role: "assistant" as const, content: r.content, createdAt: new Date().toISOString() };
  await finish(id,token,[user,assistant]); owned = false; return json({ user, assistant });
 } catch(e) { return failure(e); }
 finally { if (owned) await release(id,token).catch(()=>{}); }
}
