# SisuCards app

Static React + Vite frontend hosted on GitHub Pages, with Supabase Auth + Postgres.

## Requirements

- Node.js `20.19+` (or newer)
- npm
- Supabase project

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment variables

Copy `.env.example` to `.env` and set your values:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 3) Apply database migration in Supabase

Use the SQL in:

- `supabase/migrations/20260220_init_words_verbs_pikkusanat.sql`

You can run it in Supabase SQL Editor, or with Supabase CLI migrations if you use CLI locally.

This migration creates:

- `words`, `verbs`, `pikkusanat` tables
- dedup keys (`fi_key`, `infinitive_key`, `pikkusana_key`)
- unique constraints on `(user_id, *_key)`
- triggers to trim raw key fields and compute normalized keys
- RLS policies so users only access their own rows

## 4) Run locally

```bash
npm run dev
```

## 5) Build

```bash
npm run build
```

## GitHub Pages deploy

This project includes automated deploy workflow:

- `.github/workflows/deploy-pages.yml`

### One-time GitHub setup

1. Push this project to `main`.
2. In your GitHub repo, open `Settings` -> `Pages`.
3. Set `Build and deployment` source to `GitHub Actions`.
4. In `Settings` -> `Secrets and variables` -> `Actions`, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

After this, each push to `main` deploys automatically.
