# MemberHub

A membership management platform for organizations that need to track members, automate renewal reminders, issue certificates, and store supporting documents - built as a full-stack project with a real production-style backend (queued background jobs, role-based permissions, containerized deployment).

## What it does

MemberHub gives an organization two views into the same data: an **admin portal** for staff managing the membership base, and a **member portal** where individuals can check their own status and pull their own records.

- Track members across configurable tiers, with automatic status transitions (`Active → Expiring → Inactive`) driven by a scheduled job
- Send renewal reminder emails automatically as memberships approach expiry, processed through a background queue rather than blocking the request cycle
- Generate branded PDF certificates on demand, with a choice of styles and an optional signatory line
- Store member documents (waivers, registration forms) in cloud storage, attached to the right member record
- Give admins a reporting view - status breakdown, tier distribution, signup and certificate trends over time
- Let members self-serve: view their own profile, update their contact email, download their own certificate, reset a forgotten password via emailed OTP

## Architecture

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Tailwind CSS | Component-driven UI, fast iteration on the admin/member views |
| Backend | Node.js + Express | Simple, well-understood REST layer |
| Database | PostgreSQL + Prisma | Relational fit for members/tiers/documents/certificates; Prisma keeps schema and queries type-safe |
| Auth | JWT + CASL | Stateless auth; permissions defined declaratively rather than scattered `if` checks across routes |
| Background jobs | node-cron + BullMQ + Redis | Cron handles scheduling ("check for expiring memberships daily"); BullMQ decouples the actual email send so a slow SMTP provider can't stall the request that triggered it, and failed sends retry automatically |
| PDF generation | Puppeteer | Certificates are an HTML/CSS template rendered to PDF, rather than hand-coded coordinate drawing — easier to restyle |
| File storage | Cloudinary | Offloads document/file storage from the app server |
| Testing | Jest + Supertest | RBAC and auth are the highest-risk surface area, so they're the most thoroughly covered |
| Containerization | Docker + docker-compose | Backend and frontend each build and run as isolated containers |

## Project layout

```
memberhub/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── routes/          auth.js, members.js
│   │   ├── middleware/      authMiddleware, attachAbility, requireAbility, uploadMiddleware
│   │   ├── casl/            defineAbility.js — where all permission rules live
│   │   ├── jobs/            reminderCron.js
│   │   ├── queues/          BullMQ queue + worker for reminder emails
│   │   ├── utils/           emailService, certificateTemplate, pdfRenderer
│   │   └── server.js
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           LoginPage, RegisterPage, MemberDetail, Reports, Settings, MemberProfile
│   │   └── components/      Layout, MemberForm, CertificateModal, ConfirmDialog
│   └── Dockerfile
└── docker-compose.yml
```

## Running it locally

You'll need Node 20+, and accounts for: a Postgres database (a free [Neon](https://neon.tech) instance works well), a Redis instance (free tier on [Upstash](https://upstash.com)), Cloudinary (for file storage), and a Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for sending mail.

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in your own values
npx prisma db push
npm run dev
```
Runs on `http://localhost:5000`.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

**Tests**
```bash
cd backend
npm test
```

**Docker** (from the project root, with Docker Desktop running)
```bash
docker compose up --build
```
Frontend on `http://localhost:3000`, backend on `http://localhost:5000`.

## Roles

The first admin account isn't created through the sign-up form — that's intentional, so nobody can self-promote to admin. Register normally, then flip that one account's `role` to `ADMIN` via `npx prisma studio`. Every account after that follows the normal member self-registration flow, and gets linked to its member record automatically by matching email.