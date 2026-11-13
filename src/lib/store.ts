import "server-only";
import { database } from "./supabase";
import { HttpError, validId } from "./http";
import type { Project, Session, Handoff, Message } from "./types";

export async function projectData(id: string) {
  validId(id);
  const { data, error } = await database().rpc("handoff_snapshot", { project_id: id });
  if (error) throw new Error("Database unavailable. Verify Supabase configuration and run the migration.");
  if (!data) throw new HttpError("Project not found.", 404);
  return data as { project: Project; sessions: Session[]; messages: Message[]; handoffs: Handoff[] };
}
export async function insertProject(project: Project) {
  const { error } = await database().from("projects").insert(project);
  if (error) throw new Error("Could not save project. Verify the Supabase migration.");
}
export async function insertSession(session: Session) {
  const { error } = await database().from("sessions").insert(session);
  if (error) throw new Error("Could not save session.");
}
export async function sessionData(id: string) {
  validId(id);
  if (id.length !== 36) throw new HttpError("Invalid session ID.");
  const { data, error } = await database().from("sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Database unavailable. Verify the Supabase migration.");
  if (!data) throw new HttpError("Session not found.", 404);
  const session = data as Session;
  return { session, ...(await projectData(session.projectId)) };
}
export async function claim(id: string, token: string) {
  const { data, error } = await database().rpc("handoff_claim", { session_id: id, token });
  if (error) throw new Error("Could not reserve session operation.");
  if (!data) throw new HttpError("Session is closed or another request is running. Retry shortly.", 409);
}
export async function release(id: string, token: string) {
  await database().from("sessions").update({ operation_token: null, operation_until: null }).eq("id", id).eq("operation_token", token);
}
export async function finish(id: string, token: string, messages: Message[] = [], handoff: Handoff | null = null) {
  const { error } = await database().rpc("handoff_finish", { session_id: id, token, new_messages: messages, new_handoff: handoff });
  if (error) throw new Error("Could not commit session result. Refresh before retrying.");
}

