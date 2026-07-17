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
  server.js            Express app, API routes, page routes, sitemap.xml
  db.js                SQLite schema + queries
  mailer.js            optional email notification on new booking
  .env.example         copy to .env and fill in real values
  views/
    layout.js          shared <head>/header/footer wrapper for every page
    servicePage.js      builds one service landing page from a service definition
  content/
    home.js             homepage copy + meta
    services.js          the 6 service definitions (edit this to add/change a service)
  public/
    admin.html           token-gated page to view/manage booking leads
    robots.txt
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
`/miami/commercial-mixer-repair/`, `/miami/commercial-exhaust-hood-repair/`, plus
`/sitemap.xml` and `/robots.txt`.

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
- **License number** in the footer (`License #CACXXXXXXX (placeholder)`, in `layout.js`).
- **Testimonials** — the three review cards on the homepage (`content/home.js`) are sample
  placeholder text, clearly marked with an HTML comment. Replace them with real,
  verifiable customer reviews before launch — publishing fabricated testimonials on a
  commercial site is both a trust issue and a legal risk (FTC endorsement guidelines).
- **`ADMIN_TOKEN`** in `.env` — set a real random secret, never commit `.env`.
- **SMTP credentials** in `.env` if you want email alerts on new bookings; without them,
  bookings are still saved to the database, just not emailed.
- **`images/og-cover.jpg`** referenced in the JSON-LD/Open Graph tags doesn't exist yet —
  add a real image or remove the reference.

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
