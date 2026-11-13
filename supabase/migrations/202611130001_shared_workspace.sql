-- Run once in Supabase SQL Editor. Camel-case columns preserve the existing app data contract.
begin;
create table public.projects (
 id text primary key check (id ~ '^([a-f0-9]{8}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$'),
 name text not null check (length(trim(name)) between 1 and 200),
 description text not null default '',
 "assistantId" uuid not null unique,
 "createdAt" timestamptz not null default now(),
 "updatedAt" timestamptz not null default now()
);
create table public.sessions (
 id uuid primary key,
 "projectId" text not null references public.projects(id) on delete cascade,
 "participantName" text not null check (length(trim("participantName")) between 1 and 200),
 "modelProvider" text not null, "modelName" text not null,
 "threadId" uuid not null unique,
 "startedAt" timestamptz not null default now(), "endedAt" timestamptz,
 briefing text not null default '',
 "updatedAt" timestamptz not null default now(),
 operation_token uuid, operation_until timestamptz,
 unique(id, "projectId"), check ("endedAt" is null or "endedAt" >= "startedAt")
);
create table public.messages (
 id uuid primary key, "sessionId" uuid not null references public.sessions(id) on delete cascade,
 role text not null check (role in ('user','assistant')),
 content text not null check (length(content) > 0),
 "modelName" text not null, "createdAt" timestamptz not null default now(),
 "updatedAt" timestamptz not null default now(),
 sequence bigint generated always as identity unique
);
create table public.handoffs (
 id uuid primary key, "projectId" text not null references public.projects(id) on delete cascade,
 "sessionId" uuid not null unique,
 "participantName" text not null, "modelName" text not null,
 done text[] not null, decided text[] not null, "inProgress" text[] not null,
 blockers text[] not null, "nextSteps" text[] not null,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now(),
 foreign key ("sessionId", "projectId") references public.sessions(id, "projectId") on delete cascade
);
create index sessions_project on public.sessions("projectId", "updatedAt");
create index messages_session on public.messages("sessionId", sequence);
create index handoffs_project on public.handoffs("projectId", "createdAt" desc);
create function public.handoff_updated() returns trigger language plpgsql set search_path = public as $$
begin new."updatedAt" = clock_timestamp(); return new; end $$;
create trigger projects_updated before update on public.projects for each row execute function public.handoff_updated();
create trigger sessions_updated before update on public.sessions for each row execute function public.handoff_updated();
create trigger messages_updated before update on public.messages for each row execute function public.handoff_updated();
create trigger handoffs_updated before update on public.handoffs for each row execute function public.handoff_updated();

-- One statement snapshot avoids timestamp-cursor gaps caused by overlapping commits.
create function public.handoff_snapshot(project_id text) returns jsonb language sql stable set search_path = public as $$
 select jsonb_build_object(
 'project', to_jsonb(p),
 'sessions', coalesce((select jsonb_agg(to_jsonb(s) - 'operation_token' - 'operation_until' order by s."startedAt") from sessions s where s."projectId" = p.id), '[]'::jsonb),
 'messages', coalesce((select jsonb_agg(to_jsonb(m) order by m.sequence) from messages m join sessions s on s.id = m."sessionId" where s."projectId" = p.id), '[]'::jsonb),
 'handoffs', coalesce((select jsonb_agg(to_jsonb(h) order by h."createdAt" desc) from handoffs h where h."projectId" = p.id), '[]'::jsonb)
 ) from projects p where p.id = project_id
$$;
create function public.handoff_claim(session_id uuid, token uuid) returns boolean language plpgsql set search_path = public as $$
begin
 update sessions set operation_token = token, operation_until = now() + interval '5 minutes'
 where id = session_id and "endedAt" is null and (operation_until is null or operation_until < now());
 return found;
end $$;
create function public.handoff_finish(session_id uuid, token uuid, new_messages jsonb, new_handoff jsonb)
returns void language plpgsql set search_path = public as $$
declare s sessions; item jsonb;
begin
 select * into s from sessions where id = session_id for update;
 if s.operation_token is distinct from token or s."endedAt" is not null then raise exception 'Operation no longer owned'; end if;
 for item in select value from jsonb_array_elements(new_messages) loop
 insert into messages(id,"sessionId",role,content,"modelName","createdAt")
 values((item->>'id')::uuid,session_id,item->>'role',item->>'content',item->>'modelName',(item->>'createdAt')::timestamptz);
 end loop;
 if new_handoff is not null then
 insert into handoffs(id,"projectId","sessionId","participantName","modelName",done,decided,"inProgress",blockers,"nextSteps","createdAt")
 select h.id,s."projectId",s.id,s."participantName",h."modelName",h.done,h.decided,h."inProgress",h.blockers,h."nextSteps",h."createdAt"
 from jsonb_populate_record(null::handoffs,new_handoff) h;
 end if;
 update sessions set operation_token=null,operation_until=null,
 "endedAt"=case when new_handoff is not null then now() else "endedAt" end where id=session_id;
end $$;
alter table public.projects enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.handoffs enable row level security;
revoke all on public.projects,public.sessions,public.messages,public.handoffs from anon,authenticated;
grant all on public.projects,public.sessions,public.messages,public.handoffs to service_role;
grant usage,select on sequence public.messages_sequence_seq to service_role;
revoke all on function public.handoff_snapshot(text),public.handoff_claim(uuid,uuid),public.handoff_finish(uuid,uuid,jsonb,jsonb),public.handoff_updated() from public,anon,authenticated;
grant execute on function public.handoff_snapshot(text),public.handoff_claim(uuid,uuid),public.handoff_finish(uuid,uuid,jsonb,jsonb) to service_role;
commit;

