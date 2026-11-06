# KOLA TOURS AND TRAVEL — Complete Website & Travel Management Platform

*"Explore the World. We Make Your Journey Easier."*

A full-stack, production-ready website and travel management platform built for **KOLA TOURS AND TRAVEL**. It provides customers with flight inquiries, hotel reservations, fixed & customized tour packages, visa & passport documentation assistance, airport transfers, and a 10-module Customer Portal—paired with a 10-module Administrative Console.

---

## 1. Architecture & Technology Stack

- **Frontend:** React 19, React Router 7, Tailwind CSS v4, Lucide Icons, Vite 8
- **Backend:** Node.js + Express 5 REST API (`server/index.js`)
- **Database:** Embedded Relational SQLite (`node:sqlite` in WAL mode) with automatic schema migrations, initial catalog seeding, and one-click database snapshot backups (`server/db.js`)
- **Authentication & Security:** JWT + `bcryptjs` password hashing, Role-Based Access Control (`customer` vs. `admin`), `helmet` security headers, `express-rate-limit`, audit logging (`audit_logs` table), and non-public encrypted storage for sensitive customer passport/visa uploads (`data/uploads/`).
- **Email & Notifications:** Configurable SMTP via `nodemailer` (`server/mailer.js`) + persistent in-app notifications (`notifications` table).

---

## 2. Quick Start & Installation Instructions

### Prerequisites
- Node.js v22.5+ (tested on Node v24.20.0) and npm

### Step 1: Configure Environment
Copy `.env.example` to `.env` (already initialized for local development) and update any production secrets:
```bash
cp .env.example .env
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build & Run
- **Development Mode (Hot-Reload Frontend + API Server):**
  ```bash
  npm run dev
  ```
  - Frontend Dev Server: `http://localhost:5173`
  - Backend API Server: `http://localhost:5000`

- **Production Unified Mode (Builds Frontend & Serves Everything on Port 5000):**
  ```bash
  npm run build
  npm start
  ```
  - Unified Application: `http://localhost:5000`
  - XML Sitemap: `http://localhost:5000/sitemap.xml`

- **Run End-to-End Verification Suite:**
  ```bash
  npm test
  ```

---

## 3. Administrator & Demo Customer Credentials

On first startup, `server/db.js` automatically runs migrations and seeds initial accounts (configurable via `.env`):

### Administrator Account
- **Login URL:** `/login` → Redirects to `/admin`
- **Email:** `admin@kolatours.com`
- **Password:** `Admin@KolaTours2026!`

### Sample Customer Account
- **Login URL:** `/login` → Redirects to `/dashboard`
- **Email:** `grace.nakato@example.com`
- **Password:** `Customer@2026!`

---

## 4. Platform Management Guide for Administrators

1. **Configuring the Official WhatsApp Business Number:**
   - Log into `/admin` and open **10. System & WhatsApp Settings**.
   - By default, the WhatsApp number is set to `WHATSAPP_NUMBER_PENDING_CONFIGURATION` so that no fabricated phone number is hardcoded.
   - Once your dedicated business line is ready, enter it in international digits (e.g., `256772123456`) and click **Save All System Settings**. Every WhatsApp button across the homepage, tour packages, hotels, and floating widget will immediately open `https://wa.me/<number>` with contextual pre-populated messages.

2. **Managing the 12-Step Booking Request & Quotation Workflow:**
   - When a customer submits a Flight, Hotel, Fixed Tour, Custom Itinerary, Visa/Passport, or Airport Transfer form, the system assigns a unique reference (`KTT-FLT-...`, `KTT-TUR-...`, `KTT-VSA-...`) with status `Submitted`.
   - In `/admin`, open the relevant module (or **7. All Bookings & Requests**), click **Prepare & Send Quotation**, add itemized line items, and send.
   - The status updates to `Quotation Sent`, and the customer is notified via email and their **Customer Dashboard → Quotations** tab.
   - The customer reviews the printable quotation and clicks **Accept Quotation** (moving the status to `Payment Pending`) or **Decline / Request Changes**.

3. **Verifying Payments & Generating Official Receipts:**
   - Customers can submit payment transaction references (MTN Mobile Money, Airtel Money, Bank Transfer, Visa, Mastercard) from their dashboard. Submitted proofs are marked `Pending Verification`.
   - In `/admin` → **8. Payments & Receipts**, verify the transaction reference and click **Verify & Confirm** (or record a manual payment directly). This issues an official receipt (`RCP-KTT-2026-XXXX`) and marks the booking `Confirmed`.

4. **Managing Sensitive Visa & Passport Documents:**
   - Customer uploads are stored in `./data/uploads` outside public static routes.
   - Only the submitting customer and authenticated administrators can download them via `/api/requests/documents/:docId/download`, and every download is recorded in the Security Audit Log.

