# KVN Weddings & Conventions - Clean Production Package

This package intentionally contains NO Git repository, GitHub Actions, Emergent cron/webhook files, trigger markdown files, or nested duplicate ZIP.

## Deploy
- Vercel: import this folder/ZIP as a static project. `vercel.json` maps `/admin` and `/manager` to `manager.html`.
- Netlify: drag/drop the folder or connect the repo. `netlify.toml` maps `/admin` and `/manager` to `manager.html`.
- Supabase: run `supabase_schema.sql` once in the SQL Editor.

## URLs
- Public website: `/`
- Manager: `/admin` or `/manager`

## Data behavior
- Public calendar loads current data on page open and when the page becomes visible.
- Manager uses Supabase Realtime for enquiry/calendar changes and has a manual Refresh button.
- No 60-second polling timers.
- Enquiries are leads only. They do not create bookings.
- There are no PostgreSQL triggers in the supplied schema.

## Important
`config.js` contains a browser-safe Supabase publishable key only. Never put a Supabase service-role key in browser code.
