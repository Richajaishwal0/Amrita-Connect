# 🎓 Amrita Connect

> **A unified, role-aware university networking and collaboration ecosystem connecting students, alumni, faculty, researchers, and campus administrators across all Amrita campuses.**

---

## 🌟 Our Aim & Mission

**Amrita Vishwa Vidyapeetham** spans multiple vibrant campuses—including Amaravati, Amritapuri, Bengaluru, Chennai, Coimbatore, Kochi, Mysuru, and NCR. Across these institutions are thousands of ambitious students, accomplished alumni in top tech companies, esteemed faculty researchers, and innovative problem solvers. 

However, cross-campus collaboration and alumni mentorship often remain fragmented across disparate messaging channels and social networks.

**Amrita Connect solves this by creating a single, cohesive academic and professional hub.** 
Our goal is to break campus silos and empower the entire Amrita community to:
- 🤝 **Connect with Verified Members**: Discover peers, seniors, professors, and industry leaders with verified Amrita credentials.
- 🎯 **Unlock 1:1 Mentorship**: Enable students to seek targeted guidance from alumni working at Microsoft, Google, Amazon, and leading research institutes.
- 🚀 **Build Cross-Campus Teams**: Form cross-disciplinary squads for national hackathons, capstone projects, and student startups.
- 🔬 **Democratize Research & Opportunities**: Allow faculty to recruit student fellows and share research calls, internships, and workshops directly with eligible candidates.

---

## 👥 Role-Aware Experience

Amrita Connect adapts its interface and workflows based on each user's unique role:

| Persona | Key Capabilities & Benefits |
|---|---|
| **🎓 Students** | • Discover hackathon teammates and project partners.<br>• Request 1:1 mentorship from verified alumni.<br>• Explore internships, fellowships, and upcoming campus events. |
| **💼 Alumni** | • Give back by mentoring students in mock interviews and resume reviews.<br>• Post job openings, internships, and industry referrals.<br>• Stay connected to university initiatives and research breakthroughs. |
| **🔬 Faculty & Researchers** | • Publish research fellowship openings and lab calls.<br>• Identify passionate student builders and research assistants across campuses.<br>• Collaborate with industry alumni on sponsored research. |
| **🛡️ Campus Admins** | • Moderate platform content and manage member verifications.<br>• Track cross-campus engagement metrics and activity trends. |

---

## ✨ Core Features

1. **Role-Aware Dashboards**: Customized landing experiences displaying relevant updates, quick actions, pending mentorship requests, and recommended peers.
2. **Directory & Smart Search**: Find members with multi-parameter filtering by campus, department, role, technical skills, and mutual interests.
3. **1:1 Mentorship System**: Structured request workflow where mentees specify topics and goals, and mentors can accept or decline with automated notifications.
4. **Project Collaboration Hub**: Post team requirements (skills needed, squad size, deadline) and apply to open collaborative projects.
5. **Campus Opportunities Board**: Curated feed of research fellowships, hackathons, and internships with one-click saving/bookmarking.
6. **Campus Events & Workshops**: Discover upcoming technical talks, webinars, and builder meetups with instant seat registration.
7. **Real-Time Notifications**: Instant updates on mentorship statuses, team invites, and platform announcements.

---

## 🏗️ Architecture & Tech Stack

Amrita Connect is structured as a modern full-stack monorepo designed for high performance, stateless horizontal scaling, and security:

