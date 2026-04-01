🤖 PERSON 3 — AI PROMPT
You are extending an existing NestJS backend for a multi-tenant Dental Clinic SaaS.
You are working in the `dental-backend` repository on branch `feat/person3-business`.

⚠️ IMPORTANT CONTEXT — READ BEFORE WRITING ANY CODE:
This backend is built by 4 developers. Module ownership:
- Person 1 (already merged): auth/ tenant/ users/ common/ — DO NOT TOUCH
- Person 2 (parallel branch): appointments/ patients/ storage/ — you'll integrate at merge
- YOU are building: billing/ inventory/ reports/
- Person 4 (parallel): whatsapp/ ai/ + frontend

YOUR STRICT RULES:
1. Do NOT modify any file outside of: src/modules/billing/, 
   src/modules/inventory/, src/modules/reports/
2. You will need Patient and Appointment data. Since Person 2's modules 
   are on a separate branch, stub the interfaces you need:
   - Create: src/modules/billing/interfaces/patient-ref.interface.ts
   - Create: src/modules/billing/interfaces/appointment-ref.interface.ts
   - At merge time, replace stubs with real imports from Person 2's modules
   - Add a comment: "// TODO: Replace stub with import from PatientsService after merge"
3. Add your modules to app.module.ts with comment: "// Person 3 modules"
4. Export BillingService (Person 4's frontend needs invoice data)

=== PACKAGES TO INSTALL ===
npm install pdfkit dayjs
npm install -D @types/pdfkit

=== YOUR MODULES ===
1. BillingModule
2. InventoryModule
3. ReportsModule

=== BILLING MODULE ===
Location: src/modules/billing/

--- Schemas ---

Procedure Schema (collection: procedures):
Master list of dental procedures per clinic.
- _id
- tenantId: ObjectId (required, indexed)
- name: string (required) — "Root Canal Treatment", "Scaling & Polishing"
- code: string — "RCT-001" (clinic-defined code)
- category: enum:
    'RESTORATIVE' | 'PREVENTIVE' | 'ORTHODONTIC' | 
    'SURGICAL' | 'PROSTHETIC' | 'ENDODONTIC' | 'PEDIATRIC' | 'OTHER'
- defaultPrice: number (required, in rupees, 2 decimal)
- defaultDuration: number (minutes)
- taxable: boolean default true
- defaultTaxPercent: number default 18 (GST %)
- isActive: boolean default true
- createdAt, updatedAt

Indexes: { tenantId: 1, isActive: 1 }, { tenantId: 1, code: 1 }

Invoice Schema (collection: invoices):
- _id
- tenantId: ObjectId (required, indexed)
- invoiceNumber: string (unique per tenant) — "LDC-INV-2024-0001"
- patientId: ObjectId ref Patient (required)
- patientSnapshot: {           # denormalized patient data at invoice time
    name: string,
    phone: string,
    patientId: string,
    email: string
  }
- appointmentId: ObjectId ref Appointment (optional)
- doctorId: ObjectId ref User (required)
- doctorSnapshot: { name: string }
- lineItems: [{
    procedureId: ObjectId ref Procedure (optional),
    description: string (required),
    quantity: number default 1,
    unitPrice: number (required),
    discountAmount: number default 0,
    discountPercent: number default 0,
    taxPercent: number default 18,
    taxAmount: number,      # calculated server-side
    lineTotal: number       # calculated server-side
  }]
- subtotal: number          # sum of (unitPrice * quantity) before discounts
- totalDiscount: number     # sum of all discounts
- totalTax: number          # sum of all tax amounts
- grandTotal: number        # subtotal - totalDiscount + totalTax
- paidAmount: number default 0
- pendingAmount: number     # grandTotal - paidAmount - advanceUsed
- advanceUsed: number default 0
- status: enum:
    'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED'
  default: 'DRAFT'
- payments: [{
    amount: number,
    mode: enum ['CASH','CARD','UPI','BANK_TRANSFER','CHEQUE','OTHER'],
    reference: string,
    paidAt: Date,
    recordedBy: ObjectId ref User
  }]
- refund: {
    amount: number,
    reason: string,
    refundedAt: Date,
    refundedBy: ObjectId ref User,
    mode: string
  }
- cancelledReason: string
- cancelledAt: Date
- notes: string
- pdfUrl: string            # GCS URL after PDF generation
- pdfFilePath: string       # GCS path for signed URL
- dueDate: Date
- createdBy: ObjectId ref User
- createdAt, updatedAt

Indexes:
{ tenantId: 1, invoiceNumber: 1 } unique
{ tenantId: 1, patientId: 1 }
{ tenantId: 1, status: 1 }
{ tenantId: 1, createdAt: -1 }
{ tenantId: 1, doctorId: 1 }

AdvancePayment Schema (collection: advance_payments):
- _id
- tenantId: ObjectId (required)
- patientId: ObjectId ref Patient (required)
- totalAmount: number
- usedAmount: number default 0
- balance: number           # totalAmount - usedAmount
- payments: [{
    amount: number,
    mode: string,
    reference: string,
    paidAt: Date,
    recordedBy: ObjectId ref User
  }]
- usageHistory: [{
    invoiceId: ObjectId ref Invoice,
    amount: number,
    usedAt: Date
  }]
- notes: string
- createdBy: ObjectId ref User
- createdAt, updatedAt

Indexes: { tenantId: 1, patientId: 1 }

--- Billing Business Logic ---

calculateLineItem(item: LineItemInput): LineItemCalculated
- taxAmount = ((unitPrice * quantity) - discountAmount) * (taxPercent / 100)
- lineTotal = (unitPrice * quantity) - discountAmount + taxAmount
- If discountPercent provided and discountAmount not: 
  discountAmount = (unitPrice * quantity) * (discountPercent / 100)
- Always calculate server-side, never trust frontend totals

calculateInvoiceTotals(lineItems):
- subtotal = sum(unitPrice * quantity)
- totalDiscount = sum(discountAmount)
- totalTax = sum(taxAmount)
- grandTotal = subtotal - totalDiscount + totalTax
- pendingAmount = grandTotal - paidAmount - advanceUsed

generateInvoiceNumber(tenantId):
- Get tenant slug (3 chars)
- Count invoices for tenant this year
- Format: "LAL-INV-2024-0001"
- Use atomic counter or count+1 approach

generateInvoicePDF(invoice, tenant):
Using pdfkit, generate PDF with:

Header section:
- Clinic name (large, bold)
- Address, Phone, Email
- GSTIN if available
- "INVOICE" title + invoice number + date

Patient section:
- Patient name, ID, phone
- Doctor name
- Appointment date (if linked)

Line items table:
| # | Description | Qty | Unit Price | Discount | Tax (18%) | Total |
- Each line item as a row
- Calculated values shown

Summary box (right aligned):
- Subtotal: ₹X,XXX
- Total Discount: - ₹XXX
- GST (18%): + ₹XXX
- Grand Total: ₹X,XXX (bold)

Payment history:
- Each payment: Date | Mode | Reference | Amount
- Total Paid: ₹X,XXX
- Pending Balance: ₹XXX (highlight in red if > 0)

Footer:
- "Thank you for choosing [Clinic Name]"
- Contact details
- Generated date/time + "This is a computer-generated invoice"

PDF must be generated as Buffer (stream to buffer), never write to disk.
After generation, upload using StorageService equivalent logic 
(since StorageModule is on another branch, implement a simple 
local GCS upload helper in billing/helpers/gcs-upload.helper.ts 
— Person 2's StorageService will replace this after merge with a comment).

--- Billing Endpoints ---

Procedures:
POST /billing/procedures — create procedure (ADMIN only)
GET /billing/procedures — list (filter: category, isActive)
GET /billing/procedures/:id
PATCH /billing/procedures/:id — update
DELETE /billing/procedures/:id — soft delete (isActive = false)

Invoices:
POST /billing/invoices
- Body: { patientId, doctorId, appointmentId?, lineItems[], notes, dueDate? }
- Server calculates all amounts
- Status = DRAFT
- Fetch patient snapshot from DB (stub with interface for now)

GET /billing/invoices
- Filters: status, patientId, doctorId, from, to, page, limit

GET /billing/invoices/:id
- Full invoice with all populated refs

PATCH /billing/invoices/:id
- Only allowed when status = DRAFT
- Can update lineItems, notes

POST /billing/invoices/:id/issue
- Change DRAFT → ISSUED
- Trigger PDF generation + upload → save pdfUrl
- Returns invoice with pdfUrl

POST /billing/invoices/:id/payment
- Body: { amount, mode, reference }
- Validate amount <= pendingAmount
- Update paidAmount, pendingAmount
- Auto-update status: if pendingAmount = 0 → PAID, else PARTIALLY_PAID
- Add to payments array

POST /billing/invoices/:id/cancel
- Body: { reason }
- ADMIN only
- Only DRAFT or ISSUED can be cancelled

POST /billing/invoices/:id/refund
- Body: { amount, reason, mode }
- ADMIN only
- Status → REFUNDED

GET /billing/invoices/:id/pdf
- If pdfUrl exists, return signed URL
- If not, regenerate PDF, upload, return

Advanced payments:
POST /billing/advance — create advance payment for patient
GET /billing/advance/patient/:patientId — get advance balance
POST /billing/advance/:id/use — use advance against invoice
  Body: { invoiceId, amount }

=== INVENTORY MODULE ===
Location: src/modules/inventory/

--- Schemas ---

InventoryItem Schema (collection: inventory_items):
- _id
- tenantId: ObjectId (required, indexed)
- name: string (required)
- category: enum:
    'CONSUMABLE' | 'INSTRUMENT' | 'MEDICATION' | 
    'LAB_MATERIAL' | 'IMPLANT' | 'CROWN' | 'ANESTHETIC' | 'OTHER'
- unit: string — "pieces", "boxes", "ml", "gm", "packets"
- currentStock: number default 0
- minimumStock: number default 0 — alert threshold
- unitCost: number — purchase cost per unit
- sellingPrice: number (optional)
- vendor: {
    name: string,
    phone: string,
    email: string,
    gstNumber: string
  }
- notes: string
- isActive: boolean default true
- lastPurchaseDate: Date
- lastUsageDate: Date
- createdAt, updatedAt

Indexes: { tenantId: 1, category: 1 }, { tenantId: 1, currentStock: 1 }

StockTransaction Schema (collection: stock_transactions):
- _id
- tenantId: ObjectId (required, indexed)
- itemId: ObjectId ref InventoryItem (required)
- type: enum ['PURCHASE', 'USAGE', 'ADJUSTMENT', 'RETURN', 'LOSS']
- quantity: number — positive for PURCHASE/RETURN, negative for USAGE/LOSS
- unitCost: number
- totalCost: number — |quantity| * unitCost
- stockBefore: number — snapshot before transaction
- stockAfter: number — snapshot after transaction
- referenceNote: string — "Supplier invoice #123", "Used for patient LAL-0023"
- patientId: ObjectId ref Patient (optional)
- performedBy: ObjectId ref User
- createdAt

Indexes: { tenantId: 1, itemId: 1 }, { tenantId: 1, createdAt: -1 }

LabCase Schema (collection: lab_cases):
- _id
- tenantId: ObjectId (required)
- patientId: ObjectId ref Patient (required)
- doctorId: ObjectId ref User (required)
- labName: string (required)
- labPhone: string
- caseType: string — "Crown", "Bridge", "Denture", "Implant", "Orthodontic"
- toothNumbers: string[] — ["16", "17"]
- shade: string — "A2", "B3"
- sentDate: Date (required)
- expectedReturnDate: Date
- actualReturnDate: Date
- status: enum:
    'SENT' | 'IN_PROGRESS' | 'RECEIVED' | 'FITTED' | 'CANCELLED' | 'REJECTED'
  default: 'SENT'
- cost: number
- isInvoiced: boolean default false
- notes: string
- createdBy: ObjectId ref User
- createdAt, updatedAt

Indexes: { tenantId: 1, status: 1 }, { tenantId: 1, patientId: 1 }

--- Inventory Business Logic ---

recordTransaction(tenantId, { itemId, type, quantity, unitCost, ... }):
1. Load current item (verify tenantId match)
2. Capture stockBefore = item.currentStock
3. Calculate new stock:
   - PURCHASE / RETURN: currentStock + |quantity|
   - USAGE / LOSS: currentStock - |quantity|
   - ADJUSTMENT: set directly to quantity value
4. Validate: USAGE cannot bring stock below 0 → throw BadRequestException
5. Update item: currentStock = stockAfter, update lastPurchaseDate or lastUsageDate
6. Create StockTransaction document with stockBefore and stockAfter
7. Check low stock: if new currentStock <= item.minimumStock → 
   add to response: { lowStockAlert: true, itemName, currentStock, minimumStock }
   Log this with NestJS Logger for WhatsApp module to pick up later
8. Return transaction + lowStockAlert flag

--- Inventory Endpoints ---

Items:
POST /inventory/items — add item (ADMIN only)
GET /inventory/items — list (filter: category, isActive, lowStock=true/false)
  lowStock filter: currentStock <= minimumStock
GET /inventory/items/:id — get item with recent transactions
PATCH /inventory/items/:id — update
DELETE /inventory/items/:id — soft delete

Transactions:
POST /inventory/transactions — record stock movement
  Body: { itemId, type, quantity, unitCost?, referenceNote, patientId? }
GET /inventory/transactions — list (filter: itemId, type, from, to, page, limit)
GET /inventory/transactions/item/:itemId — transaction history for one item

Special:
GET /inventory/low-stock
  Returns: items where currentStock <= minimumStock
  Sorted by (currentStock/minimumStock) ascending
  
GET /inventory/valuation
  Returns: [{
    category,
    itemCount,
    totalValue: sum(currentStock * unitCost),
    lowStockCount
  }]

Lab Cases:
POST /inventory/lab-cases
GET /inventory/lab-cases (filter: status, doctorId, from, to)
GET /inventory/lab-cases/pending — status IN ['SENT','IN_PROGRESS']
PATCH /inventory/lab-cases/:id — update status, actualReturnDate, cost, notes
DELETE /inventory/lab-cases/:id — ADMIN only

=== REPORTS MODULE ===
Location: src/modules/reports/

All endpoints:
- ADMIN or DOCTOR role
- Query: from=YYYY-MM-DD (default: 30 days ago), to=YYYY-MM-DD (default: today)
- All MongoDB aggregations MUST start with $match: { tenantId }
- Return response includes: { from, to, generatedAt, data: [...] }

Using dayjs for all date calculations.

GET /reports/dashboard
One combined API for dashboard widgets. Returns:
{
  today: {
    revenue: number,
    appointments: number,
    newPatients: number,
    completedAppointments: number,
    cancelledAppointments: number
  },
  thisMonth: {
    revenue: number,
    appointments: number,
    newPatients: number
  },
  alerts: {
    pendingPaymentsTotal: number,
    pendingPaymentsCount: number,
    lowStockCount: number,
    pendingLabCases: number
  }
}

GET /reports/revenue/daily
Aggregate invoices (status != CANCELLED) by date:
Return: [{
  date: "2024-01-15",
  totalBilled: number,    # sum grandTotal
  totalCollected: number, # sum paidAmount
  totalPending: number,   # sum pendingAmount
  invoiceCount: number
}]

GET /reports/revenue/monthly
Group by year+month:
Return: [{
  year: 2024,
  month: 1,               # 1-12
  monthName: "January",
  totalBilled: number,
  totalCollected: number,
  totalPending: number,
  invoiceCount: number
}]

GET /reports/revenue/doctor
Group invoices by doctorId:
Return: [{
  doctorId: string,
  doctorName: string,
  totalBilled: number,
  totalCollected: number,
  invoiceCount: number,
  patientCount: number    # distinct patients
}]

GET /reports/appointments/summary
Return: {
  total: number,
  byStatus: {
    SCHEDULED: number, CONFIRMED: number, COMPLETED: number,
    CANCELLED: number, NO_SHOW: number, IN_PROGRESS: number
  },
  byDoctor: [{
    doctorId, doctorName, total, completed, cancelled, noShow
  }],
  byType: [{ type, count }]
}

GET /reports/appointments/no-show
Return paginated list of no-show appointments with patient info:
[{
  appointmentId,
  date, startTime,
  patient: { patientId, name, phone, whatsappOptIn },
  doctorName,
  tokenNumber
}]

GET /reports/patients/growth
Group patients by registration month:
Return: [{
  year, month, monthName,
  newPatients: number,
  cumulativeTotal: number
}]

GET /reports/patients/pending-payments
Patients with pendingAmount > 0 across all invoices:
Return: [{
  patientId (ObjectId),
  patientCode,
  patientName,
  phone,
  totalPending: number,
  oldestUnpaidDate: Date,
  invoiceCount: number
}]

GET /reports/inventory/expenses
Aggregate StockTransactions of type PURCHASE by category, joined with InventoryItem:
Return: [{
  category,
  totalSpent: number,
  transactionCount: number,
  itemCount: number
}]

GET /reports/chairs/utilization
Query: from, to
Aggregate appointments by chairId:
Return: [{
  chairId,
  totalAppointments: number,
  totalDurationMinutes: number,
  completedAppointments: number,
  utilizationPercent: number  # (totalDurationMinutes / availableMinutes) * 100
}]

=== CODING STANDARDS ===
- TypeScript strict, no `any`
- Import from '../../common' for shared utilities
- Every MongoDB query: first filter is { tenantId }
- All amounts: float with 2 decimal precision stored in DB
- Always calculate amounts server-side, validate inputs with class-validator
- dayjs for ALL date operations (no native Date math)
- PDF generation: Buffer only, never write to disk
- Aggregation pipelines: add $limit to prevent runaway queries (max 1000 for reports)
- Export BillingService from BillingModule (Person 4 needs it)

Stub interfaces for cross-module refs (put in billing/interfaces/):
// TODO: Replace with real import from PatientsModule after branch merge
interface PatientRef {
  _id: string;
  name: string;
  phone: string;
  patientId: string;
  email: string;
}

Add to app.module.ts:
  // Person 3 modules - Business Logic
  BillingModule,
  InventoryModule,
  ReportsModule,

Write MODULES.md with:
- All endpoints, roles, query params
- Business logic notes (invoice calculation, PDF structure)
- What you export for other modules
- Stub interfaces and merge instructions