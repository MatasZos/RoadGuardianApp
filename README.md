# RoadGuardian

RoadGuardian is a Next.js + MongoDB group project aimed at making it easier for riders to:

- log maintenance
- store key documents
- share live location (opt-in)
- report emergencies and coordinate help on a live map
- message other riders during an emergency
- use a simple “assistant” chat for quick tips

## Emergency Workflow (Statuses)

Emergencies move through a small set of statuses so the UI stays clear:

- Reported
- Helper Assigned
- On The Way
- Arrived
- Resolved
- Cancelled

Reporter actions:

- Cancel Request
- Mark Resolved

Helper actions:

- I’m On The Way
- Mark Arrived
- Mark Resolved

When an emergency is resolved/cancelled it disappears from the live map and active list, clears any route line, and shows in recent history.

## Local Setup

1. Install dependencies: `npm install`
2. Create `.env.local` (see below)
3. Run the dev server: `npm run dev`
4. Open `http://localhost:3000`

## Environment Variables

Required for core app:

- `MONGODB_URI`
- `NEXTAUTH_SECRET`

Required for real-time features:

- `ABLY_API_KEY`

Required for the emergency map:

- `NEXT_PUBLIC_MAPBOX_TOKEN`

Optional (only needed for certain pages/features):

- `OPENROUTER_API_KEY` (assistant chat)
- `OPENROUTER_MODEL` (assistant chat model override)
- `OPENROUTER_SITE_URL` / `OPENROUTER_APP_NAME` (assistant chat headers)
- `API_NINJAS_KEY` (motorcycle lookup)