```text
Amrita-Connect/
├── frontend/                # React 19 web application
│   ├── src/
│   │   ├── components/      # Accessible UI components (Radix UI, Tailwind CSS v4)
│   │   ├── hooks/           # Responsive hooks & toast notification managers
│   │   ├── lib/             # Utility helpers
│   │   ├── pages/           # Application views & dynamic routing
│   │   ├── App.tsx          # Main application shell & session state
│   │   └── main.tsx         # React DOM entry point
│   ├── vite.config.ts       # Vite config with automated /api proxying
│   └── package.json
│
├── backend/                 # Express 5 REST API Server
│   ├── src/
│   │   ├── middleware/      # JWT authentication & role authorization
│   │   ├── routes/          # REST route handlers (/auth, /users, /events, /opportunities)
│   │   ├── services/        # Automated MongoDB seeding on first startup
│   │   ├── lib/             # Structured Pino logger
│   │   ├── app.ts           # Express application setup & CORS configuration
│   │   └── index.ts         # Server startup & MongoDB connection lifecycle
│   ├── build.mjs            # Production esbuild bundling script
│   └── package.json
│
├── database/                # MongoDB Atlas / Mongoose schema models
│   ├── src/
│   │   ├── models/          # Mongoose models (User, Opportunity, Event, Mentorship, etc.)
│   │   └── index.ts         # MongoDB connection manager & model exports
│   └── package.json
│
├── lib/                     # Shared type contracts
│   ├── api-client-react/    # TanStack React Query hooks & fetch client
│   ├── api-spec/            # OpenAPI 3.0 specification & Orval codegen
│   └── api-zod/             # Zod validation schemas
│
├── package.json             # Root monorepo workspace scripts
├── pnpm-workspace.yaml      # Monorepo packages config
└── tsconfig.json            # Root TypeScript project references
```

### Technology Highlights
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Radix UI, TanStack React Query v5, Lucide React, Wouter.
* **Backend**: Express 5, TypeScript, JWT (`jsonwebtoken`), Bcrypt password hashing (`bcryptjs`), Pino logger.
* **Database**: MongoDB Cloud Atlas with Mongoose schemas, compound indexes, and connection pooling.
* **API Contracts**: OpenAPI 3.0 specification with automated Orval type and hook generation.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20 or v24+
- **pnpm**: v9+ (or npm / yarn)
- **MongoDB Atlas** database connection string (or local MongoDB)

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/Amrita-Connect.git
cd Amrita-Connect
pnpm install
```

---

### 2. Configure Environment Variables

Copy the template file `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and configure your credentials:

```env
# MongoDB Cloud Atlas Connection URI
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/amrita_connect?retryWrites=true&w=majority"

# JWT Authentication Secret (Generate any secure random string)
SESSION_SECRET="amrita-connect-super-secret-key-2026"

# Backend API Port
PORT=5000
```

---

### 3. Run Development Servers

Run the backend and frontend in separate terminal windows:

#### Terminal 1 — Start Backend API:
```bash
pnpm run dev:backend
```
> The server connects to MongoDB Atlas, automatically provisions indexes, seeds initial demo accounts on first launch, and listens on `http://localhost:5000`.

#### Terminal 2 — Start Frontend Application:
```bash
pnpm run dev:frontend
```
> Opens the Vite dev server at `http://localhost:5173` with automatic API proxying to the backend.

---

## 💻 Available Scripts

| Command | Description |
|---|---|
| `pnpm run dev:frontend` | Launch Vite frontend dev server at `http://localhost:5173` |
| `pnpm run dev:backend` | Build & launch Express API server at `http://localhost:5000` |
| `pnpm run build` | Create production builds for all packages |
| `pnpm run build:frontend` | Build frontend SPA bundle into `frontend/dist/` |
| `pnpm run build:backend` | Bundle backend with esbuild into `backend/dist/` |
| `pnpm run typecheck` | Run TypeScript verification across the entire monorepo |

---

## 🔒 Security & Privacy

- **Cryptographic Password Hashing**: Passwords are never stored in plaintext and are hashed using `bcryptjs` with 12 salt rounds.
- **Stateless Session Tokens**: Authenticated via signed JSON Web Tokens (JWT) with automatic expiration and active account verification on protected routes.
- **Protected Secrets**: Sensitive keys, credentials, and environment files are strictly excluded from version control via `.gitignore`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
