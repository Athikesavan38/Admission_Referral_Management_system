# 🎓 Admission Referral Portal

A **full-stack web application** for managing student admission referrals with role-based access control, real-time notifications, AI-powered insights, and a gamified credit system.

Faculty, alumni, students, and external consultants can refer prospective students, track referral status in real time, and earn credits on the leaderboard — while administrators review, approve/reject referrals, export reports, and monitor analytics.

---

## ✨ Features

- 🔐 **Role-Based Authentication** — Separate login flows for Admins and Referrers with JWT
- 📋 **Referral Submission** — Multi-step form with Aadhaar validation, drag-and-drop file uploads, and speech-to-text
- 📊 **Admin Dashboard** — View all referrals, approve/reject with remarks, export CSV reports
- 🏠 **Referrer Dashboard** — Personal stats, recent referrals, and AI-powered recommendations
- ⚡ **Real-Time Notifications** — Live SSE push for new referrals and status changes, plus email and SMS alerts
- 🤖 **AI Chatbot** — Role-aware assistant with context-specific help for admins and referrers
- 🔎 **Smart Search** — Autocomplete suggestions by student name, course, and institution
- 📈 **AI Analytics** — Approval rates, monthly trends, course distribution charts, and generated insights
- ⭐ **Credit System** — 20 points for first approval, 10 for each subsequent — drives the leaderboard
- 🏆 **Leaderboard** — Ranked by credits with year filtering and top performer highlights
- 🌙 **Dark Mode** — Toggle light/dark themes with persistent preference
- 🎨 **Glassmorphism UI** — Modern design with glassmorphic cards, gradients, glow effects, and micro-animations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · Vite 5 · Tailwind CSS 3 · Recharts |
| **Backend** | Node.js · Express 4 · Mongoose 8 |
| **Database** | MongoDB (Atlas or local) |
| **Auth** | JWT · bcryptjs |
| **Real-Time** | Server-Sent Events (SSE) |
| **Notifications** | Nodemailer (Gmail) · Vonage · Fast2SMS |
| **File Upload** | Multer |
| **Security** | Helmet · CORS · express-rate-limit · express-validator |
| **Testing** | Jest · Supertest · Vitest · fast-check |

---

## 📁 Project Structure

```
admission-portal/
├── backend/
│   ├── src/
│   │   ├── config/db.js                 # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js       # Register, login, admin login
│   │   │   └── referral.controller.js   # CRUD, CSV export, leaderboard
│   │   ├── middleware/
│   │   │   ├── auth.js                  # JWT verification
│   │   │   ├── rbac.js                  # Role-based access control
│   │   │   ├── errorHandler.js          # Centralized error handling
│   │   │   └── upload.js               # Multer file upload config
│   │   ├── models/
│   │   │   ├── User.js                  # User schema + auto-increment referral IDs
│   │   │   └── Referral.js             # Referral schema + audit trail
│   │   ├── routes/
│   │   │   ├── auth.routes.js           # /api/auth/*
│   │   │   ├── referral.routes.js       # /api/referrals/*
│   │   │   ├── sse.routes.js            # /api/events (SSE stream)
│   │   │   └── ai.routes.js             # /api/ai/* (chatbot, search, analytics)
│   │   ├── services/
│   │   │   ├── auth.service.js          # Auth business logic
│   │   │   └── referral.service.js      # Referral logic + credit system
│   │   ├── validators/
│   │   │   ├── auth.validator.js        # Registration & login rules
│   │   │   └── referral.validator.js    # Referral submission rules
│   │   ├── utils/
│   │   │   ├── aadhaarValidator.js      # Verhoeff checksum validation
│   │   │   ├── chatbot.js              # Rule-based NLP chatbot engine
│   │   │   ├── csvExport.js            # CSV generation
│   │   │   ├── emailService.js         # Email templates & sender
│   │   │   ├── seedAdmins.js           # Auto-seed admin accounts from env
│   │   │   ├── smsService.js           # Vonage / Fast2SMS integration
│   │   │   └── sseManager.js           # SSE client manager & broadcaster
│   │   ├── app.js                       # Express app setup
│   │   └── server.js                    # Entry point
│   └── uploads/                         # Uploaded photos & documents
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js               # Axios instance with JWT interceptors
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Auth state + SSE connection
│   │   │   ├── ThemeContext.jsx         # Dark mode toggle
│   │   │   └── NotificationContext.jsx  # Notification state manager
│   │   ├── components/                  # 15 reusable components
│   │   │   ├── AIChatbot.jsx            # Floating AI chatbot widget
│   │   │   ├── DragDropUpload.jsx       # Drag & drop file upload
│   │   │   ├── NotificationBar.jsx      # Toast notifications
│   │   │   ├── Sidebar.jsx              # Navigation sidebar
│   │   │   ├── SmartSearch.jsx          # Autocomplete search
│   │   │   ├── SpeechInput.jsx          # Voice-to-text input
│   │   │   └── shared/                  # Pagination, StatusBadge, Skeleton
│   │   ├── hooks/                       # useDebounce, useRipple, useScrollReveal
│   │   ├── pages/
│   │   │   ├── Login.jsx                # Dual-tab login (Admin / User)
│   │   │   ├── Register.jsx             # User registration
│   │   │   ├── SubmitReferral.jsx       # Multi-section referral form
│   │   │   ├── ReferralStatus.jsx       # Referral list with filters
│   │   │   ├── Leaderboard.jsx          # Credit rankings
│   │   │   └── dashboard/
│   │   │       ├── AdminDashboard.jsx   # Admin overview & management
│   │   │       └── ReferrerDashboard.jsx
│   │   ├── App.jsx                      # Root router with lazy loading
│   │   └── index.css                    # Global styles & design system
│   ├── vite.config.js                   # Build config, proxy, chunk splitting
│   └── tailwind.config.js               # Custom theme & animations
│
└── README.md
```

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `admin` | Full access — view all referrals, approve/reject, export CSV, analytics |
| `student_referrer` | Submit referrals, view own referrals, earn credits |
| `faculty` | Submit referrals, view own referrals, earn credits |
| `alumni` | Submit referrals, view own referrals, earn credits |
| `external_consultant` | Submit referrals, view own referrals, earn credits |

Admin accounts are seeded from the `SEED_ADMINS` environment variable on server startup. Self-registration as admin is blocked at both the validator and service layers.

---

## ⭐ Credit System

| Event | Credits |
|-------|---------|
| First referral approved | **+20** 🏆 |
| Each subsequent approval | **+10** ⭐ |
| Approval reversed to rejection | Credits deducted |

Credits are awarded **only on admin approval**, not on submission.

---

## 🔒 Security Highlights

- Passwords hashed with **bcrypt (12 salt rounds)**
- **Rate limiting** on auth (15 req/15min) and API routes (100 req/15min)
- **Helmet** HTTP security headers
- **Input validation** with express-validator on all mutation endpoints
- **RegExp escaping** to prevent ReDoS attacks on search inputs
- **File upload guards** — type whitelist, 5MB limit, randomized filenames
- Admin registration **blocked** at validator level

---

<p align="center">
  Built with ❤️ for <strong>CIET Admissions</strong>
</p>
