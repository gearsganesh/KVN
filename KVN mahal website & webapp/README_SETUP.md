# KVN Production Setup

1. Run `supabase_schema.sql` in the KVN Supabase SQL Editor. It creates the database, RLS, Realtime and seeds Muhurtham dates for 2026-2040.
2. Do NOT create any booking from a website enquiry. Enquiries are leads only.
3. Keep the existing KVN Admin profile; create manager profiles only when ready for handover.
4. Deploy this folder to Netlify. No custom KVN domain is required.
5. Public site: `/`
6. Admin/Manager PWA: `/admin` or `/manager`
7. The Muhurtham database has no external API/API dependency.
8. Calendar logic: fully booked = non-responsive; any availability = enquiry form; ⭐ is independent. Past dates are greyed and non-selectable.
9. After a lead is contacted and advance is received, manager changes the enquiry to `advance_paid` and manually creates the confirmed booking in the calendar.
