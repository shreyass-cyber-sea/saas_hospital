# Dental Clinic SaaS - Features List

This document outlines the implemented features of the Dental Clinic SaaS system, reflecting the current state of the application after transitioning to a multi-tenant PostgreSQL/Supabase foundation with Prisma.

## 🏢 Core System & Security
- **Robust Multi-Tenancy**: Data is strictly isolated by `tenantId` across the entire Prisma layer, allowing multiple clinics/organizations to use the same system securely.
- **Role-Based Access Control (RBAC)**: Secure authentication system with support for specific roles (Admin, Doctor, Receptionist).
- **Security Hardening**:
  - Global API rate-limiting via `@nestjs/throttler` (120 req / 60s per IP).
  - Explicit brute-force protection on Auth routes (10 req / 60s).
  - Strict Environment Variable validation via `Joi` causing fast-fails for misconfigured setups.
  - Performance telemetry logging for bottleneck endpoints.
  - Highly optimized Prisma indexes for common relational queries.

## 📊 Dashboard & Reports
- **Real-Time KPI Tracking**: Immediate views of Today's Revenue, New Patients, & Appointments.
- **7-Day Revenue Analytics**: Visual chart rendering revenue growth over the last week.
- **Actionable Alerts**: Highlight modules for missing payments, low stock counts, and pending external lab cases.
- **Advanced Backend Aggregation**: Prisma aggregates (`_sum`, `count`) and raw SQL used to push computation to the database level, preventing memory bottlenecks.

## 👥 Patient Management
- **Comprehensive Patient Profiles**: Detailed records handling demographics, medical history, and contact methods.
- **Clinical Notes**:
  - Rich history tracking of patient encounters via an interactive timeline.
  - Dedicated forms to capture Findings, Diagnosis, Vitals, and ongoing Treatment Plans.
  - Electronic Prescription capabilities built directly into the patient note UI.

## 📅 Appointments
- **Interactive Calendar & Listing**: View day/week/month appointments efficiently.
- **Advanced State Machine**: Complete status workflow mapping the real-world clinic process:
  `SCHEDULED` → `CONFIRMED` → `CHECKED_IN` → `IN_PROGRESS` → `COMPLETED`.
  Includes exception flows for `CANCELLED` and `NO_SHOW`.
- **Appointment Detail Suite**: Granular page to manipulate the appointment lifecycle, link procedures, view attached doctors, and navigate straight to clinical evaluation.

## 💳 Billing & Financials
- **Procedure & Invoice Linking**: Direct linkage between patient treatments and line-item invoices.
- **Payment Tracking**: Granular tracking for `Paid Amount` vs. `Pending Amount`.
- **Patient Balance Monitoring**: Real-time aggregation of pending balances across all a patient's historical invoices.
- *(Backend)* PDF Invoice generation framework (via `pdfkit`).

## 📦 Inventory & Lab Cases
- **Stock Management**: Track supplies with automated categorization and threshold stock limits.
- **Stock Transactions**: Audit trails for every addition or consumption of clinic stock.
- **Low Stock Alerts**: Real-time monitoring of items slipping below the required minimum threshold.
- **External Lab Tracking**: Central tracking for physical/digital impressions sent out to dental labs, including status toggles from `SENT` → `IN_PROGRESS` → `RECEIVED`.

---
*Note: WhatsApp integration and fully automated scheduled reminder jobs are currently deferred features but the foundational API endpoints are pre-structured.*
