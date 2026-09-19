<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# CodersEra Event Tickets

Digital event registration, ticket lookup, QR badges, and an admin console for CodersEra events.

View the original app in AI Studio: https://ai.studio/apps/1624c828-0238-494d-8b59-4d454409122a

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set:
   - `ADMIN_PASSWORD` — unique password, at least 12 characters
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — for OTP emails (Gmail: `smtp.gmail.com`, `587`, your email, App Password)
3. Start the local authentication server: `npm run auth`
4. In a second terminal, run the app: `npm run dev`
   - Or run both together with `npm run dev:full`.

## Email Verification (OTP)

Registration uses a 6-digit OTP sent via email (no Firebase Auth required). Configure SMTP in `.env.local`:

- **Gmail**: Enable 2FA → Google Account → App Passwords → generate one for "Mail"
- **Other providers**: Use their SMTP credentials

Without SMTP configured, OTPs are logged to the server console (dev fallback).

## Data and security notes

Firestore is private: browser code only calls the `/api` serverless routes. Deploy `firestore.rules` to deny all client access. Public routes expose active event summaries, narrowly scoped ticket lookup, and registration; all attendee administration and check-in require the signed admin session.

On Vercel, configure `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` from a Firebase service-account JSON key (store the key only as an encrypted server environment variable). Also configure `ADMIN_PASSWORD` and a random `AUTH_SECRET` of at least 32 characters.

The admin console uses a local Express authentication server with scrypt password verification, expiring HttpOnly session cookies, and server-side session checks. The in-memory session store is intended for local development only; use a persistent session store, HTTPS, rate limiting, and a production identity provider before deployment. Never deploy Firestore with public read/write rules.
