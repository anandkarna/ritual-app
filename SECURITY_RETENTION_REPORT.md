# Security and Retention Report

## Scope

Implemented the requested Supabase-backed user isolation and rolling activity retention without changing the app UI.

## Files Changed

- `App.tsx`: reads and writes daily progress through `habit_logs.activity_date`, `completed`, and `completed_at`; uses `onConflict: user_id,habit_id,activity_date`.
- `src/lib/ritual-math.ts`: local-device calendar dates for Today, Yesterday, Last 7 Days, and Last 30 Days.
- `supabase/migrations/20260829095622_user_activity_retention.sql`: schema, RLS, grants, indexes, aggregate table, and cleanup RPC.
- `api/cleanup-activity.js`: Vercel serverless cron endpoint.
- `vercel.json`: cron schedule for `/api/cleanup-activity` every approximately 3 days.
- `.env.example`: public Expo keys separated from server-only Supabase/AI/Cron keys.
- `.gitignore`: ignores secret env files while keeping `.env.example`.

## Database Changes

- Added `activity_date`, `completed`, `created_at`, and `updated_at` to `public.habit_logs`.
- Backfilled `activity_date` from existing `log_date`.
- Added trigger `public.sync_habit_log_activity_fields()` to keep `activity_date` and legacy `log_date` aligned.
- Added unique index `habit_logs_user_habit_activity_date_key` on `(user_id, habit_id, activity_date)` to prevent duplicate daily progress records per user.
- Added indexes for `(user_id, activity_date)` and existing user/date access patterns.
- Added owner-enforcing composite foreign keys so activity/check-in rows cannot point to another user's habit ID.
- Added `public.activity_monthly_stats` for optional long-term aggregate history.
- Added `public.cleanup_old_activity(retention_days integer)` to aggregate old rows and delete detailed activity older than the retention cutoff.

## RLS and Policies

- Re-enabled RLS on `profiles`, `habits`, `habit_logs`, `ritual_checkins`, `coach_summaries`, `coach_nudges`, `weekly_insights`, `notifications`, and `activity_monthly_stats`.
- Replaced broad `for all` policies on the main user tables with explicit `select`, `insert`, `update`, and `delete` policies scoped to `to authenticated`.
- Policies use `(select auth.uid()) = user_id` or `(select auth.uid()) = id`.
- Revoked anonymous table grants from the main private tables.
- Granted only authenticated users the client operations the app needs.
- Revoked client execution from admin/helper cleanup functions; cleanup RPC is granted to `service_role` only.
- No Supabase Storage buckets or storage policies were present in this repo, so none were changed.

## Vercel Cron

- Added `api/cleanup-activity.js`.
- Requires `Authorization: Bearer ${CRON_SECRET}`.
- Uses `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` only server-side.
- Calls `cleanup_old_activity` with `ACTIVITY_RETENTION_DAYS`, defaulting to 30.
- Returns only safe summary fields: retention days, cutoff date, deleted count, and aggregate count.
- `vercel.json` schedules it as `0 3 */3 * *`.

## Environment Variables

Public client:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server/Supabase/Vercel only:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NVIDIA_API_KEY`
- `ANTHROPIC_API_KEY`
- `CRON_SECRET`
- `ACTIVITY_RETENTION_DAYS`

Security note: the local `.env` contains `EXPO_PUBLIC_NVIDIA_API_KEY`. Because `EXPO_PUBLIC_*` values are bundled into the client, rotate that NVIDIA key if it was real and remove the public variable after confirming the Supabase Edge Function has `NVIDIA_API_KEY` set server-side.

## Manual Steps

1. Apply `supabase/migrations/20260829095622_user_activity_retention.sql` in Supabase.
2. Confirm the Data API exposes the needed public tables, or run the included grants in the migration.
3. Set Vercel environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and `ACTIVITY_RETENTION_DAYS`.
4. Set Supabase Edge Function secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`, and `ANTHROPIC_API_KEY` as needed.
5. Redeploy Vercel so the cron entry and API route are active.
6. Rotate any real key that was ever stored under an `EXPO_PUBLIC_*` name but is not meant to be public.

## Test Checklist

- Sign up with email confirmation enabled.
- Confirm email and log in.
- Log out and log back in.
- Verify session refresh after app relaunch.
- Create User A and User B; confirm each sees only their own profile, rituals, check-ins, and activity.
- Try manipulated API requests with another user's `user_id` or `habit_id`; RLS/FKs should reject or return no rows.
- Create a ritual.
- Complete it for today.
- Tap complete again to unmark it.
- Complete it again and confirm only one row exists for `(user_id, habit_id, activity_date)`.
- Verify Today and Last 7/30 Days around local midnight in the user's timezone.
- Insert test activity older than `ACTIVITY_RETENTION_DAYS`, call `/api/cleanup-activity` with the Bearer secret, and confirm old details are deleted.
- Call `/api/cleanup-activity` without the Bearer secret and confirm it returns 401.
- Confirm habit definitions remain after cleanup.
- Confirm `activity_monthly_stats` has aggregate rows before old details are removed.
- Confirm friendly app errors instead of raw `{}` payloads.

## Verification Run

- `npm run typecheck`: passed.
- `node --check api/cleanup-activity.js`: passed.
- `npm run build:web`: passed after restoring the missing declared `react-native-web` package in `node_modules`.

## Remaining Risks

- Run Supabase database tests/advisors against the real project after applying the migration.
- `activity_monthly_stats.best_streak` is computed from cleanup batches and keeps the maximum archived batch streak; exact all-time streak analytics may need a dedicated aggregate pipeline later.
- `public.email_for_username` intentionally remains callable by `anon` for username login lookup, so usernames can reveal their associated email address. Remove username login or redesign lookup if that is not acceptable.
- `npm install` reported 11 moderate npm audit findings; review with `npm audit` and update intentionally rather than using a blind force fix.
