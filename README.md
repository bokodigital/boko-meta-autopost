# Boko — Meta Auto-Post Scheduler

A Next.js app that turns your topics (title + keyword + context) into scheduled **Facebook Page** and
**Instagram** posts: it writes a caption (rule-based), generates an image per post (OpenAI Images),
spreads them across the month based on the number of posts you choose, and **auto-publishes** them on
a daily scheduler. Same Boko design as the SEO tools.

---

## How it works

1. You add topics and pick **posts per month**.
2. The app drafts captions + schedule dates; you review/edit, then **Schedule all**.
3. Posts are stored in **Vercel KV**.
4. A **Vercel Cron** job runs daily, finds posts that are due, **generates an image** (uploaded to
   **Vercel Blob** for a public URL Instagram can read), and publishes to Facebook and/or Instagram
   via the **Meta Graph API**.

---

## What you need (one-time setup)

### 1. A Meta (Facebook) app + tokens
- Create an app at https://developers.facebook.com/ (type: Business).
- Add a **Facebook Page** you manage. For Instagram, connect an **Instagram Business/Creator account**
  to that Page.
- Permissions: `pages_manage_posts`, `pages_read_engagement`, and for IG `instagram_basic`,
  `instagram_content_publish`. While the app is in **Development mode** these work on your own
  Page/IG immediately. To post to assets you don't own, submit for **App Review**.
- Generate a **long-lived Page access token** (Graph API Explorer → get Page token → exchange for
  long-lived). You'll also need:
  - **Page ID** (`FB_PAGE_ID`)
  - **Instagram Business account ID** (`IG_USER_ID`) — from `GET /{page-id}?fields=instagram_business_account`
- Tokens expire; refresh the long-lived Page token periodically (~60 days) and update the env var.

### 2. OpenAI API key (images)
- https://platform.openai.com/ → `OPENAI_API_KEY`. Small per-image cost.

### 3. Vercel KV + Blob stores
- In your Vercel project → **Storage** → create a **KV** store and a **Blob** store. Vercel auto-adds
  `KV_REST_API_URL`, `KV_REST_API_TOKEN`, and `BLOB_READ_WRITE_TOKEN` to the project's env vars.

### 4. Deploy
- Push this folder to GitHub → import into Vercel (Next.js auto-detected).
- Set environment variables (see `.env.example`):
  `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN`, `IG_USER_ID` (optional), `META_API_VERSION` (default `v21.0`),
  `OPENAI_API_KEY`, `APP_PASSWORD`, `CRON_SECRET` (any long random string), plus the KV/Blob vars.
- Deploy. The `vercel.json` registers the daily cron at `/api/cron`.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `FB_PAGE_ID` | for FB | Facebook Page ID |
| `FB_PAGE_ACCESS_TOKEN` | yes | Long-lived Page access token (used for FB + IG) |
| `IG_USER_ID` | for IG | Instagram Business account ID linked to the Page |
| `META_API_VERSION` | no | Defaults to `v21.0` |
| `OPENAI_API_KEY` | yes | Image generation |
| `OPENAI_IMAGE_MODEL` / `OPENAI_IMAGE_SIZE` | no | Defaults `gpt-image-1` / `1024x1024` |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | yes | Vercel KV (post queue) |
| `BLOB_READ_WRITE_TOKEN` | yes | Vercel Blob (public image hosting) |
| `APP_PASSWORD` | recommended | Password to open the dashboard |
| `CRON_SECRET` | recommended | Vercel sends this as a Bearer token to `/api/cron` |

---

## Important limitations & notes

- **Vercel plan / function time:** generating an image + publishing can take 15-40s per post. The
  **Hobby** plan caps function duration (~10s) and cron to **once per day** — image generation may
  time out. For reliable publishing use the **Pro** plan (longer `maxDuration`, more frequent cron).
  The scheduler is set to run daily; on Pro you can lower the cron interval in `vercel.json`.
- **Instagram requires an image** and the account must be a Business/Creator account linked to the Page.
- **Scheduling granularity:** posts are spread across ~30 days at ~09:00; the daily cron publishes any
  that are due that day. Exact minute-level timing needs a more frequent cron (Pro).
- **Tokens:** Page access tokens expire; refresh and update `FB_PAGE_ACCESS_TOKEN` when needed.
- Captions are **rule-based** (free). Swap in an AI provider later if you want richer copy.

## Tech
Next.js 14 (App Router) · Vercel Cron + KV + Blob · Meta Graph API · OpenAI Images · Poppins via `next/font`.
