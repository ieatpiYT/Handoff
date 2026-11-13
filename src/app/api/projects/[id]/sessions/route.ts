import { randomUUID } from "node:crypto";
import { backboard, model } from "@/lib/backboard";
import { insertSession, projectData } from "@/lib/store";
import { input, json, failure, HttpError } from "@/lib/http";
import { MODELS } from "@/lib/types";
export const maxDuration = 240;
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
 try {
  const { id } = await params, body = await req.json();
  const participantName = input(body.participantName,"Your name");
  if (!MODELS.some(m => m.id === body.modelId)) throw new HttpError("Select a supported model.");
  const { project, handoffs } = await projectData(id), m = model(body.modelId);
  const thread = await backboard<{ thread_id: string }>(`/assistants/${project.assistantId}/threads`, { method: "POST" });
  let briefing = "No previous handoffs yet.";
  if (handoffs.length) {
   const r = await backboard<{ content?: string }>("/threads/messages", { method: "POST", body: JSON.stringify({ assistant_id: project.assistantId, thread_id: thread.thread_id, content: "Give a concise Catch Me Up briefing for a new teammate. Include DONE, DECIDED, IN PROGRESS, BLOCKERS, NEXT STEPS. Only use shared memory; do not add or change facts.", llm_provider: m.provider, model_name: m.name, memory: "Readonly", json_output: false }) });
   if (!r.content?.trim()) throw new Error("Backboard returned an empty briefing. Please retry.");
   briefing = r.content;
  }
  const session = { id: randomUUID(), projectId: id, participantName, modelProvider: m.provider, modelName: m.name, threadId: thread.thread_id, startedAt: new Date().toISOString(), briefing };
  await insertSession(session); return json({ session, briefing });
 } catch(e) { return failure(e); }
}
