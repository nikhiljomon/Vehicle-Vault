# 🚗 VehicleVault

A full-stack, mobile-responsive web application designed to store all vehicle details, certificates, and compliance documents in one place and proactively alert owners before documents expire.

![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.22-teal)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Mobile_First-38bdf8)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

---

## ✨ Features

- **🔐 Authentication & Multi-Tenancy**: Email + password login via NextAuth.js (bcrypt password hashing). Every user strictly accesses only their own vehicles and documents.
- **🚘 Vehicle Management**: Add, edit, and delete vehicles with nickname, registration plate, make, model, year, fuel type, owner name, chassis/VIN, engine number, and photos.
- **📄 Document Tracking**: Track Insurance, PUC (Pollution Certificate), RC, Fitness Certificate, Road Tax, Permits, Driving Licences, and Custom Document types.
- **⚡ Quick "Renew" Action**: Instantly update policies with new dates and file attachments while preserving the entire renewal history timeline.
- **⏰ Proactive Reminder Engine**: 
  - Automated alerts delivered via **Email** (Nodemailer), **In-App Notification Bell** (with unread counters), and **Browser/PWA Push Notifications**.
  - Configurable reminder windows per user (default: 30, 15, 7, 1 days before expiry, and on the expiry day).
  - Deduplication log (`ReminderLog`) ensures reminders are sent only once per policy cycle.
- **📊 Interactive Dashboard**:
  - Metric summary cards (Total Vehicles, Expired, Due in 30 Days, All Valid).
  - Chronological upcoming expiries list with color badges (🟢 Valid, 🟡 Expiring Soon, 🔴 Expired).
- **🔍 Search & Filter**: Instant filtering by vehicle, document type, and compliance status.
- **📥 Data Export**: Export vehicle portfolios as CSV spreadsheets or printable A4 compliance dossiers / PDF.
- **📱 PWA & Mobile-First UX**: Responsive from 320px screens up to desktop, bottom navigation bar on mobile, desktop sidebar, and dark/light mode toggle.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons + `next-themes` (Dark/Light mode)
- **Database & ORM**: Prisma ORM with SQLite for zero-config local development (`dev.db`)
- **Authentication**: NextAuth.js with Credentials Provider & JWT sessions
- **Validation**: Server and client Zod validation schemas
- **Email Delivery**: Nodemailer (customizable SMTP via `.env`)
- **Job Scheduling**: Dual support for standalone `node-cron` daemon (`scripts/cron-worker.ts`) and protected cron endpoint (`/api/cron/reminders`)
- **PWA**: Web App Manifest (`manifest.json`) + Service Worker (`sw.js`) + Web Push notifications

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v20+ or v24+
- **npm** (or pnpm / yarn)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repo-url> vehicle
cd vehicle
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration for local development:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="vehiclevault-local-dev-secret-key-32chars"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="vehiclevault-cron-secret-token"

# Optional SMTP settings for live email sending:
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="VehicleVault <no-reply@vehiclevault.local>"
```
*(If SMTP is not configured, email reminders are safely simulated and logged to the console without crashing).*

### 4. Database Setup & Seed
Push the database schema and populate with rich test data (includes valid, expiring-soon, and expired documents):
```bash
npx prisma db push
npm run seed
```

### 5. Run the Application
Start the Next.js development server:
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 🔑 Demo Account Credentials

A sample user is pre-seeded with 3 vehicles (Honda City, Royal Enfield Hunter 350, Tata Nexon EV) and 9 documents:

- **Email**: `demo@vehiclevault.com`
- **Password**: `Password123!`

*(You can also click the **"Auto-fill"** button on the `/login` screen to test immediately).*

---

## ⏰ How to Test the Reminder System

VehicleVault provides 3 ways to run and test reminder checks:

### Method 1: On-Demand via Settings Page (Easiest)
1. Log in to the application.
2. Go to **Settings** (`/settings`) from the navigation menu.
3. Scroll to **"Manual Reminder Job Testing"** and click **"Execute Reminder Check Now"**.
4. You will see an immediate JSON summary of scanned users, evaluated documents, and triggered email/in-app notifications.

### Method 2: Via Protected HTTP API Endpoint
Trigger the cron API endpoint using `curl` with your `CRON_SECRET`:
```bash
curl -X POST http://localhost:3000/api/cron/reminders \
  -H "Authorization: Bearer vehiclevault-cron-secret-token"
```

### Method 3: Standalone Background Worker (`node-cron`)
Run the standalone cron worker script in immediate check mode (`--now`):
```bash
npx tsx scripts/cron-worker.ts --now
```
To run it as a 24/7 background worker (scheduled daily at 8:00 AM):
```bash
npm run cron
```

---

## 🗄️ Database Architecture

The SQLite database schema is defined in `prisma/schema.prisma`:

- `User`: Accounts and authentication.
- `Vehicle`: Nickname, plate, type, make, model, year, fuel type, chassis/engine numbers, owner.
- `Document`: Type, document number, issue date, expiry date, notes, file attachment, metadata.
- `DocumentHistory`: Immutable timeline audit trail generated upon document renewals.
- `NotificationSetting`: User-specific alert thresholds (e.g. `30, 15, 7, 1, 0`) and enabled channels.
- `ReminderLog`: Deduplication tracking preventing repeated alerts for the same window.
- `Notification`: In-app notification records for the bell dropdown.
- `PushSubscription`: Browser push subscription endpoints and VAPID keys.

### Switching to PostgreSQL for Production
To migrate from SQLite to PostgreSQL (e.g., Supabase, Neon, Railway):
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `.env` to your Postgres connection string.
3. Run `npx prisma db push` (or `npx prisma migrate dev`).

---

## 📦 Production Build Verification

To create an optimized production build:
```bash
npm run build
npm start
```

---

## 📄 License
MIT License. Built for VehicleVault.
