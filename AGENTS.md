# AGENTS.md

Jackpot: React 18 + Vite SPA, Supabase backend (DB, auth, storage), deployed to Vercel. UI language is Indonesian — keep all new user-facing strings Indonesian.

## Commands

```bash
npm install      # no lockfile in repo; plain install
npm run dev      # vite dev server
npm run build    # vite build -> dist/
npm run preview  # serve dist/ locally
```

There is no lint, typecheck, formatter, or test setup. Do not invent one; if asked to verify, use `npm run build`.

## Setup

```bash
cp .env.example .env   # fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

Both vars are required at build time (Vite inlines `import.meta.env`). Missing values break the Supabase client in `src/supabase.js`. Same two vars must be set in Vercel project settings.

## Architecture

- No router library. `src/App.jsx` holds a `view` state machine: `home | book | article | admin`, plus a `sel` payload. Navigation helpers: `go()`, `jump()` (scroll to section id).
- `src/Admin.jsx` — admin panel, reached via "Admin" link in footer (not a protected route; gating happens in Supabase RLS + a session check).
- `src/supabase.js` — shared client + `uploadImage()` (client-side resize to max 1000px JPEG, uploads to public bucket `images`).
- Guest identity is only a name in `localStorage` under `jackpot_name`. No guest auth.
- `settings` table is key/value with JSONB values: `wa` stored as a JSON string (`"628..."`), `banner` as a JSON object. Read via `Object.fromEntries(rows.map(r => [r.key, r.value]))`.
- Home hides `active = false` cars client-side; RLS also filters them for anon readers.

## Supabase / database

- Schema lives in `supabase/schema.sql`, applied **manually** by pasting into the Supabase SQL Editor. There is no Supabase CLI, no migrations directory, and no local database.
- Editing `schema.sql` changes nothing on its own. After any schema change, run the new SQL in the SQL Editor.
- `schema.sql` is not safely re-runnable: `create policy` statements error if the policy name already exists. When altering policies, drop them first (`drop policy if exists ... on ...`) in the new SQL you hand to the user.
- Admin writes require a row in `admins` (checked by `is_admin()`, a `security definer` function). Creating a Supabase auth user is not enough. Keep this model — never widen RLS to make a feature work; if writes fail, the fix is an `admins` row or a correct policy, not anon write access.
- Admin membership check in the UI (`src/Admin.jsx`) mirrors RLS but is not the security boundary.

## Product constraints

- Orders are never stored. "Kirim ke WhatsApp" opens `wa.me/<number>?text=...` with a prefilled message. Do not add an orders/payments table unless asked.
- Data mutations happen only through the admin panel (cars, articles, settings, images).
- Car/article/banner images are public URLs from the `images` bucket; new uploads must go through `uploadImage()` so they stay resized and public.
