KVN FINAL API-FREE - v1.1

Critical database compatibility fix:
- Existing muhurtham_dates tables are now migrated with ALTER TABLE ... ADD COLUMN IF NOT EXISTS before the 2026-2040 seed inserts run.
- Added source_reference, score, start_time, end_time, panchanga, generated_at and all current admin columns.
- Fixed manager dashboard logo path from assets/logo.png to the bundled assets/logo.webp.

Booking/enquiry workflow remains unchanged:
- Fully booked dates are non-responsive publicly.
- Available/partially available dates open the enquiry form.
- Enquiries never create calendar bookings.
- Managers manually confirm bookings after advance payment.
