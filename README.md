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

This app is configured with `base: "./"` in `vite.config.ts`, which works for static hosting.

Manual deploy option:

1. Build the app: `npm run build`
2. Publish the `dist/` folder to your Pages branch (`gh-pages` or docs workflow)

If you want an automated GitHub Actions workflow, add one that:

- installs deps
- runs `npm run build`
- uploads `dist/` as Pages artifact
- deploys via `actions/deploy-pages`
