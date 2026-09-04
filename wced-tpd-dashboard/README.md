# WCED eLearning TPD Analytics Dashboard

A static, GitHub Pages-ready dashboard for the Supabase tables:

- `attendance`
- `schools`
- `sessions`
- `courses`

## What is included

- Responsive WCG-branded dashboard UI
- Overview KPIs
- Attendance trend, district, development-level and delivery-mode charts
- Top sessions and schools
- Attendance explorer with sorting, paging and column controls
- Participant analysis with repeat-participation metrics
- School engagement analytics, enriched from the `schools` table
- Session intelligence with facilitator workload and scheduled-session trends
- Course catalogue
- Global search and advanced filters
- Saved views in browser localStorage
- CSV exports
- Print-ready report
- Light/dark theme
- Automatic pagination against Supabase so large attendance tables can be loaded in chunks
- Browser-side configuration for GitHub Pages

## Setup

1. Open `config.js`.
2. Add your Supabase Project URL and **publishable/anon** key.
3. Never add a `service_role` or secret key to this repository.
4. Commit the folder to a GitHub repository.
5. Enable GitHub Pages from the repository's Pages settings and publish the root of the branch.

Supabase's browser client is initialized with `createClient(projectUrl, publishableKey)`. The Supabase documentation states that publishable keys are intended for client code, while secret/service-role keys must remain on a server. Row Level Security remains the access boundary.

## Important security note

Your current schema exposes `SELECT` access to the `anon` role on all four tables. That means any public page using the anon/publishable key can query the data allowed by those policies. The dashboard deliberately does not select or display `PERSAL Number` or `ID_number`, but the database policies should still be reviewed before deploying data containing personal information.

For stronger production security, consider a reporting/view layer that exposes only the aggregated fields the dashboard actually needs, or authenticated access with restrictive RLS policies.
