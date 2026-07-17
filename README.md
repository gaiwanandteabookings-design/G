# ProFix305 — Commercial Equipment Repair Website

Marketing site + booking system for a South Florida (Miami-Dade, Broward, Palm Beach)
commercial equipment repair business covering refrigeration (walk-in coolers/freezers,
reach-ins, display cases), HVAC/AC, ice machines, commercial mixers, exhaust hoods, and
kitchen equipment. Modern responsive frontend, server-rendered per-service landing pages
for SEO, and a small Express/SQLite backend that captures booking requests.

## Stack

- **Frontend:** server-rendered HTML (Express + template functions, no client framework)
  plus vanilla CSS/JS for interactivity — no build step.
- **Backend:** Node.js + Express, `server/server.js`.
- **Database:** SQLite via Node's built-in `node:sqlite` module — no external DB or native
  build step required (Node 22.5+).
- **Email notifications:** optional, via `nodemailer` + your own SMTP credentials.

## Project layout

```
server/
  server.js            Express app, API routes, page routes, sitemap.xml, 404 handler
  db.js                SQLite schema + queries
  mailer.js            booking notification (to you) + confirmation email (to customer)
  .env.example         copy to .env and fill in real values
  views/
    layout.js          shared <head>/header/footer wrapper for every page (brand, phone,
                        email, GA4 snippet — edit constants here to rebrand the whole site)
    servicePage.js      builds one service landing page from a service definition
    legalPage.js         builds Privacy Policy / Terms of Service pages
  content/
    home.js             homepage copy + meta
    services.js          the 6 service definitions (edit this to add/change a service)
    legal.js              Privacy Policy / Terms of Service text
  public/
    admin.html           token-gated page to view/manage booking leads
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
cp .env.example .env   # edit ADMIN_TOKEN (and SMTP settings if you want email alerts)
npm install
npm start               # http://localhost:3000
```

Pages: `/`, `/miami/commercial-refrigeration-repair/`, `/miami/commercial-hvac-ac-repair/`,
`/miami/commercial-ice-machine-repair/`, `/miami/commercial-kitchen-equipment-repair/`,
`/miami/commercial-mixer-repair/`, `/miami/commercial-exhaust-hood-repair/`,
`/privacy-policy/`, `/terms-of-service/`, plus `/sitemap.xml` and `/robots.txt`. Unknown
URLs get a branded 404 page instead of Express's default error page.

Booking requests submitted on the site are stored in `server/data/bookings.db` (SQLite,
git-ignored). View/manage them at `http://localhost:3000/admin.html` using the
`ADMIN_TOKEN` from your `.env`.

## Before going live — replace these placeholders

The content was written from scratch (not copied from any reference site) but ships
with **placeholder business details** that must be replaced before launch:

- **Phone number / email** — currently `(305) 555-0199` / `booking@profix305.com`, set
  once in `server/views/layout.js` (`PHONE_DISPLAY`, `PHONE_TEL`, `EMAIL`) and reused
  everywhere. `server/mailer.js` defaults come from `.env`.
- **Business name / domain** — `ProFix305` / `profix305.com`, also set in
  `server/views/layout.js` (`SITE_NAME`, `SITE_URL`) and used in JSON-LD/Open Graph tags.
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
- **`ADMIN_TOKEN`** in `.env` — set a real random secret, never commit `.env`.
- **SMTP credentials** in `.env` if you want email alerts on new bookings (both the
  internal notification to you and the automatic confirmation email to the customer);
  without them, bookings are still saved to the database, just not emailed.
- **Privacy Policy / Terms of Service** (`content/legal.js`) are a generic starting
  template, not a substitute for review by a Florida-licensed attorney — have them
  checked before relying on them, especially once you're running paid ads.

## Production deployment

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
   `ADMIN_TOKEN`, `SMTP_*` + `NOTIFY_EMAIL` + `FROM_EMAIL` (if you want email), and
   `GA_MEASUREMENT_ID` (if you set up Google Analytics — see below).
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
