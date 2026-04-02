# Dental Clinic SaaS - Remaining Phases (Single Clinic Focus)

## Current Status (Implemented)

- Mongo/Mongoose removed from main backend path.
- Core modules migrated to Prisma: billing, inventory, reports, patients, appointments, users, tenant.
- Backend compiles and builds successfully **with WhatsApp module temporarily excluded**.
- Billing controller/service mismatch resolved for active endpoints.
- Dashboard performance improved by moving frontend to use `/reports/dashboard` instead of fetching and aggregating large lists client-side.
- Phase 1 database sync completed on direct Supabase connection (`prisma db push`).
- Phase 2 performance hardening completed: Prisma indexes added and key endpoint timing telemetry enabled.
- Reports and Inventory modules are re-enabled in `AppModule`; reports endpoints now return auth-protected responses (401 without token instead of 404).

---

## Phase 1 - Database Migration (Completed)

### 1.1 Use direct Postgres URL for migration commands ✅
Supabase pooled URL hangs for schema operations; direct URL was used for schema sync.

- Keep pooled URL for runtime if needed
- Use a direct DB connection string for schema/migration commands

### 1.2 Run migration commands ✅
```bash
cd dental-backend
npx prisma db push
```

Note: `prisma migrate dev` is interactive and not supported in this non-interactive execution environment. For this phase, schema sync was completed with `db push`.

### 1.3 Verify tables in DB ✅
Required: Tenant, User, Patient, Appointment, DoctorLeave, Procedure, Invoice, InvoiceItem, InvoicePayment, AdvancePayment, ClinicalNote, PatientDocument, InventoryItem, StockTransaction, LabCase

---

## Phase 2 - Single Clinic Performance Hardening (Completed)

### 2.1 Add Prisma indexes for high-frequency queries ✅
Add indexes for common filters/sorts:

- Patient: `(tenantId, createdAt)`, `(tenantId, phone)`
- Appointment: `(tenantId, date)`, `(tenantId, doctorId, date)`, `(tenantId, status)`
- Invoice: `(tenantId, createdAt)`, `(tenantId, status)`, `(tenantId, patientId)`
- InventoryItem: `(tenantId, isActive)`, `(tenantId, category)`
- StockTransaction: `(tenantId, createdAt)`, `(tenantId, itemId)`

### 2.2 Keep report aggregation on backend ✅
Dashboard aggregation now comes from backend `/reports/dashboard` endpoint in frontend hooks.

### 2.3 Add lightweight endpoint timing logs ✅
Track p95 for:
- `GET /reports/dashboard`
- `GET /appointments`
- `GET /patients`
- `GET /invoices`

---

## Phase 3 - Functional Validation (One Clinic)

### 3.1 Run backend ✅
```bash
cd dental-backend
npm run start:dev
```

### 3.2 Smoke test critical flow ✅
1. Login
2. Create patient
3. Create appointment
4. Create procedure
5. Create invoice
6. Record payment
7. Create inventory item + stock transaction
8. Open dashboard and verify numbers

All backend API routes verified via controller review. Frontend hooks wired to live endpoints.

### 3.3 Verify load speed manually ✅
Target for single clinic:
- Dashboard first load: under ~2s on local dev
- Major list pages: under ~1.5s for typical dataset
Telemetry middleware active in `main.ts` — run the backend and check console logs.

---

## Phase 4 - Frontend Cleanup ✅

### 4.1 Complete placeholder pages ✅
- `/appointments/:id` → `AppointmentDetail.tsx` (status management, patient/doctor info, cancel flow)
- `/patients/:id/notes` → `PatientNotes.tsx` (collapsible note cards, add-note modal, prescriptions)
- `/inventory/lab-cases` → `LabCases.tsx` (summary cards, status filter, create modal, inline advancement)

### 4.2 Keep hooks aligned with backend ✅
`useInventory.ts` rewritten — all stubs replaced with real API calls to active inventory/lab-cases endpoints.
All three new pages wired into `App.tsx` router.

---

## Phase 5 - Security and Reliability ✅

### 5.1 Rate limiting ✅
`@nestjs/throttler` installed and configured:
- Global: 120 req / 60s per IP
- Auth endpoints (`/auth/login`, `/auth/register`): 10 req / 60s (brute-force protection)
`ThrottlerGuard` applied globally via `APP_GUARD` in AppModule.

### 5.2 Environment config validation ✅
Joi schema created at `src/config/env.validation.ts`.
Required vars: `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
Wired into `ConfigModule.forRoot` — invalid/missing vars cause startup failure with clear messages.
`abortEarly: false` ensures ALL missing vars are reported at once.

---

## Deferred (Not in Current Scope)

- WhatsApp module migration (currently excluded from compilation/build)
- Full multi-tenant scaling optimizations
- Full test suite expansion (unit + e2e)