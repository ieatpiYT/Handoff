import { createHash } from "node:crypto";
import { projectData } from "@/lib/store";
import { json, failure } from "@/lib/http";
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
 try {
  const data = await projectData((await params).id);
  const cursor = createHash("sha256").update(JSON.stringify(data)).digest("hex");
  if (new URL(req.url).searchParams.get("cursor") === cursor) return json({ unchanged: true, cursor });
  return json({ ...data, cursor });
 } catch(e) { return failure(e); }
}
