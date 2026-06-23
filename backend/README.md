# HireHelper — Backend

Express REST API with MongoDB Atlas, JWT auth, and email OTP verification.

## Tech
| Layer        | Library                          |
|--------------|----------------------------------|
| Runtime      | Node.js 18+                      |
| Framework    | Express 4                        |
| Database     | MongoDB Atlas via Mongoose       |
| Auth         | JWT (jsonwebtoken) + bcryptjs    |
| OTP email    | Nodemailer (SMTP)                |
| Validation   | express-validator                |
| File uploads | multer                           |

## Folder layout
```
backend/src/
├── config/db.js          # !! MongoDB Atlas connection — reads MONGO_URI
├── models/               # Mongoose schemas (User, Task, Request, Notification, Otp)
├── controllers/          # Business logic (auth, task, request, admin)
├── routes/               # Express routers mounted in server.js
├── middleware/           # auth.js (JWT verify) + admin.js (role gate)
├── utils/mailer.js       # !! SMTP config for OTP emails
└── server.js             # entry point
```

## Setup

1. `npm install`
2. Copy env template and **edit the values**:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in:

   | Var               | Where to get it                                                    |
   |-------------------|--------------------------------------------------------------------|
   | `MONGO_URI`       | MongoDB Atlas → Cluster → *Connect* → *Drivers* → copy SRV string  |
   | `JWT_SECRET`      | any long random string                                             |
   | `SMTP_HOST/PORT`  | your email provider (e.g. `smtp.gmail.com` / `587`)                |
   | `SMTP_USER/PASS`  | mailbox + app-password (Gmail: create an *App Password*)           |
   | `ADMIN_EMAIL`     | the email seeded as admin on first run                             |
   | `ADMIN_PASSWORD`  | seeded admin password (change after first login!)                  |

4. `npm run dev` — starts on `http://localhost:5000`.
   On first boot the admin account is auto-seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## Where to edit common things

- **Change Atlas connection** → `backend/.env` → `MONGO_URI`
- **Add a new model**          → `backend/src/models/*.js`
- **Add a new endpoint**       → controller in `controllers/`, route in `routes/`, mount in `server.js`
- **Change OTP email body**    → `backend/src/utils/mailer.js`
- **Tweak token lifetime**     → `backend/src/controllers/authController.js` → `jwt.sign(..., { expiresIn })`

## API surface (high level)

```
POST   /api/auth/signup          { firstName, lastName, email, phone, password }
POST   /api/auth/login           { email, password }            -> { token, user }
POST   /api/auth/verify-otp      { email, otp }
POST   /api/auth/resend-otp      { email }

GET    /api/tasks                feed (auth)
POST   /api/tasks                create task (auth)
GET    /api/tasks/mine           tasks I created (auth)
POST   /api/tasks/:id/request    request to help (auth)

GET    /api/requests/received    requests on my tasks (auth)
GET    /api/requests/sent        requests I sent (auth)
PATCH  /api/requests/:id         accept/reject (auth)

GET    /api/notifications        (auth)

POST   /api/admin/login          admin login
GET    /api/admin/users          (admin)
GET    /api/admin/tasks          (admin)
DELETE /api/admin/users/:id      (admin)
DELETE /api/admin/tasks/:id      (admin)

PUT    /api/users/me             update profile (auth)
```
