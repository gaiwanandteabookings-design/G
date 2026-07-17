# ColdChain305 — Commercial Walk-In Cooler & Freezer Repair Website

Marketing site + booking system for a South Florida (Miami-Dade, Broward, Palm Beach)
commercial walk-in cooler/freezer repair business. Modern responsive frontend, plus a
small Express/SQLite backend that captures booking requests from the site's form.

## Stack

- **Frontend:** static HTML/CSS/vanilla JS (`server/public/`), served by Express.
- **Backend:** Node.js + Express, `server/server.js`.
- **Database:** SQLite via Node's built-in `node:sqlite` module — no external DB or native
  build step required (Node 22.5+).
- **Email notifications:** optional, via `nodemailer` + your own SMTP credentials.

## Project layout

```
server/
  server.js          Express app + API routes
  db.js               SQLite schema + queries
  mailer.js           optional email notification on new booking
  .env.example         copy to .env and fill in real values
  public/
    index.html         main site
    admin.html          token-gated page to view/manage booking leads
    css/styles.css
    js/main.js
```

## Running locally

```bash
cd server
cp .env.example .env   # edit ADMIN_TOKEN (and SMTP settings if you want email alerts)
npm install
npm start               # http://localhost:3000
```

Booking requests submitted on the site are stored in `server/data/bookings.db` (SQLite,
git-ignored). View/manage them at `http://localhost:3000/admin.html` using the
`ADMIN_TOKEN` from your `.env`.

## Before going live — replace these placeholders

The content was written from scratch (not copied from any reference site) but ships
with **placeholder business details** that must be replaced before launch:

- **Phone number / email** — currently `(305) 555-0199` / `booking@coldchain305.com`,
  used throughout `index.html`, `admin.html`, and `mailer.js` defaults. Search and
  replace with the real business number and inbox.
- **Business name / domain** — `ColdChain305` / `coldchain305.com` (also used in the
  JSON-LD structured data block and Open Graph tags in `index.html`).
- **License number** in the footer (`License #CACXXXXXXX (placeholder)`).
- **Testimonials** — the three review cards in the "Reviews" section are sample
  placeholder text, clearly marked with an HTML comment in `index.html`. Replace them
  with real, verifiable customer reviews before launch — publishing fabricated
  testimonials on a commercial site is both a trust issue and a legal risk (FTC
  endorsement guidelines).
- **`ADMIN_TOKEN`** in `.env` — set a real random secret, never commit `.env`.
- **SMTP credentials** in `.env` if you want email alerts on new bookings; without them,
  bookings are still saved to the database, just not emailed.

## Notes

- The booking form includes basic spam protection (honeypot field + per-IP rate limit)
  and server-side validation — it does not rely on client-side checks alone.
- `node:sqlite` is an experimental Node API; it works reliably here but expect a startup
  console warning about that until it's stabilized upstream.
