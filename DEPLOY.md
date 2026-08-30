# Smart Health OPD — Deployment Runbook

> Platform: **Vercel Hobby (free)** · Database: **MongoDB Atlas (M0)** · Region: India / Kerala (IST, UTC+5:30)
> Last updated: 2026-08-30

---

## 1. Pre-deployment checklist

Run these locally before pushing to Vercel:

```bash
npx tsc --noEmit        # must be 0 errors
npm run lint            # must be 0 errors
npx vitest run          # must be all tests passing
npm run build           # must complete without errors
```

---

## 2. MongoDB Atlas setup

### 2a. Create a database user
1. Atlas dashboard → **Database Access** → Add New Database User
2. Authentication: **Password**
3. Username: e.g. `smart-health-prod`
4. Generate a strong password (save it — you will need it for `MONGODB_URI`)
5. Role: **Read and write to any database**

### 2b. Network access (two options — pick one)

**Option A — Vercel–Atlas integration (recommended)**
1. In Atlas: **Overview** → **Integrations** → search **Vercel**
2. Click **Configure** and follow the OAuth flow
3. Atlas will automatically sync Vercel's IP list — no manual maintenance needed

**Option B — Allow all IPs (fallback)**
1. Atlas dashboard → **Network Access** → Add IP Address
2. Enter `0.0.0.0/0`, comment "Vercel dynamic IPs"
3. Use only if Option A is unavailable on your Atlas tier

### 2c. Get your connection string
1. Atlas → **Database** → **Connect** → **Drivers** → Node.js
2. Copy the SRV connection string, e.g.:
   ```
   mongodb+srv://smart-health-prod:<password>@cluster0.xxxxx.mongodb.net/smart-health?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your actual password
4. This is your `MONGODB_URI`

---

## 3. Seed the database

> **Warning: destructive.** The seed script wipes every collection first, then re-inserts fresh data.
> Only run this once against a fresh/empty Atlas database, or when you intentionally want to reset all data.

```bash
# Set your Atlas URI in .env.local first
MONGODB_URI="mongodb+srv://..." npm run db:seed
```

The script prints all demo login credentials at the end. Keep them private — change passwords in production.

---

## 4. Generate secrets

Run these commands locally to generate strong secrets:

```bash
# JWT_SECRET (min 32 chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# NEXT_SERVER_ACTIONS_ENCRYPTION_KEY (must be stable across all Vercel instances)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CRON_SECRET (guards the /api/cron/notifications endpoint)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. Vercel environment variables

Go to: Vercel dashboard → your project → **Settings** → **Environment Variables**

Add every variable for **Production** (and optionally Preview/Development):

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | **Yes** | Full Atlas SRV connection string from step 2c |
| `JWT_SECRET` | **Yes** | Min 32-char random string (step 4) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | **Yes** | Min 32-char random string (step 4) — must be same across all function instances |
| `CRON_SECRET` | **Yes** | Random secret for cron guard (step 4) |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Your production domain, e.g. `https://smart-health.vercel.app` |
| `NEXT_PUBLIC_API_BASE_URL` | **Yes** | Same as `NEXT_PUBLIC_APP_URL`, e.g. `https://smart-health.vercel.app` |
| `NODE_ENV` | Auto-set | Vercel sets this to `production` automatically — do not override |
| `NOTIF_SIMULATE_FAILURE` | No | Omit in production; set `1` only for testing |

> Never commit real values to the repository. Only `.env.example` (with empty values) should be committed.

---

## 6. Deploy

### First deploy
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Link and deploy
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard and push to `main` for automatic deploys.

### Subsequent deploys
Push to `main` — Vercel auto-builds and deploys via the GitHub integration.

---

## 7. Cron job — notification worker

The notification queue worker runs automatically via the Vercel cron defined in `vercel.json`:

| Cron | UTC | IST | Purpose |
|---|---|---|---|
| `30 23 * * *` | 23:30 UTC | 05:00 IST | Send queued notifications (appointment reminders, lab results, etc.) |

**Hobby plan limits:**
- Maximum **1 invocation per day** per cron
- Maximum function duration: **60 seconds** (the worker processes up to 50 jobs per run)
- The cron endpoint is guarded by `CRON_SECRET` — an unauthenticated call returns 401

**To test the cron manually** (after deploy):
```bash
curl -X GET https://your-app.vercel.app/api/cron/notifications \
  -H "Authorization: Bearer <your-CRON_SECRET>"
```

---

## 8. Vercel Hobby plan limits — know these

| Limit | Value | Impact on this app |
|---|---|---|
| Serverless function duration | 60s | Safe — all actions are fast DB queries |
| Cron invocations | 1/day per job | Notification batch fires once per day at 5 AM IST |
| Bandwidth | 100 GB/month | Fine for a hospital OPD system at low volume |
| Deployments | Unlimited | No limit |
| Serverless function concurrency | Limited | If OPD queue spikes, responses may queue briefly |

---

## 9. Post-deploy verification

After deploying, verify these URLs work:

```
GET  /                          → public landing page
GET  /login                     → staff/patient login chooser
GET  /pharmacy/dashboard        → redirects to /login (proxy guard working)
GET  /api/cron/notifications    → 401 Unauthorized (no Bearer token)
```

Check Vercel dashboard → **Functions** tab for any invocation errors after the first cron run.

---

## 10. Notification providers

The current implementation uses **mock providers** for SMS, push, and email. Notifications are stored in the database and logged, but not actually delivered externally.

To enable real delivery, wire a provider in `src/server/notifications/providers/` and update the worker in `src/server/notifications/worker.ts`. This is not required for the initial launch.

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `MongooseServerSelectionError` on first request | Atlas IP not whitelisted | Set up Vercel–Atlas integration (step 2b) |
| `JWT_SECRET must be set` on build | Missing env var | Add `JWT_SECRET` in Vercel dashboard (step 5) |
| Cron returns 401 | `CRON_SECRET` mismatch | Ensure the same value is in Vercel env vars and your test curl command |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` warning in logs | Missing env var | Add it in Vercel dashboard — required for stable server action encryption across instances |
| `/pharmacy/dashboard` not redirecting to login | Proxy matcher missing | Already fixed in `src/proxy.ts` — redeploy if using an older branch |
| Function timeout | Heavy query / cold start | Check Vercel Functions tab — MongoDB connection timeout is already set to 5s |
