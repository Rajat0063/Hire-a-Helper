# HireHelper — Frontend

React (Vite) SPA. Talks to the Express backend at `VITE_API_URL`.

## Tech
| Layer       | Library                                  |
|-------------|------------------------------------------|
| Build       | Vite 5                                   |
| UI          | React 18 + React Router 6                |
| Styling     | Tailwind CSS 3                           |
| HTTP        | Axios (with JWT interceptor)             |
| Icons       | lucide-react                             |
| Toasts      | react-hot-toast                          |

## Folder layout
```
frontend/src/
├── pages/
│   ├── Landing.jsx          # advanced public landing page
│   ├── Login.jsx / Signup.jsx / VerifyOtp.jsx
│   ├── dashboard/           # Feed, MyTasks, Requests, MyRequests, AddTask, Settings
│   └── admin/               # AdminLogin, AdminDashboard
├── components/              # Navbar, Sidebar, TaskCard, ProtectedRoute, etc.
├── context/AuthContext.jsx  # JWT + user state (persists to localStorage)
├── services/api.js          # !! axios baseURL — change VITE_API_URL in .env
└── App.jsx                  # routes
```

## Setup
1. `npm install`
2. `cp .env.example .env` then set `VITE_API_URL=http://localhost:5000/api`
3. `npm run dev` → http://localhost:5173

## Where to edit common things
- **Backend URL**          → `frontend/.env` → `VITE_API_URL`
- **Brand colors / theme** → `frontend/tailwind.config.js` + `src/index.css`
- **Landing page**         → `src/pages/Landing.jsx`
- **Add a route**          → register in `src/App.jsx`
- **Auth flow / token**    → `src/context/AuthContext.jsx`

## Pages
| Path              | Who         | What                                          |
|-------------------|-------------|-----------------------------------------------|
| `/`               | public      | Landing page                                  |
| `/login`          | public      | User login                                    |
| `/signup`         | public      | User signup                                   |
| `/verify-otp`     | public      | Email OTP verification                        |
| `/dashboard`      | user        | Feed (browse tasks)                           |
| `/dashboard/mine` | user        | My posted tasks                               |
| `/dashboard/requests` | user    | Requests received                             |
| `/dashboard/my-requests` | user | Requests I sent                              |
| `/dashboard/add`  | user        | Create a task                                 |
| `/dashboard/settings` | user    | Profile settings                              |
| `/admin/login`    | public      | Admin login                                   |
| `/admin`          | admin       | Admin dashboard (users + tasks)               |
```
