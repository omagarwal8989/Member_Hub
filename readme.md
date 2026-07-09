# MemberHub

A full-stack web application for managing organization memberships, automating renewal reminders, generating certificates, and storing member documents.

## Features

- **Membership Management** — add, edit, delete members; assign membership tiers; search and filter by status
- **Role-Based Access Control** — Admin and Member portals, permissions enforced via [CASL](https://casl.js.org/)
- **Renewal Reminders** — automated daily scan for expiring memberships, emails queued via BullMQ + Redis and sent through Nodemailer
- **Certificate Generation** — customizable PDF certificates (style, achievement text, signatory) rendered with Puppeteer from an HTML/CSS template
- **Document Storage** — upload and manage member documents (waivers, registration forms) via Cloudinary
- **Reports & Analytics** — membership status breakdown, tier distribution, signup/certificate trends over time
- **Forgot Password** — OTP-based password reset via email, works for both Admin and Member accounts
- **Activity Log & Notifications** — tracks member additions/removals and certificate issuance
- **Automated Tests** — Jest + Supertest covering RBAC, auth, and core member operations
- **Containerized** — Dockerfiles + docker-compose for both frontend and backend

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (via [Neon](https://neon.tech)), Prisma ORM |
| Auth | JWT, bcrypt, CASL (permissions) |
| Email | Nodemailer, BullMQ + Redis (via [Upstash](https://upstash.com)) for queued delivery |
| PDF Generation | Puppeteer |
| File Storage | Cloudinary |
| Testing | Jest, Supertest, jest-mock-extended |
| Containerization | Docker, Docker Compose |

## Project Structure

```
Membur_hub/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── routes/        # auth.js, members.js
│   │   ├── middleware/     # authMiddleware, attachAbility, requireAbility, uploadMiddleware
│   │   ├── casl/           # defineAbility.js — permission rules
│   │   ├── jobs/           # reminderCron.js
│   │   ├── queues/         # BullMQ queue + worker for reminder emails
│   │   ├── utils/          # emailService, certificateTemplate, pdfRenderer
│   │   └── server.js
│   ├── tests/               # Jest + Supertest suite
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # LoginPage, RegisterPage, MemberDetail, Reports, Settings, MemberProfile...
│   │   ├── components/      # Layout, MemberForm, CertificateModal, ConfirmDialog...
│   │   └── Dashboard.jsx
│   └── Dockerfile
└── docker-compose.yml
```

## Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) instance)
- A Redis instance (e.g. a free [Upstash](https://upstash.com) instance)
- A Cloudinary account (free tier) for document/certificate file storage
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for sending emails

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` (see `.env.example` for the full list of required variables), then:

```bash
npx prisma db push
npm run dev
```

Backend runs on `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (Vite default).

### Running Tests

```bash
cd backend
npm test
```

### Running with Docker

From the project root, with Docker Desktop running:

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Roles

- **Admin** — full access: manage members, tiers, certificates, reports, settings
- **Member** — self-service: view own profile, update own email, download own certificate, upload own documents

The first admin account must be created manually (register normally, then promote the account's `role` to `ADMIN` via Prisma Studio: `npx prisma studio`).