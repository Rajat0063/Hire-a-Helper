# HireHelper — On-Demand Task Assistance

Full-stack MERN application where users post tasks and others request to help.
Built with **MongoDB Atlas + Express + React (Vite) + Node.js**.

```
HireHelper/
├── backend/      Express API + MongoDB (Mongoose) + JWT + OTP email
├── frontend/     React + Vite + Tailwind + React Router
└── README.md     <- you are here
```

## Quick start (VS Code)

Open this folder in VS Code, then run two terminals:

### 1) Backend
```bash
cd backend
npm install
cp .env.example .env      # !! edit values — see backend/README.md
npm run dev               # http://localhost:5000
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Where do I plug in MongoDB Atlas?

→ `backend/.env`  set `MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/hirehelper`
Full instructions in **[backend/README.md](./backend/README.md)**.

## Features
- User signup / login (JWT)
- Email OTP verification
- User dashboard (Feed, My Tasks, Requests, My Requests, Add Task, Settings)
- **Admin login + admin dashboard** (manage users & tasks)
- Advanced responsive landing page
- Fully responsive UI (mobile / tablet / desktop)

See `frontend/README.md` and `backend/README.md` for module-level details.
