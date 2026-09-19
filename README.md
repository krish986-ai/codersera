<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# CodersEra Event Tickets

Digital event registration, ticket lookup, QR badges, and an admin console for CodersEra events.

View the original app in AI Studio: https://ai.studio/apps/1624c828-0238-494d-8b59-4d454409122a

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and configure Firebase variables if cloud persistence is required.
3. Run the app: `npm run dev`

## Data and security notes

Without Firebase, event and ticket data is stored in the current browser's local storage and is not shared between devices. Cloud synchronization is optional and failures are reported in the browser console.

The admin console is currently a client-side UI and must not be treated as a security boundary. Before using this application with real attendee data, add Firebase Authentication or a server-side authorization layer and enforce matching Firestore security rules. Never deploy Firestore with public read/write rules.
