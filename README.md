# Repo

[![CI](https://github.com/NihithChanapathi/repo-app/actions/workflows/ci.yml/badge.svg)](https://github.com/NihithChanapathi/repo-app/actions/workflows/ci.yml)

A student marketplace for dorm essentials, clothes, parking passes, tickets and subleases.
Pilot campuses: NC State, UNC Chapel Hill, Duke. Students sign in with a campus `.edu` email
and only see listings from their own campus.

**Stack:** Next.js (App Router, TypeScript, Tailwind) · Supabase (Postgres, Auth, Storage, Realtime) · Vercel.

## Run it locally

1. **Create a Supabase project** (free) at https://supabase.com.
2. **Create the database:** Supabase → SQL Editor → paste all of `supabase/schema.sql` → Run.
3. **Auth settings:** Supabase → Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/auth/callback`
4. **Add your keys:** copy `.env.example` to `.env.local`, then fill in the Project URL and
   anon key from Supabase → Project Settings → API.
5. Install and start:

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000, sign in with an `@ncsu.edu` address, and post a test listing.

## Deploy (Vercel)

Push to GitHub, import the repo in Vercel, add the same two env vars, and deploy. Then add your
production URL (and `https://yourdomain/auth/callback`) to Supabase's Auth redirect URLs.
Before public launch, set up a custom SMTP sender in Supabase (Resend works well); the built-in
email sender is heavily rate-limited.

## Where things live

| Path | What it does |
|---|---|
| `src/config/app.ts` | App name, campuses, categories. Rename the product or add a school here. |
| `supabase/schema.sql` | Tables, row-level security, `.edu` signup guard, photo storage. |
| `src/proxy.ts` | Keeps sessions fresh and sends signed-out users to `/login`. |
| `src/app/page.tsx` | Landing page (signed out) and campus feed with search and category filters. |
| `src/app/sell/` | Create a listing with photos. |
| `src/app/listings/[id]/` | Listing page: message seller, mark sold, report. |
| `src/app/messages/` | Inbox and realtime chat. |

## Adding a campus

Add a row to `public.campuses` in Supabase and an entry in `CAMPUSES` in `src/config/app.ts`.

## Reviewing reports

Reports are stored in the `reports` table and visible only from the Supabase dashboard
(Table Editor → reports) for now.

## Suggested next steps

1. Profile page so students can set a display name (default is "Student ab12").
2. Email notification on new message.
3. Admin view for reports and removing listings.
4. Wishlist / saved searches, and game-day mode for tickets and parking.
5. Optional: in-app payments (Stripe) once there is real demand. Skipped on purpose for v1.
