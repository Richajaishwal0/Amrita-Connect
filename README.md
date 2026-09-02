# 🎓 Amrita Connect

> **A unified university networking and collaboration platform connecting students, alumni, faculty, and researchers across all 7 Amrita campuses.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Express 5](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-4EA94B?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🎯 Our Aim

**Amrita Vishwa Vidyapeetham** spans 7 vibrant campuses with over 50,000 students, researchers, and global alumni working at top tech firms (Google, Microsoft, Amazon, NVIDIA, Cisco).

However, inter-campus communication and mentorship often remain fragmented across disparate chat groups. **Amrita Connect** unifies the entire institution into a single, social-first academic and professional ecosystem to:
- 🌐 **Bridge Campus Silos**: Connect verified students and faculty across all 7 campuses.
- 💼 **Unlock 1:1 Mentorship**: Enable students to receive resume reviews, mock interviews, and career guidance from placed alumni.
- 🚀 **Form Cross-Campus Teams**: Build interdisciplinary squads for national hackathons (SIH, ICPC) and capstone projects.
- 🔬 **Accelerate Research**: Help professors and research labs recruit student co-investigators and research fellows across disciplines.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **🗺️ University Live Mesh** | Interactive 7-campus map visualization displaying real-time collaboration links, node metrics, and inter-campus activity. |
| **👥 People of Amrita** | A visual social discovery feed with "People Stories" avatar rows, Community Spotlights, trending members, and role/campus filters. |
| **🤝 1:1 Mentorship Hub** | Structured request system connecting students with alumni mentors for career guidance and mock interviews. |
| **🚀 Collaborate & Team Finder** | Project marketplace to post skill requirements, discover hackathon squads, and build ambitious projects together. |
| **💼 Opportunities & Events** | Curated board for research fellowships, internships, technical talks, and hackathons with instant 1-click registration. |
| **📊 Role-Aware Workspaces** | Tailored dashboards customized specifically for **Students**, **Alumni**, **Faculty**, **Researchers**, and **Admins**. |
| **💬 Direct Messaging & Alerts** | In-app communications, connection requests, and instant activity notifications. |

---

## 🏫 7 Campuses Connected

- 🟣 **Amritapuri** — Cybersecurity (bi0s), Wireless IoT, Nanotechnology & Computing
- 🟢 **Bengaluru** — Artificial Intelligence, Data Science & Tech Startups
- 🔵 **Chennai** — Advanced Computing, Emerging Tech & Cyber Physical Systems
- 🟠 **Coimbatore** — Aerospace, Robotics, CPS & Core Engineering
- 🌸 **Kochi** — Precision Medicine, Biotech Genomics & Healthcare AI
- 🟡 **Amaravati** — Interdisciplinary Engineering, Sustainable Tech & AI
- 🟣 **Mysuru & NCR** — Media, Pure Sciences, Commerce & Management Studies

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack React Query v5, Radix UI, Lucide Icons, Wouter.
- **Backend**: Node.js, Express 5, TypeScript, JWT authentication (`jsonwebtoken`), password hashing (`bcryptjs`), Pino logger.
- **Database**: MongoDB Atlas with Mongoose schemas and compound query indexing.
- **Type Safety**: OpenAPI 3.0 specification with Orval-generated query hooks and Zod runtime validation.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Richajaishwal0/Amrita-Connect.git
cd Amrita-Connect
pnpm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the project root:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/amrita_connect?retryWrites=true&w=majority"
SESSION_SECRET="your-secure-jwt-secret-key"
PORT=5000
```

### 3. Run Development Servers
```bash
# Terminal 1 — Start Backend API (http://localhost:5000)
pnpm run dev:backend

# Terminal 2 — Start Frontend (http://localhost:5173)
pnpm run dev:frontend
```

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `pnpm run dev:frontend` | Start Vite frontend dev server (`localhost:5173`) |
| `pnpm run dev:backend` | Start Express backend server (`localhost:5000`) |
| `pnpm run build` | Build frontend & backend for production |
| `pnpm run typecheck` | Run TypeScript check across all packages |

---

## 📄 License

Distributed under the **MIT License**.
