// Explicit operator-run migration only. Application runtime never reads local state.
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
if(!url||!key)throw Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
const source=process.argv[2];
if(!source)throw Error("Usage: node --env-file=.env.local scripts/import-json.mjs data/store.json");
const store=JSON.parse(await readFile(source,"utf8"));
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
for(const table of ["projects","sessions","messages","handoffs"]){
 const rows=store[table];
 if(!Array.isArray(rows))throw Error("Invalid JSON store: missing "+table);
 for(let offset=0;offset<rows.length;offset+=100){
  const {error}=await db.from(table).upsert(rows.slice(offset,offset+100),{onConflict:"id",ignoreDuplicates:true});
  if(error)throw Error("Import stopped at "+table+" batch "+offset+". Existing rows were not overwritten. Check migration and source constraints; rerun after correcting.");
 }
 console.log(table+": "+rows.length+" source rows processed (existing IDs preserved).");
}

