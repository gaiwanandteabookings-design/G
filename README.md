# ProFix305 — Commercial Equipment Repair Website

Marketing site + booking/invoicing system for a South Florida (Miami-Dade, Broward, Palm
Beach) commercial equipment repair business covering refrigeration (walk-in
coolers/freezers, reach-ins, display cases), HVAC/AC, ice machines, commercial mixers,
exhaust hoods, and kitchen equipment. Modern responsive frontend, server-rendered
per-service landing pages for SEO, and a small Express/SQLite backend that captures
booking requests and lets you create and email professional PDF invoices from a
username/password-protected admin panel.

## Stack

- **Frontend:** server-rendered HTML (Express + template functions, no client framework)
  plus vanilla CSS/JS for interactivity — no build step.
- **Backend:** Node.js + Express, `server/server.js`.
- **Database:** SQLite via Node's built-in `node:sqlite` module — no external DB or native
  build step required (Node 22.5+).
- **Email notifications & invoices:** optional, via `nodemailer` + your own SMTP
  credentials — same credentials power booking notifications and invoice emails.
- **PDF invoices:** generated server-side with `pdfkit` (pure JS, no native build step).

## Project layout

```
server/
  server.js            Express app, page routes, sitemap.xml, 404 handler
  auth.js              admin username/password login + session tokens (in-memory)
  db.js                SQLite schema + queries (bookings + invoices)
  invoiceUtils.js       invoice number formatting, totals math — shared by API/PDF/email/view
  pdf.js               renders a branded invoice PDF (pdfkit)
  mailer.js            booking notifications, booking confirmation, invoice emails
  routes/
    invoices.js         admin-only invoice API (create/list/get/pdf/send/status)
  .env.example         copy to .env and fill in real values
  views/
    layout.js          shared <head>/header/footer wrapper for every page (brand, phone,
                        email, GA4 snippet — edit constants here to rebrand the whole site)
    servicePage.js      builds one service landing page from a service definition
    legalPage.js         builds Privacy Policy / Terms of Service pages
    invoiceView.js        builds the customer-facing invoice page
    icons.js              hand-drawn SVG icon set used across the site
  content/
    home.js             homepage copy + meta
    services.js          the 6 service definitions (edit this to add/change a service)
    legal.js              Privacy Policy / Terms of Service text
  public/
    admin.html           login-protected panel: bookings + invoices (create, send, track)
    robots.txt
    favicon.ico
    images/og-cover.jpg   social share preview image
    css/styles.css
    js/main.js
```

The homepage (`/`) and each service page (`/miami/<slug>/`) are rendered server-side from
`content/*.js` through `views/layout.js`, so header/nav/footer stay in one place. To add a
7th service, add an entry to `content/services.js` — a route, sitemap entry, and homepage
card are generated automatically.

## Running locally

```bash
cd server
cp .env.example .env   # edit ADMIN_USERNAME/ADMIN_PASSWORD (and SMTP settings for email)
npm install
npm start               # http://localhost:3000
```

Pages: `/`, `/miami/commercial-refrigeration-repair/`, `/miami/commercial-hvac-ac-repair/`,
`/miami/commercial-ice-machine-repair/`, `/miami/commercial-kitchen-equipment-repair/`,
`/miami/commercial-mixer-repair/`, `/miami/commercial-exhaust-hood-repair/`,
`/privacy-policy/`, `/terms-of-service/`, plus `/sitemap.xml` and `/robots.txt`. Unknown
URLs get a branded 404 page instead of Express's default error page.

