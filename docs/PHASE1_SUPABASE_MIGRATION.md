# Phase 1: Migrate LePrint DB from Oracle VPS Postgres → Supabase

**Scope:** Database only. Firebase Auth stays untouched — `backend/auth-middleware.js`
keeps verifying Firebase ID tokens exactly as it does today. Only the Postgres
connection (`backend/db.js`) moves. Auth migration is Phase 2, on a separate branch.

**Source files (already dumped, in this repo under `docs/`):**
- `docs/schema_dump.sql` — schema (tables, views, trigger, indexes, FKs)
- `docs/data_dump.sql` — data (4 users, 3 admin_actions, 6 kiosks, 20 jobs, 1 setting)

**Rollback safety:** Do NOT touch or decommission the Oracle VPS Postgres instance
during this phase. It stays live as the source of truth until Supabase is verified
in production. `backend/.env` changes are the only cutover point, and that's a
one-line revert if anything goes wrong.

---

## Step 0 — Pre-flight facts (already confirmed)

- Postgres version on VPS: 16.14
- Extensions in use: `plpgsql` only (default, always present in Supabase — no action needed)
- No `uuid-ossp`, no `pgcrypto`, no custom types, no RLS currently — schema is vanilla
- All PKs are `character varying` (string) — `users.id` is Firebase UID text, not UUID.
  **Do not change this in Phase 1.** Supabase Postgres accepts any PK type; RLS/auth.uid()
  integration is a Phase 2 concern.
- 1 custom function: `update_updated_at_column()` — trigger for `updated_at` columns
- 4 views: `active_jobs`, `daily_kiosk_stats`, `kiosk_stats`, `system_metrics`
- 2 tables have `updated_at` triggers: `jobs`, `kiosks`

---

## Step 1 — Create Supabase project

1. Go to supabase.com → New Project
2. Choose a region close to your users/VPS (e.g. Singapore or Mumbai for India-based traffic)
3. Save the generated Postgres password securely (needed for Step 3)
4. Once provisioned, go to **Project Settings → Database → Connection string** and copy:
   - The **Session pooler** or **Transaction pooler** connection string (for the backend app, not direct connection — direct connection port 5432 is fine too if traffic is low, but pooled is safer for Express connection reuse)
   - Note both the `postgres` user connection string and enable **Connection Pooling** if not already on

---

## Step 2 — Strip pg_dump 17 restrict markers

The dump files contain `\restrict` / `\unrestrict` lines (pg_dump security markers tied to
a specific psql client version). These can break `psql`/Supabase SQL editor imports on
mismatched client versions. Strip them before importing:

```bash
cd docs/
sed -i '/^\\restrict/d; /^\\unrestrict/d' schema_dump.sql
sed -i '/^\\restrict/d; /^\\unrestrict/d' data_dump.sql
```

Verify they're gone:
```bash
grep -c "restrict" schema_dump.sql data_dump.sql
# should output 0 for both
```

---

## Step 3 — Apply schema to Supabase

Use the **direct connection string** (not pooler) for DDL operations — pooled connections
(pgbouncer transaction mode) can fail on multi-statement DDL scripts.

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" \
  -f docs/schema_dump.sql
```

**Expected result:** 4 tables, 4 views, 1 function, 1 sequence, all indexes, all FKs,
2 triggers created with no errors.

**Verify:**
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" \
  -c "\dt public.*" -c "\dv public.*"
```
Expect: `admin_actions`, `jobs`, `kiosks`, `settings`, `users` as tables;
`active_jobs`, `daily_kiosk_stats`, `kiosk_stats`, `system_metrics` as views.

---

## Step 4 — Import data

Order matters for FK integrity, but `pg_dump --data-only` output already sequences
inserts correctly (users → admin_actions → kiosks → jobs → settings) because that's
the dependency order in the dump. Import as one file:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" \
  -f docs/data_dump.sql
```

**Expected result:** no FK violation errors. The `admin_actions_id_seq` gets set to 3
at the end of the dump automatically (`setval` call is already in the file).

---

## Step 5 — Verify row counts match source

Run on **both** the VPS Postgres and Supabase, diff the output:

```sql
SELECT 'users' AS tbl, count(*) FROM users
UNION ALL SELECT 'admin_actions', count(*) FROM admin_actions
UNION ALL SELECT 'kiosks', count(*) FROM kiosks
UNION ALL SELECT 'jobs', count(*) FROM jobs
UNION ALL SELECT 'settings', count(*) FROM settings;
```

Expected (from the dump you already have):
| table | count |
|---|---|
| users | 4 |
| admin_actions | 3 |
| kiosks | 6 |
| jobs | 20 |
| settings | 1 |

Also spot-check FK integrity (should return 0 rows each):
```sql
SELECT count(*) FROM jobs j LEFT JOIN kiosks k ON j.kiosk_id = k.id WHERE k.id IS NULL;
SELECT count(*) FROM jobs j WHERE j.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = j.user_id);
```

And sanity-check a view works:
```sql
SELECT * FROM system_metrics;
```

---

## Step 6 — Swap backend connection

In `backend/.env` (do this in a feature branch, e.g. `feat/supabase-db`):

```bash
# Old (Oracle VPS direct Postgres)
# DATABASE_URL=postgresql://printuser:***@<vps-ip>:5432/printkiosk

# New (Supabase — use pooler connection string for the running app)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[POOLER-HOST]:6543/postgres
```

Check `backend/db.js` — if it uses `pg.Pool` with individual `PGHOST`/`PGUSER`/etc. env
vars instead of a single connection string, update those instead. No code logic changes
should be needed since this is vanilla `pg` against vanilla Postgres — just the connection
target.

**Do NOT touch:** `auth-middleware.js`, `firebase.js`, `AuthProvider.jsx` — Firebase Auth
keeps functioning independently of where Postgres lives.

---

## Step 7 — Test end-to-end against Supabase

Run these against the local dev backend pointed at Supabase:

1. `cd backend && npm run dev`
2. Hit `GET /api/admin/metrics` — should return data from `system_metrics` view
3. Hit `GET /api/admin/kiosks` — should return 6 kiosks
4. Use `kiosk_test` mock flow end-to-end: upload → mock pay → verify job lands in `jobs`
   table on Supabase with correct status transitions
5. Confirm `GET /api/jobs/poll` (the `FOR UPDATE SKIP LOCKED` query) still works —
   this is standard Postgres row locking, fully supported by Supabase, no changes expected
6. Check Socket.IO status updates still fire (this is unrelated to DB choice, but
   confirm nothing broke)

---

## Step 8 — Merge and deploy

1. Once local testing passes, update production `backend/.env` (or your deploy platform's
   env vars — Vercel/VPS process manager/whatever runs the backend) with the Supabase
   connection string
2. Deploy backend
3. Monitor `backend.log` / `journalctl` for connection errors in the first hour
4. Keep the Oracle VPS Postgres instance running and untouched for at least 1–2 weeks
   as a cold rollback option before considering decommissioning it

---

## Explicitly out of scope for Phase 1 (deferred to Phase 2, separate branch)

- Any change to `users.id` format (stays Firebase UID string)
- Any change to `auth-middleware.js` or Firebase token verification
- Enabling Supabase Auth, RLS policies, or `auth.users` table usage
- Google login flow changes
