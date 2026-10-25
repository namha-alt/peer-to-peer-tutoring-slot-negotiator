# 📚 SlotSync — Peer-to-Peer Tutoring Slot Negotiator

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Postman](https://img.shields.io/badge/Postman-REST%20API-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](https://www.postman.com/)

An educational full-stack scheduling and slot-negotiation platform that connects peer tutors and students. It eliminates scheduling friction, prevents double-booking, enforces fairness limits, allows students to attach study topics and reference PDFs, and gives tutors full approval control over incoming requests.

---

## 🎯 Key Features

### 👨‍🎓 For Students
- **Interactive Calendar:** Real-time visual schedule grid for browsing available slots across all tutors.
- **Tutor & Subject Filtering:** Search and filter tutors by specific subjects (Math, Data Structures, Physics, etc.).
- **Detailed Slot Requests:** When requesting a slot, students specify the **Topic to Study**, add **Specific Notes**, and attach **Reference PDFs or assignment files**.
- **Fairness Protection:** Automated quota limits (max active requests) to prevent slot-hoarding.
- **Overlap Prevention:** Prevents double-booking overlapping time slots on the same day.
- **Status Tracking:** Real-time visibility into booking statuses (`Pending Approval`, `Confirmed`, `Declined`).

### 👨‍🏫 For Tutors
- **1-Click Availability:** Simply click any calendar block to mark it open or remove it.
- **Past Date Lock:** Automatically prevents creating or displaying slots for dates in the past.
- **Custom Capacity:** Set group capacity per slot (1 to 10 students).
- **Request Negotiation & Review:** Incoming student requests appear under **Pending Requests** with topic notes and downloadable PDF attachments.
- **Accept / Decline Control:** Bookings are never automatically confirmed — tutors explicitly approve or reject each request.

---

## 📂 Project Repository Structure

```text
slotsync/
├── frontend/                        # Client-Side Application (HTML5, Vanilla CSS, JS)
│   ├── css/
│   │   └── style.css                # Design system, themes, calendar grid & modal styling
│   ├── js/
│   │   ├── auth.js                  # Authentication logic & session controller
│   │   ├── data.js                  # Client datastore (localStorage for Phase 1 / CA-1)
│   │   ├── student.js               # Student calendar, booking modal & status tracker
│   │   ├── tutor.js                 # Tutor availability scheduler & request review
│   │   └── toast.js                 # Toast notification system
│   ├── index.html                   # Landing page
│   ├── login.html                   # Login & registration portal
│   ├── student.html                 # Student dashboard interface
│   └── tutor.html                   # Tutor dashboard interface
│
├── backend/                         # REST API Server (Node.js, Express, MongoDB)
│   ├── config/
│   │   └── db.js                    # Mongoose database connection
│   ├── controllers/
│   │   ├── authController.js        # User register, login & profile logic
│   │   ├── slotController.js        # Slot queries, availability toggling, deletion
│   │   ├── bookingController.js     # Booking creation, approval, rejection, cancel
│   │   ├── userController.js        # Tutor discovery, capacity update, stats
│   │   └── systemController.js      # Server health check & DB status
│   ├── middleware/
│   │   ├── auth.js                  # JWT token verification & role protection
│   │   └── errorHandler.js          # Centralized error handler
│   ├── model/
│   │   ├── User.js                  # User schema with bcrypt password hashing
│   │   ├── Slot.js                  # Availability slot schema
│   │   └── Booking.js               # Booking negotiation lifecycle schema
│   ├── routes/                      # Modular Express Routers
│   │   ├── auth.routes.js           # /api/auth routes
│   │   ├── slots.routes.js          # /api/slots routes
│   │   ├── bookings.routes.js       # /api/bookings routes
│   │   └── users.routes.js          # /api/users routes
│   ├── .env                         # Environment variables (port, mongo URI, jwt secret)
│   ├── .env.example                 # Example configuration template
│   ├── index.js                     # Express server entry point
│   └── package.json                 # Backend dependencies & scripts
│
├── .gitignore                       # Git exclusion rules
└── README.md                        # Project documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | HTML5 Semantic Markup, Vanilla CSS3 (Custom Design System, Flexbox, Grid), JavaScript (ES6+) |
| **Frontend Storage** | Browser `localStorage` (Phase 1 / CA-1 offline-first storage) |
| **Backend Runtime** | Node.js (>= 18.0.0) |
| **Backend Framework** | Express.js 4.x with Modular Routers (`express.Router()`) |
| **Database** | MongoDB with Mongoose 8.x ODM |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS (`cors`), Environment Config (`dotenv`) |
| **API Testing** | Postman Desktop App |

---

## 📡 REST API Reference

Base URL: `http://localhost:5000`

### 1. System Health
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/system/health` | Public | Check server uptime and MongoDB connection state |

### 2. Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`student` or `tutor`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT Bearer token |
| `GET` | `/api/auth/me` | Private | Get profile details of currently authenticated user |

### 3. Slots Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/slots/available` | Public | View all available tutoring slots |
| `GET` | `/api/slots/my` | Private (Tutor) | Get slots created by the logged-in tutor |
| `POST` | `/api/slots/toggle` | Private (Tutor) | Toggle slot availability (locked for past dates) |
| `DELETE` | `/api/slots/:id` | Private (Tutor) | Cancel and remove an availability slot |

### 4. Bookings & Negotiation
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Private (Student) | Request slot with topic, specifics, and attachment |
| `GET` | `/api/bookings/my` | Private | View user's requested / assigned sessions |
| `PATCH` | `/api/bookings/:id/status` | Private (Tutor) | Accept (`confirmed`) or decline (`rejected`) request |
| `POST` | `/api/bookings/:id/cancel` | Private | Cancel active booking |

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port `27017`
- [Postman](https://www.postman.com/downloads/) (for API testing)

### 1. Clone Repository
```bash
git clone https://github.com/namha-alt/peer-to-peer-tutoring-slot-negotiator.git
cd peer-to-peer-tutoring-slot-negotiator
```

### 2. Configure Environment
In `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/slotsync_db
JWT_SECRET=slotsync_super_secret_jwt_key_2026
NODE_ENV=development
```

### 3. Install & Start Backend
```bash
cd backend
npm install
npm run dev
```
> Server will start at **`http://localhost:5000`** and automatically connect to MongoDB `slotsync_db`.

### 4. Open Application in Browser
Open **`http://localhost:5000`** in your browser to interact with the full web app!

---

## 🌿 Git Branching Strategy

This repository utilizes a clean, feature-driven branching structure:

| Branch | Description |
| :--- | :--- |
| `main` | Production-ready full-stack application with all features integrated. |
| `feature/ca1-frontend-vanilla` | Standalone Vanilla HTML/CSS/JS frontend with `localStorage` (Phase 1 / CA-1). |
| `feature/ca2-backend-api` | Modular Express REST API with MongoDB, Mongoose, and Postman tests (Phase 2 / CA-2). |
| `feature/booking-negotiation-flow` | Topic selection, PDF attachment, and tutor accept/decline approval system. |
| `sukh-1705/frontend-ui` | Frontend UI components, student dashboard, and responsive styling (`@Sukh-1705`). |
| `rudar-teach/slot-negotiation` | Tutor calendar grid, slot availability, and negotiation routes (`@Rudar-teach`). |
| `namha-alt/auth-integration` | System architecture, authentication guards, and full-stack integration (`@namha-alt`). |

---

## 👥 Team & Work Distribution

| Contributor | GitHub | Role | Key Contributions |
| :--- | :--- | :--- | :--- |
| **Namha** | [@namha-alt](https://github.com/namha-alt) | Lead & Full-Stack Architect | Workspace setup, Auth module (login/register), LocalStorage security, JWT guards, Mongoose DB connection, Auth routes & controllers. |
| **Sukdev Bansal** | [@Sukh-1705](https://github.com/Sukh-1705) | Frontend Engineer & UI/UX | Design system tokens, landing page, student dashboard, tutor search & subject filter, booking request modal, UI polish & README. |
| **Rudar** | [@Rudar-teach](https://github.com/Rudar-teach) | Backend & Features Engineer | Tutor dashboard & calendar grid, slot persistence & capacity counters, Slot & Booking models, slot controller, booking negotiation API. |

---

## 📄 License
ISC License — Created for educational demonstration and evaluation.