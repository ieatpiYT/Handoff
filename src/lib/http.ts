import "server-only";
export class HttpError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function validId(value: string) {
  if (!/^(?:[a-f0-9]{8}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(value)) throw new HttpError("Invalid project or session ID.");
  return value;
}
export function input(value: unknown, label: string, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new HttpError(`${label} must be between 1 and ${max} characters.`);
  return value.trim();
}
export function json(body: unknown, status = 200) { return Response.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } }); }
export function failure(e: unknown) { return json({ error: e instanceof SyntaxError ? "Invalid JSON request or AI response." : e instanceof Error ? e.message : "Request failed." }, e instanceof HttpError ? e.status : 502); }

