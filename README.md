# Shinsegae Square Media Art Awards

Administrator and judge evaluation system built with Next.js, Supabase, and Vercel Blob CDN.

## Included flows

- One login server for administrator and judge accounts
- Administrator dashboard and judge account management
- Judge evaluation screen
- Persistent account data with Supabase Postgres
- Direct-to-CDN video uploads with only the video URL stored in Supabase

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@shinsegaeawards.kr | password |
| Judge | hong@jury.kr | password |

## Fresh deployment setup

1. Create a new Supabase project.
2. In Supabase, open **SQL Editor** and run [`supabase/schema.sql`](./supabase/schema.sql).
3. In your new Vercel project, add these Production environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. In Vercel, open **Storage**, create a public **Blob** store, and connect it to this project with the `MEDIA` variable prefix and the read-write token option enabled. Vercel adds `MEDIA_READ_WRITE_TOKEN` automatically.
5. Connect this repository to Vercel and deploy.

Use the URL and service-role key from Supabase **Project Settings > API**. The service-role key must only be stored in Vercel environment variables. Do not expose it to the browser or commit it to GitHub.

## Storage architecture

- Supabase Postgres: users, submissions, criteria, assignments, and scores
- Vercel Blob CDN: original submission video files
- `competition_submissions.video_url`: the public CDN URL used by judge video players

Video uploads go directly from the administrator's browser to Vercel Blob, so large files do not pass through a Next.js function or consume Supabase Storage.

## Local development

```bash
npm install
npm run dev
```

For local Supabase use, copy `.env.example` to `.env.local` and set your project values. Without these values, local development uses the included seed file at `data/db.json`.

## API routes

- `POST /api/auth/login`
- `GET /api/admin/judges`
- `POST /api/admin/judges`
- `PUT /api/admin/judges/:id`
