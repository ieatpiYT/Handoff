import { randomUUID } from "node:crypto";
import { backboard } from "@/lib/backboard";
import { insertProject } from "@/lib/store";
import { database } from "@/lib/supabase";
import { input, json, failure } from "@/lib/http";
export const maxDuration = 240;
export async function POST(req: Request) {
 try {
  const body = await req.json(), name = input(body.name, "Project name"); database();
  const a = await backboard<{ assistant_id: string }>("/assistants", { method: "POST", body: JSON.stringify({ name: `Handoff — ${name}`, system_prompt: "You are the shared project copilot. Use project memory across teammates. Be concrete, cite known decisions, and never invent facts.", tok_k: 10 }) });
  const project = { id: randomUUID(), name, description: typeof body.description === "string" ? body.description.slice(0,4000) : "", assistantId: a.assistant_id, createdAt: new Date().toISOString() };
  await insertProject(project); return json({ project });
 } catch(e) { return failure(e); }
}