Booking requests and invoices are stored in `server/data/bookings.db` (SQLite,
git-ignored). Manage both at `http://localhost:3000/admin.html`, signing in with
`ADMIN_USERNAME` / `ADMIN_PASSWORD` from your `.env` (defaults: `profix305` / `1234` —
**change this before going live**, see the security note below). From there you can:
- View and update booking request statuses
- Create a professional PDF invoice from scratch, or one click from an existing booking
  (pre-fills the customer's name/phone/address)
- Send it by email (PDF attached) straight from the browser, or save as a draft first
- Track status (draft / sent / paid / void) and resend or mark paid any time
- Every invoice also gets a shareable customer-facing link
  (`/invoice/<unguessable-id>/`) with a "Download PDF" button, in case the email bounces
  or they want it again later

## Before going live — replace these placeholders

The content was written from scratch (not copied from any reference site) but ships
with **placeholder business details** that must be replaced before launch:

- **Phone number / email** — real now: `(786) 919-7675` / `profix305@gmail.com`, set once
  in `server/views/layout.js` (`PHONE_DISPLAY`, `PHONE_TEL`, `EMAIL`) and reused
  everywhere (site, footer, PDFs, emails, JSON-LD). Still need `SMTP_PASS` (a Gmail App
  Password, not the account password) set as an env var for anything to actually send —
  see the SMTP section below.
- **Business name / domain** — `ProFix305` / still the placeholder `profix305.com` in
  `server/views/layout.js` (`SITE_NAME`, `SITE_URL`) until a real domain is bought and
  connected (see Production deployment below).
- **"Licensed" claims** — deliberately removed from this site (see `content/home.js`,
  `content/services.js`) after checking Florida's DBPR contractor-license database:
  simple repair work may or may not require a Class A/B/C mechanical/AC contractor
  license depending on scope (installs/alterations generally do, like-for-like repair is
  more of a gray area), but anyone handling refrigerant needs **EPA Section 608**
  certification regardless (federal, not state). Once you actually hold a real state
  and/or EPA credential, add "Licensed" back and put the real license number in the
  footer — until then, the site only claims "Insured."
- **Testimonials** — the three review cards on the homepage (`content/home.js`) are sample
  placeholder text, clearly marked with an HTML comment. Replace them with real,
  verifiable customer reviews before launch — publishing fabricated testimonials on a
  commercial site is both a trust issue and a legal risk (FTC endorsement guidelines).
- **`ADMIN_USERNAME` / `ADMIN_PASSWORD`** in `.env` — the shipped defaults
  (`profix305` / `1234`) are a placeholder for development only. A 4-digit numeric
  password is trivially guessable; there's a per-IP rate limit on the login endpoint
  (8 attempts / 15 min) as a backstop, but that's not a substitute for a real password.
  Change both before this site is reachable by the public, and never commit `.env`.
- **SMTP credentials** in `.env` — required for booking notification emails, booking
  confirmation emails, *and* sending invoices to customers. Without them, bookings and
  invoices still save fine, but nothing gets emailed (the admin panel will show a clear
  error if you try to send an invoice with no SMTP configured, rather than failing
  silently).
- **Privacy Policy / Terms of Service** (`content/legal.js`) are a generic starting
  template, not a substitute for review by a Florida-licensed attorney — have them
  checked before relying on them, especially once you're running paid ads.

## Production deployment

### Fastest path: Render (free tier, ~5 minutes)

This repo includes `render.yaml` at the root, so Render can deploy it automatically:

1. Sign up at [render.com](https://render.com) (GitHub login is fastest).
2. Dashboard → **New +** → **Blueprint**.
3. Connect your GitHub account and pick this repo/branch.
4. Render reads `render.yaml` and pre-fills everything (root dir `server`, build/start
   commands, Node version, `ADMIN_USERNAME=profix305`, and a strong random
   `ADMIN_PASSWORD` — not the `1234` dev default) — click **Apply**.
5. After the first build finishes (a couple minutes), Render gives you a live URL like
   `https://profix305.onrender.com` — open it, that's the real site.

**Free-tier caveats to know going in:**
- The free plan spins the service down after ~15 minutes of no traffic and takes ~30-60s
  to wake back up on the next visit — fine for showing someone the site, not ideal for a
  real launch expecting instant response on every visit (paid plan removes this).
- The free plan has **no persistent disk** — without the Turso setup below,
  `server/data/bookings.db` gets wiped on every redeploy, taking every booking and
  invoice with it. Do the Turso setup before taking any real bookings.
- Find your live `ADMIN_PASSWORD` under the service's **Environment** tab in the Render
  dashboard (Render generated a random one for you — it's not `1234`) to sign in at
  `/admin.html`.

### Making bookings/invoices survive redeploys (Turso setup — do this before real launch)

The app already speaks to [Turso](https://turso.tech) (a hosted, SQLite-compatible
database with a permanent free tier — no credit card needed) via `TURSO_DATABASE_URL` /
`TURSO_AUTH_TOKEN`. Without those two env vars set, it silently falls back to the local
file that Render wipes on every deploy. To turn on real persistence:

1. Sign up at [turso.tech](https://turso.tech) (GitHub login works).
2. Create a database — via their web dashboard ("Create Database", any name/region), or
   via their CLI (`turso db create profix305`) if you prefer the command line.
3. Get the two values the app needs:
   - **Database URL**: dashboard → your database → shown as `libsql://...` (or
     `turso db show profix305 --url` via CLI).
   - **Auth token**: dashboard → your database → "Create Token" (or
     `turso db tokens create profix305` via CLI).
4. In the Render dashboard → your service → **Environment** tab, add:
   - `TURSO_DATABASE_URL` = the `libsql://...` URL from step 3
   - `TURSO_AUTH_TOKEN` = the token from step 3
5. Render redeploys automatically when you save env vars. From then on, every booking
   and invoice lives in Turso and survives deploys, restarts, and disk resets.

Locally (no Turso account needed for development), the app just uses a local file at
`server/data/bookings.db` automatically whenever `TURSO_DATABASE_URL` isn't set.

### General checklist (any host)

The app is a plain Node process (`npm start`) with a file-based SQLite database — it runs
on almost any Node host. Rough checklist to take it from "runs on my machine" to live:

1. **Pick a host.** Simplest options for a small Node app: Render, Railway, or Fly.io
   (push the repo, set environment variables in their dashboard, done — they handle
   HTTPS certificates automatically). A plain VPS (DigitalOcean, Linode) works too, but
   then you're responsible for a process manager and a reverse proxy yourself:
   - Process manager: `pm2 start server.js --name profix305` keeps it running and
     restarts it on crash/reboot.
   - Reverse proxy + HTTPS: nginx in front of the Node process, with a free TLS
     certificate from Let's Encrypt (`certbot --nginx`).
2. **Persistent disk for the database.** `server/data/bookings.db` must live on a disk
   that survives redeploys. Render/Railway/Fly all support a small persistent volume —
   without one, every deploy wipes your booking history. A VPS's disk is already
   persistent by default.
3. **Environment variables to set on the host** (mirror of `.env.example`):
   `PORT`, `NODE_ENV=production`, `TRUST_PROXY=true` (if behind Render/Railway/nginx),
   `ADMIN_USERNAME` + `ADMIN_PASSWORD` (change from the `1234` dev default — see the
   security note above), `SMTP_*` + `NOTIFY_EMAIL` + `FROM_EMAIL` (needed for booking
   emails and for sending invoices), and `GA_MEASUREMENT_ID` (if you set up Google
   Analytics — see below).
4. **Domain & DNS.** Buy the domain (e.g. from Namecheap, Google Domains successor,
   Cloudflare), then point it at your host: usually an `A` record to the host's IP, or a
   `CNAME` to the hostname the platform gives you (Render/Railway/Fly all document this).
   DNS changes can take up to ~24-48 hours to fully propagate.
5. **Google Analytics 4 (optional but recommended).** Create a GA4 property at
   analytics.google.com, copy the Measurement ID (`G-XXXXXXX`), set it as
   `GA_MEASUREMENT_ID` in your environment — the tracking snippet and a `generate_lead`
   event on successful bookings are already wired up, they just need the ID to activate.
6. **Google Search Console.** Verify your domain at search.google.com/search-console,
   then submit `https://yourdomain.com/sitemap.xml` so all pages get crawled quickly
   instead of waiting for Google to find them on its own.
7. **SMTP for your new business email.** Once you have a real email address, get SMTP
   credentials for it and set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — this is
   what powers booking notifications and invoice sending. Common setups:
   - **Google Workspace / Gmail:** `smtp.gmail.com`, port `587`. You need an **App
     Password** (myaccount.google.com/apppasswords), not your normal login password —
     Gmail blocks plain-password SMTP logins by default.
   - **Zoho Mail:** `smtp.zoho.com`, port `587`.
   - **Microsoft 365 / Outlook:** `smtp.office365.com`, port `587`.
   - Whatever provider you pick, `SMTP_USER` is the full email address and `FROM_EMAIL`
     should match it (or be a verified alias) — most providers reject mail sent "from" an
     address they don't recognize as yours.

## SEO — what actually moves rankings (read this before asking "why aren't we #1")

The site's code can only do part of the job. Naming and on-page content have a small
effect; the following off-site work is what actually determines whether you show up when
someone searches "commercial refrigeration repair Miami":

1. **Google Business Profile** (business.google.com) — create and verify it with your
   real address/phone, pick every relevant category (Refrigeration, HVAC, Commercial
   Kitchen equipment repair, etc.), add photos. Without this, you will not appear in
   Google Maps or the local 3-pack, regardless of how good the website is.
2. **Reviews** — ask every completed job for a Google review. Review count and rating are
   one of the heaviest local-ranking factors, heavier than almost anything on-page.
3. **NAP consistency** — your Name/Address/Phone must match exactly across the website,
   Google Business Profile, Yelp, and any directory listing. Mismatches hurt local trust
   signals.
4. **Citations/backlinks** — get listed on Yelp, Angi, industry directories, local chamber
   of commerce sites, etc., all linking back with the same NAP.
5. **This site's per-service pages** (`/miami/<slug>/`) exist specifically to rank for
   long-tail searches like "ice machine repair Miami" or "exhaust hood repair Fort
   Lauderdale" — but they need to actually be submitted to Google Search Console
   (search.google.com/search-console) with the sitemap at `/sitemap.xml` to get indexed
   quickly, rather than waiting for Google to discover them on its own.
6. **Paid ads (Google Ads / Local Services Ads)** — the only way to appear at the top
   immediately. Organic ranking from a new site realistically takes weeks to months no
   matter how the site or business is named.

## Notes

- The booking form includes basic spam protection (honeypot field + per-IP rate limit)
  and server-side validation — it does not rely on client-side checks alone.
- `node:sqlite` is an experimental Node API; it works reliably here but expect a startup
  console warning about that until it's stabilized upstream.
