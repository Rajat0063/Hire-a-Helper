# Hire-a-Helper Platform

A full-stack web application for posting, managing, and requesting help for tasks.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Core Functionality](#core-functionality)
- [API Endpoints](#api-endpoints)
- [Frontend Pages](#frontend-pages)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- User authentication (signup, login, OTP verification, password reset)
- Dashboard with feed, tasks, requests, and settings
- Real-time notifications for requests and task updates
- Add, update, and manage tasks
- Request help for tasks and respond to incoming requests

---

## Project Structure

```
backend/
  ├── config/
  ├── controllers/
  ├── middleware/
  ├── models/
  ├── routes/
  ├── utils/
  ├── .env
  ├── package.json
  └── server.js
frontend/
  ├── public/
  ├── src/
  │   ├── components/
  │   ├── App.jsx
  │   └── ...
  ├── .env
  ├── package.json
  └── index.html
```

---

## Getting Started

### Backend Setup

1. Install dependencies:
    ```sh
    cd backend
    npm install
    ```
2. Configure environment variables in `backend/.env`.
3. Start the server:
    ```sh
    npm start
    ```
   The backend runs on port `5001` by default.

### Frontend Setup

1. Install dependencies:
    ```sh
    cd frontend
    npm install
    ```
2. Configure environment variables in `frontend/.env` (see below).
3. Start the development server:
    ```sh
    npm run dev
    ```
   The frontend runs on port `5173` by default.

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5001/api
```

---

## Core Functionality

- **Authentication:** Signup, login, OTP verification, password reset ([authController.js](backend/controllers/authController.js))
- **Dashboard:** Feed, My Tasks, Requests, My Requests, Add Task, Settings ([DashboardLayout.jsx](frontend/src/components/layout/DashboardLayout.jsx))
- **Tasks:** Create, view, and manage tasks ([taskModel.js](backend/models/taskModel.js), [AddTaskContent.jsx](frontend/src/components/pages/AddTaskContent.jsx))
- **Requests:** Send and respond to requests ([incomingRequestModel.js](backend/models/incomingRequestModel.js), [RequestModal.jsx](frontend/src/components/ui/RequestModal.jsx))
- **Notifications:** Real-time notifications for requests ([notificationModel.js](backend/models/notificationModel.js))

---

## API Endpoints

- `POST /api/auth/signup` — Register a new user
- `POST /api/auth/login` — Login
- `POST /api/auth/verify-otp` — Verify OTP
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password/:token` — Reset password
- `GET /api/tasks` — Get all tasks
- `POST /api/tasks` — Add a new task
- `PATCH /api/mytasks/:taskId` — Update task status
- `GET /api/incoming-requests/received/:userId` — Get incoming requests
- `POST /api/incoming-requests` — Send a request
- `PATCH /api/incoming-requests/accept/:requestId` — Accept a request
- `PATCH /api/incoming-requests/decline/:requestId` — Decline a request
- `POST /api/incoming-requests/mark-seen` — Mark requests as seen
- `GET /api/incoming-requests/notifications/:userId` — Get notifications

---

## Frontend Pages

- `/` — Landing Page
- `/login` — Login
- `/signup` — Signup
- `/verify-otp` — OTP Verification
- `/forgot-password` — Forgot Password
- `/reset-password/:token` — Reset Password
- `/dashboard/feed` — Task Feed
- `/dashboard/my-tasks` — My Tasks
- `/dashboard/requests` — Incoming Requests
- `/dashboard/my-requests` — My Requests
- `/dashboard/add-task` — Add Task
- `/dashboard/settings` — Profile Settings

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Create a pull request

---

## License

MIT