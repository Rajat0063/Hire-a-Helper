

<div align="center">
	<img src="frontend/src/assets/logo%20(2).png" alt="Hire-a-Helper Logo" width="60" style="vertical-align:middle;margin-right:12px;" />
	<h1 style="display:inline-block;vertical-align:middle;font-size:2.5rem;margin:0;">HIRE-A-HELPER</h1>
	<br/>
	<em>Connect, Collaborate, and Get Things Done Effortlessly.</em>
</div>

---

## 🛠️ Built with the tools and technologies:

<div align="center">

<img src="https://img.shields.io/badge/Express.js-000?style=for-the-badge&logo=express" />
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io" />
<img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E" />
<img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
<img src="https://img.shields.io/badge/React%20Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" />
<img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" />
<img src="https://img.shields.io/badge/PostCSS-DD3A0A?style=for-the-badge&logo=postcss&logoColor=white" />
<img src="https://img.shields.io/badge/Nodemailer-009688?style=for-the-badge&logo=nodemailer&logoColor=white" />
<img src="https://img.shields.io/badge/SendGrid-2C3E50?style=for-the-badge&logo=sendgrid&logoColor=white" />
<img src="https://img.shields.io/badge/Bcryptjs-F7B93E?style=for-the-badge" />
<img src="https://img.shields.io/badge/JSONWebToken-000000?style=for-the-badge" />
<img src="https://img.shields.io/badge/React%20Icons-EA4C89?style=for-the-badge" />
<img src="https://img.shields.io/badge/React%20Easy%20Crop-00C853?style=for-the-badge" />
<img src="https://img.shields.io/badge/Emotion-DB7093?style=for-the-badge&logo=emotion&logoColor=white" />
<img src="https://img.shields.io/badge/MUI-007FFF?style=for-the-badge&logo=mui&logoColor=white" />
<img src="https://img.shields.io/badge/React%20Query-FF4154?style=for-the-badge" />

</div>

---

## 📋 Table of Contents

- [Why Hire-a-Helper?](#-why-hire-a-helper)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Folder Structure](#-folder-structure)
- [Screenshots](#-screenshots)
- [Author](#-author)

---


## ❓ Why Hire-a-Helper?

**Hire-a-Helper** is a full-stack platform for posting, discovering, and managing tasks in real time. It connects users who need help with those who can offer it, featuring robust authentication, real-time updates, and a modern, responsive UI.

---

## ✨ Features

- **Real-Time Collaboration:** Instant updates for tasks, requests, and notifications using Socket.io.
- **User Authentication:** Secure signup, login, password reset, and OTP verification with JWT.
- **Task Management:** Post, view, accept, and manage tasks with live feed updates.
- **Request System:** Send, accept, or decline requests for tasks, with real-time feedback.
- **Profile Management:** Update user profiles and view history.
- **Responsive Design:** Mobile-first, adaptive layouts with Tailwind CSS.
- **Modern UI/UX:** Animated landing, login, and signup pages with glassmorphism and SVG effects.
- **Notifications:** In-app and real-time notifications for requests and task status.
- **Robust Error Handling:** Friendly error messages and validation throughout.
- **Admin/Settings Panel:** Manage account settings and preferences.
- **Image Upload & Cropping:** Profile and task images with cropping (React Easy Crop).
- **Email Integration:** Password reset and notifications via Nodemailer/SendGrid.

---


## 🏗️ Technologies & Libraries

### Backend

- **Node.js** & **Express.js** — REST API server
- **MongoDB** & **Mongoose** — Database and ODM
- **Socket.io** — Real-time communication
- **JWT (jsonwebtoken)** — Authentication
- **Bcryptjs** — Password hashing
- **Nodemailer** & **SendGrid** — Email services
- **dotenv** — Environment variable management
- **CORS** — Cross-origin resource sharing

### Frontend

- **React** — UI library
- **Vite** — Fast build tool
- **Tailwind CSS** — Utility-first CSS framework
- **React Router DOM** — Routing
- **Axios** — HTTP client
- **Socket.io-client** — Real-time updates
- **React Icons** — Icon library
- **React Easy Crop** — Image cropping
- **@mui/material** & **@emotion/react** — UI components and styling
- **@tanstack/react-query** — Data fetching and caching
- **ESLint** — Linting
- **PostCSS** & **Autoprefixer** — CSS processing

---


## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **MongoDB** (local or cloud)

### Installation

1. **Clone the repository:**
	```sh
	git clone https://github.com/Rajat0063/Hire-a-Helper.git
	cd Hire-a-Helper
	```

2. **Install backend dependencies:**
	```sh
	cd backend
	npm install
	```

3. **Install frontend dependencies:**
	```sh
	cd ../frontend
	npm install
	```

4. **Set up environment variables:**
	- Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill in required values.

5. **Start the backend server:**
	```sh
	npm run dev
	```

6. **Start the frontend dev server:**
	```sh
	npm run dev
	```

---


## 📁 Folder Structure

```
Hire-a-Helper/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── socket.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── utils/
│   │   └── ...
│   ├── index.html
│   └── ...
├── README.md
└── ...
```

---



## 🖼️ Screenshots

<div align="center">
	<table>
		<tr>
			<td align="center"><b>Desktop View</b></td>
			<td align="center"><b>Mobile View</b></td>
		</tr>
		<tr>
			<td>
				<!-- Desktop screenshot example -->
				<img src="frontend/src/assets/image.png" alt="Desktop Screenshot" width="420" style="border-radius:12px;box-shadow:0 2px 12px #0002;" />
				<br/><sub>Landing page, dashboard, or feed on desktop</sub>
			</td>
			<td>
				<!-- Mobile screenshot example -->
				<img src="frontend/src/assets/image01.png" alt="Mobile Screenshot" width="220" style="border-radius:12px;box-shadow:0 2px 12px #0002;" />
				<br/><sub>Mobile view of the same page</sub>
			</td>
		</tr>
	</table>
</div>

> _Replace the image paths above with your actual screenshots for a professional showcase!_

---


## 👤 Author

**Rajat Yadav** — [@Rajat0063](https://github.com/Rajat0063)

---

> _For more details, see the code and comments throughout the project!_

---