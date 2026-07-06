# Hire-a-Helper

A full-stack **MERN** marketplace for posting and accepting local help tasks. Runs entirely from your own VS Code on your own MongoDB Atlas cluster — no Lovable Cloud, no third-party auth service.

```
.
├── backend/    # Node + Express + Mongoose + Socket.IO  (REST + realtime)
└── frontend/   # React + Vite + Tailwind + Leaflet      (SPA)
```

## What's inside

**User-facing**
- Landing page, signup with **email OTP**, login, **forgot / reset password** (email OTP).
- **Phone OTP** — production-ready via **Twilio Verify** (real SMS). Falls back to a dev OTP printed in the server console if Twilio env vars are absent.
- Per-user Dashboard with: Overview (profile card, achievements, reviews, stats), Feed (live search results, admin categories + AI picks), My Tasks (edit/delete), Requests (sidebar badge, click name → public profile), My Requests (Message button after accept), Messages (realtime chat, profile links, block/unblock, delete), Nearby Tasks (free **OpenStreetMap/Leaflet** map with address search), Add Task (mandatory drag & drop image, default INR, "Use mine" reverse-geocodes to city), Settings (cover + profile pictures, bio, address, locked email, verified phone, change password).
- **Reviews & Achievements** — task owners review the worker they accepted; the worker sees stars + review history on their Overview and earns auto-unlocked badges.
- **Public profile** — task owners can preview a requester (name, bio, address, rating, reviews) before accepting. Email/phone stay hidden until acceptance, no direct-message option.
- **Dark mode** — Light / Dark / System (persists per user).
- **Realtime** — Socket.IO powers notifications, requests, messages, and task feed updates.

**Admin-facing** (`/admin/login`)
- Stats: users, active tasks, pending requests, **completion rate**.
- Users tab: **Block / Unblock** (blocked users are force-logged-out everywhere and shown a clear banner on login; signup with their email is also refused). Delete.
- Tasks tab: delete tasks, **Recent Requests** feed.
- Analytics tab.
- Settings tab: toggles for registrations, email verification, task editing, push notifications, maintenance mode, plus full **category management** (the chips on Feed and the dropdown on Add Task come from here).
- Mobile-friendly header with a collapsible tab strip.

## Setup

```bash
# Backend
cd backend
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, SMTP_*, ADMIN_*, (optional) TWILIO_*
npm install
npm run dev                 # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Admin is seeded on first boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`. Login at `/admin/login`.

## Documentation

- `backend/README.md` — every API route, what it does, where to plug your DB.
- `frontend/README.md` — every page, component, and the realtime wiring.

