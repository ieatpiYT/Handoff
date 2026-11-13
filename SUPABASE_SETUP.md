# Supabase + Vercel setup

## 1. Apply the schema

1. Open your Supabase project dashboard.
2. Choose **SQL Editor → New query**.
3. Open [the SQL migration](supabase/migrations/202611130001_shared_workspace.sql), copy its entire contents, paste into the editor, and click **Run**.
4. Confirm success. Run this migration once on a new database; it intentionally does not overwrite existing tables.
5. Check Table Editor for projects, sessions, messages, and handoffs. RLS is enabled with no browser-access policies. Do not add public read/write policies.

The camel-case column names deliberately match the existing app contract. Project assistant IDs and session thread IDs are stored unchanged, with unique constraints and foreign keys. Updates receive database timestamps.

## 2. Configure server secrets

Set these only in your local environment and in Vercel project **Settings → Environment Variables** for the environments you deploy:

- SUPABASE_URL — your Supabase project URL
- SUPABASE_SECRET_KEY — your Supabase secret API key
- BACKBOARD_API_KEY — your existing Backboard key

Never prefix these with NEXT_PUBLIC. Restart the dev server after changing environment variables. Missing database configuration produces a visible error; there is no JSON fallback.

## 3. Optional: import existing local demo data

Back up your original JSON file first. After applying the migration:

```sh
node --env-file=.env.local scripts/import-json.mjs data/store.json
```

This operator-run utility imports parents before children and preserves all existing IDs and assistant/thread relationships. It does not overwrite existing rows and can be rerun after an interrupted import. Application routes do not use the filesystem. Legacy short project IDs remain usable for continuity, but new projects use random UUIDs; use new projects for public demos.

## 4. Verify locally

```sh
npm install
npm run build
npm run lint
node scripts/test-database.mjs
npm run dev
```

The database test runs the real migration in an isolated PostgreSQL-compatible PGlite instance, not your hosted database. It checks claim exclusion, atomic writes/rollback, handoff uniqueness and closure, project scoping, and denied anonymous access.

### Two-browser demo

1. Browser A: create Renewable Energy Report, enter Ibrahim, select Claude.
2. Copy the absolute invite link; open it in an incognito window or another browser.
3. Browser B: join as Eric with GPT. Both member lists should update within about 2.5 seconds.
4. In A, send the renewable-energy report prompt and generate a handoff.
5. B should see the new handoff and updated project-memory counts without refreshing. B's thread is separate, so A's private thread messages do not appear in B's chat.
6. Ask B what Ibrahim decided and what Eric should do next. Confirm the real Backboard response.
7. To verify automatic Catch Me Up, open the invite in a fresh browser after A's handoff and join a new session.
8. Refresh B: its session, messages, and saved briefing should survive. Type a draft and wait for polling: the draft and scroll should remain unchanged.
9. Hide B: polling stops. Reveal B: polling resumes. End B's session: polling and new writes stop.
10. Repeat A's handoff POST: it returns the existing handoff. Overlapping requests receive 409 while the operation is running.

## 5. Deploy manually to Vercel

Import the repository in Vercel using the Next.js preset, or deploy with your chosen Vercel workflow. Set all three server environment variables before building. Use the normal npm run build command and a supported Node runtime (Node 22 or newer). API routes request a 240-second execution allowance; configure your Vercel plan accordingly. Backboard requests time out after 180 seconds, and Supabase requests after 20 seconds.

Do not use static export. No persistent disk, background interval, or sticky server instance is required. After deployment, create a fresh project at the public HTTPS origin and test its invite in another browser/laptop. Invite links derive from window.location.origin.

## Access model and limitations

There is no login. Project links are bearer-style access: anyone with a link can read that project's shared data and discover its session IDs; session IDs authorize session actions. Do not put sensitive data in this hackathon app. New project IDs are unpredictable UUIDs. There is no public project-list endpoint, and project reads never return another project's messages.

Supabase secret keys stay in server-only modules; the browser calls only Next.js routes. See [Supabase API-key guidance](https://supabase.com/docs/guides/api/api-keys). Public project creation is unauthenticated and can consume your Backboard quota; add authentication and rate limiting before broader production use.

Polling uses a database-consistent project snapshot and a SHA-256 fingerprint cursor. Unchanged responses are small; changed responses currently contain the full project snapshot. This avoids timestamp-cursor commit-order gaps but is intended for hackathon-size projects. No draft state or scroll commands are touched. Open sessions indicate session status, not verified online presence.

Session operations use database claims with a five-minute crash-recovery lease. Message pairs and handoff/session closure commit transactionally. Unique session handoffs prevent duplicate persisted summaries. Backboard and Postgres do not share a transaction: a timeout/crash after Backboard accepts a call may leave an upstream turn without a local result, and retrying may generate another upstream turn. The app does not claim external exactly-once execution or fabricate a fallback result.

Existing Backboard model/provider selection and Auto/Readonly memory modes are preserved. The database tests do not prove live cross-thread Backboard recall; run the two-browser demo against configured services.

