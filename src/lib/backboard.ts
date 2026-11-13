import "server-only";
const BASE = "https://app.backboard.io/api";
function key() { const value = process.env.BACKBOARD_API_KEY; if (!value) throw new Error("BACKBOARD_API_KEY is not configured on the server."); return value; }
export async function backboard<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, { ...init, signal: AbortSignal.timeout(180000), headers: { "X-API-Key": key(), "Content-Type": "application/json", ...(init.headers || {}) }, cache: "no-store" });
  const text = await res.text(); let body: unknown; try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) { const message = typeof body === "object" && body && "detail" in body ? String((body as { detail: unknown }).detail) : `Backboard returned ${res.status}`; throw new Error(message); }
  return body as T;
}
export function model(id: string) { const models: Record<string, { provider: string; name: string }> = { gpt: { provider: "openai", name: "gpt-4o" }, claude: { provider: "anthropic", name: "claude-sonnet-4-20250514" }, gemini: { provider: "google", name: "gemini-2.5-flash" } }; return models[id] || models.gpt; }
