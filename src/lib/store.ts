import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Store } from "./types";

const file = path.join(process.cwd(), "data", "store.json");
const empty: Store = { projects: [], sessions: [], handoffs: [], messages: [] };
let queue = Promise.resolve();
export async function readStore(): Promise<Store> { try { return { ...empty, ...JSON.parse(await readFile(file, "utf8")) }; } catch { return structuredClone(empty); } }
export async function updateStore(fn: (s: Store) => void) { let result!: Store; queue = queue.then(async () => { result = await readStore(); fn(result); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(result, null, 2)); }); await queue; return result; }
