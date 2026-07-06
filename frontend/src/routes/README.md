# Frontend — Hire-a-Helper (React + Vite)

```bash
npm install
npm run dev          # http://localhost:5173
```

Set `VITE_API_URL` in `.env` if your backend is not on `http://localhost:5000/api`.

## Tech

- **React 18 + Vite** SPA, **React Router**, **Tailwind CSS** (with dark mode class)
- **axios** for REST, **socket.io-client** for realtime
- **react-leaflet** + **leaflet** for the Nearby map (OpenStreetMap tiles — free, no key)
- **lucide-react** icons, **react-hot-toast** notifications

## File map

```
src/
├── main.jsx                  # mounts <AuthProvider> + <ThemeProvider>; imports leaflet CSS
├── App.jsx                   # routes
├── index.css                 # tailwind layers + .btn / .card / .input / .chip primitives
├── context/
│   ├── AuthContext.jsx       # token + user state, login/signup/verify/refresh helpers
│   └── ThemeContext.jsx      # light / dark / system, persists in localStorage
├── services/
│   ├── api.js                # axios instance + 403 USER_BLOCKED auto-logout interceptor
│   └── socket.js             # socket.io-client singleton
├── components/
│   ├── DashboardLayout.jsx   # sticky sidebar w/ Requests badge, mobile drawer, HeaderBar
│   ├── HeaderBar.jsx         # sticky search + theme + notifications + profile (mobile-centered popovers)
│   └── Protected.jsx         # route guard
└── pages/
    ├── Landing.jsx
    ├── Login.jsx             # shows blocked / EMAIL_EXISTS banners
    ├── Signup.jsx
    ├── VerifyOtp.jsx / ForgotPassword.jsx / ResetPassword.jsx
    ├── dashboard/
    │   ├── Overview.jsx          # pro profile card + achievements + reviews + stats
    │   ├── Feed.jsx              # search + category chips + location filter + AI picks
    │   ├── MyTasks.jsx / Requests.jsx / MyRequests.jsx
    │   ├── Messages.jsx          # viewport-locked, ONLY the message list scrolls
    │   ├── Nearby.jsx            # real Leaflet map w/ user marker, radius, task markers
    │   ├── AddTask.jsx           # drag&drop image + "Use mine" reverse-geocode to city
    │   ├── Settings.jsx          # cover + avatar, locked email, phone OTP verification
    │   └── PublicProfile.jsx     # preview of a requester (no email/phone)
    └── admin/
        ├── AdminLogin.jsx
        └── AdminDashboard.jsx    # mobile tab strip, block/unblock, settings + categories, recent requests
```

## Notable behaviours

- **Per-user data**: every dashboard widget reads `/users/overview` and `/reviews/user/<me>`, so each account sees only its own numbers, achievements and reviews.
- **Persistent profile**: avatar + cover are stored as base64 in MongoDB via `PUT /users/me`. After save we `setUser(data.user)` + `refreshUser()` so a refresh keeps the new images.
- **Email is locked**: the field on Settings is `disabled` and the backend ignores any attempt to change it. Re-signup with the same address surfaces the friendly "already exists" alert.
- **Phone OTP is real** when Twilio env vars are configured in the backend; otherwise the dev OTP shows in a toast for local development.
- **Force-logout on block**: the axios response interceptor in `services/api.js` watches for `403 { code: "USER_BLOCKED" }`, clears the session and redirects to `/login?blocked=1` where a banner appears.
- **Sidebar Requests badge** updates live via socket events (`request:new` / `request:status`).
- **Search**: every search is POSTed to `/search/log`; recent searches appear as suggestion chips in the header.
- **Dark mode**: 3-state toggle (Light / Dark / System) in both the user dashboard header and the admin header.
- **Disabled browser back**: `DashboardLayout` and `AdminDashboard` push history state on `popstate` so users can't navigate out of the authenticated area with the back button.

## How the realtime updates work

`services/socket.js` creates a single socket.io client authenticated with the JWT. Components subscribe in `useEffect` and call their `load()` again on the matching event:

| Event | Listeners |
|-------|-----------|
| `notification:new` | `HeaderBar` (popover + badge) |
| `request:new` / `request:status` | `Requests`, `MyRequests`, `DashboardLayout` (sidebar badge) |
| `message:new` | `Messages` |
| `task:created` / `updated` / `deleted` | `Feed`, `MyTasks` |
