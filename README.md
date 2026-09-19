<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# CodersEra Event Tickets

Digital event registration, ticket lookup, QR badges, and an admin console for CodersEra events.

View the original app in AI Studio: https://ai.studio/apps/1624c828-0238-494d-8b59-4d454409122a

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set a unique `ADMIN_PASSWORD` with at least 12 characters.
3. Start the local authentication server: `npm run auth`
4. In a second terminal, run the app: `npm run dev`
   - Or run both together with `npm run dev:full`.

## Data and security notes

Without Firebase, event and ticket data is stored in the current browser's local storage and is not shared between devices. Cloud synchronization is optional and failures are reported in the browser console.

The admin console uses a local Express authentication server with scrypt password verification, expiring HttpOnly session cookies, and server-side session checks. The in-memory session store is intended for local development only; use a persistent session store, HTTPS, rate limiting, and a production identity provider before deployment. Never deploy Firestore with public read/write rules.
