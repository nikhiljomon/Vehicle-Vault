# 🚗 VehicleVault

A full-stack, mobile-responsive web application designed to store all vehicle details, certificates, and compliance documents in one place and proactively alert owners before documents expire.

![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Prisma](https://img.shields.io/badge/Prisma-5.22-teal)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Mobile_First-38bdf8)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

---

## ✨ Features

- **🔐 Authentication & Multi-Tenancy**: Email + password login via NextAuth.js (bcrypt password hashing). Every user strictly accesses only their own vehicles and documents.
- **🚘 Vehicle Management**: Add, edit, and delete vehicles with nickname, registration plate, make, model, year, fuel type, owner name, chassis/VIN, engine number, and photos.
- **📄 Document Tracking**: Track Insurance, PUC (Pollution Certificate), RC, Fitness Certificate, Road Tax, Permits, Driving Licences, and Custom Document types.
- **⚡ Quick "Renew" Action**: Instantly update policies with new dates, premium amounts, and file attachments while preserving the entire renewal history timeline.
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
- **Database & ORM**: PostgreSQL 16 + Prisma ORM (with native PostgreSQL types, enums, and indexes)
- **Authentication**: NextAuth.js with Credentials Provider & JWT sessions
- **Validation**: Server and client Zod validation schemas
- **Email Delivery**: Nodemailer (customizable SMTP via `.env`)
- **Job Scheduling**: Dual support for standalone `node-cron` daemon (`scripts/cron-worker.ts`) and protected cron endpoint (`/api/cron/reminders`)
- **PWA**: Web App Manifest (`manifest.json`) + Service Worker (`sw.js`) + Web Push notifications

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+, v20+, or v24+
- **npm** (or pnpm / yarn)
- **Docker & Docker Compose** (for local PostgreSQL 16 container) OR an existing PostgreSQL 16 database (local or hosted)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repo-url> vehicle
cd vehicle
npm install
```

### 3. Start PostgreSQL Database
You can spin up a local PostgreSQL 16 container with persistent storage using the included `docker-compose.yml`:
```bash
docker compose up -d
```
*(Alternatively, you can use an existing local PostgreSQL instance or a hosted database such as Supabase, Neon, or Railway).*

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` is configured for your PostgreSQL database:

- **Local Docker Compose**:
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vehiclevault?schema=public"
  ```
- **Hosted Supabase** (Transaction pooler on port 6543 for serverless / Vercel):
  ```env
  DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?schema=public&sslmode=require"
  ```
- **Hosted Neon / Railway**:
  ```env
  DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/vehiclevault?sslmode=require"
  ```

### 5. Run Database Migrations
Apply the initial PostgreSQL migrations to create the database schema:
```bash
npx prisma migrate dev
```

### 6. Seed Demo Data
Populate the database with sample vehicles, documents (expired, expiring soon, and valid), and renewal histories:
```bash
npx prisma db seed
# or
npm run seed
```

### 7. Run the Application
Start the Next.js development server:
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 🚢 Production Deployment

When deploying to production environments (e.g., Vercel, Railway, Docker, or AWS):

1. **Set Environment Variables**: In your production environment settings, set `DATABASE_URL` (with `?sslmode=require`), `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
2. **Apply Migrations**:
   ```bash
   npx prisma migrate deploy
   ```
   `prisma migrate deploy` applies all pending migrations safely without dropping data or requiring interactive prompts.
3. **Build the Application**:
   ```bash
   npm run build
   ```
4. **Start the Production Server**:
   ```bash
   npm start
   ```

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

The PostgreSQL schema is defined in `prisma/schema.prisma` with native types and enums:

- **Enums**:
  - `VehicleType`: `CAR`, `BIKE`, `TRUCK`, `SCOOTER`, `OTHER`
  - `FuelType`: `PETROL`, `DIESEL`, `ELECTRIC`, `HYBRID`, `CNG`, `OTHER`
  - `DocumentType`: `INSURANCE`, `PUC`, `RC`, `FITNESS`, `ROAD_TAX`, `PERMIT`, `DRIVING_LICENCE`, `CUSTOM`
  - `ReminderChannel`: `EMAIL`, `IN_APP`, `PUSH`
  - `ReminderStatus`: `SENT`, `FAILED`
- **Native Types**:
  - `Document.issueDate` / `expiryDate`: `@db.Date` (precise calendar date storage)
  - `Document.premium`: `@db.Decimal(10, 2)` (financial precision for policy costs)
  - `Document.notes`, `metadata`, `Notification.message`: `@db.Text` (unbounded text storage)
- **Indexes**:
  - `Document.expiryDate` & `Document.vehicleId`
  - `Vehicle.userId`
  - `ReminderLog.documentId` & compound unique `[documentId, daysBeforeExpiry, channel]`
  - `Notification.userId` & `PushSubscription.userId`
- **Cascade Deletes**:
  - Deleting a user deletes vehicles, notifications, notification settings, and push subscriptions.
  - Deleting a vehicle deletes all associated documents, document histories, and reminder logs.

---

## 📄 License
MIT License. Built for VehicleVault.
