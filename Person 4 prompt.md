You are building two things simultaneously:
A) The complete Next.js frontend for a multi-tenant Dental Clinic SaaS
B) Two NestJS backend modules (WhatsApp automation + Gemini AI) 
   to be added to the existing dental-backend repo

⚠️ IMPORTANT CONTEXT — READ BEFORE WRITING ANY CODE:
The dental clinic SaaS backend is built by 4 developers:
- Person 1: auth/ tenant/ users/ common/ — DONE (foundation)
- Person 2: appointments/ patients/ storage/ — DONE (clinical)
- Person 3: billing/ inventory/ reports/ — DONE (business)
- YOU (Person 4): 
  A) dental-frontend/ — ENTIRE Next.js app (you own this repo fully)
  B) dental-backend/src/modules/whatsapp/ — WhatsApp automation
  C) dental-backend/src/modules/ai/ — Gemini AI integration

YOUR RULES FOR BACKEND ADDITIONS:
1. Do NOT touch: auth, tenant, users, appointments, patients, storage, 
   billing, inventory, reports modules
2. Only create files in: src/modules/whatsapp/ and src/modules/ai/
3. You need AppointmentsService and PatientsService from Person 2.
   Import them from their modules (they export these services).
4. You need BillingService from Person 3 for invoice queries.
5. Add to app.module.ts: // Person 4 modules → WhatsAppModule, AiModule
6. Install in backend: npm install @google/generative-ai

=== PART A: NEXT.JS FRONTEND ===

Tech Stack:
- Next.js 14 (App Router, TypeScript strict)
- Tailwind CSS + shadcn/ui
- TanStack Query v5 for server state
- Axios with interceptors
- React Hook Form + Zod validation
- react-big-calendar for scheduling
- recharts for charts
- zustand for auth state
- next-themes for dark/light mode
- lucide-react for icons
- dayjs for date formatting
- jwt-decode for reading JWT claims

=== FRONTEND FOLDER STRUCTURE ===
dental-frontend/
├── app/
│   ├── globals.css
│   ├── layout.tsx              # root layout with QueryProvider, ThemeProvider
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx          # centered card layout
│   └── (dashboard)/
│       ├── layout.tsx          # sidebar + header shell
│       ├── dashboard/page.tsx
│       ├── appointments/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── patients/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/
│       │       ├── page.tsx
│       │       └── notes/page.tsx
│       ├── billing/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       ├── inventory/
│       │   ├── page.tsx
│       │   └── lab-cases/page.tsx
│       ├── reports/page.tsx
│       └── settings/
│           └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── PageWrapper.tsx
│   │   └── MobileSidebar.tsx
│   ├── appointments/
│   │   ├── AppointmentCalendar.tsx
│   │   ├── AppointmentForm.tsx
│   │   ├── AppointmentCard.tsx
│   │   ├── SlotPicker.tsx
│   │   ├── AppointmentStatusBadge.tsx
│   │   └── TodayAppointmentList.tsx
│   ├── patients/
│   │   ├── PatientSearch.tsx
│   │   ├── PatientForm.tsx
│   │   ├── PatientProfileHeader.tsx
│   │   ├── PatientHistory.tsx
│   │   ├── ClinicalNoteForm.tsx
│   │   ├── ClinicalNoteCard.tsx
│   │   ├── PatientDocuments.tsx
│   │   └── PatientBillingSummary.tsx
│   ├── billing/
│   │   ├── InvoiceForm.tsx
│   │   ├── LineItemRow.tsx
│   │   ├── InvoiceTotals.tsx
│   │   ├── PaymentModal.tsx
│   │   └── InvoiceStatusBadge.tsx
│   ├── inventory/
│   │   ├── StockTable.tsx
│   │   ├── StockForm.tsx
│   │   ├── TransactionModal.tsx
│   │   └── LabCaseTable.tsx
│   ├── reports/
│   │   ├── DashboardWidgets.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── AppointmentPieChart.tsx
│   │   ├── PatientGrowthChart.tsx
│   │   └── ChairUtilizationBar.tsx
│   └── shared/
│       ├── DataTable.tsx
│       ├── SearchInput.tsx
│       ├── ConfirmDialog.tsx
│       ├── FileUpload.tsx
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       ├── PageHeader.tsx
│       └── CurrencyDisplay.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.api.ts
│   │   ├── appointments.api.ts
│   │   ├── patients.api.ts
│   │   ├── billing.api.ts
│   │   ├── inventory.api.ts
│   │   └── reports.api.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAppointments.ts
│   │   ├── usePatients.ts
│   │   ├── useBilling.ts
│   │   ├── useInventory.ts
│   │   └── useReports.ts
│   ├── stores/
│   │   └── auth.store.ts       # zustand
│   ├── utils/
│   │   ├── format.ts           # currency, date, phone
│   │   └── cn.ts               # classnames helper
│   └── types/
│       └── index.ts            # all TypeScript interfaces
├── middleware.ts
└── next.config.ts

=== EVERY PAGE IN DETAIL ===

--- 1. LOGIN PAGE ---
/app/(auth)/login/page.tsx

Design: Centered card on gradient background, clinic logo placeholder
Form fields: Email, Password, "Sign In" button
Below form: "Powered by DentalCloud" text

Logic:
- useForm with Zod: email (required, email format), password (required, min 6)
- On submit: call POST /auth/login
- On success: store token in zustand + localStorage → redirect /dashboard
- On error: show error toast
- Show loading state on button during submit
- Input: show password toggle button

--- 2. DASHBOARD PAGE ---
/app/(dashboard)/dashboard/page.tsx

Layout: 
- Top row: 4 stat cards (2-col on mobile, 4-col on desktop)
- Second row: Today's Appointments list (left 60%) + Revenue Chart (right 40%)
- Third row: Alerts section (low stock + pending payments)

Stat cards (fetch from GET /reports/dashboard):
1. Today's Appointments — icon: Calendar, color: blue
2. Today's Revenue — icon: IndianRupee, color: green, format: ₹X,XXX
3. Pending Payments — icon: AlertCircle, color: orange
4. Low Stock Alerts — icon: Package, color: red, clickable → /inventory?filter=low

Today's Appointments section:
- Group by doctor, show doctor color dot
- Each appointment: time | patient name | token# | status badge | action buttons
- Action buttons: Confirm / Start / Complete / No Show (contextual by status)
- "View All" link → /appointments

Revenue Chart (recharts BarChart):
- Last 7 days, X-axis: date labels, Y-axis: ₹ amount
- Two bars: Billed (grey) and Collected (green)
- Tooltip shows exact amounts

Alerts section:
- Low stock items list (top 3, "View All" → /inventory?filter=low)
- Pending lab cases count with link

--- 3. APPOINTMENTS PAGE ---
/app/(dashboard)/appointments/page.tsx

Toggle buttons: "📅 Calendar" | "📋 List"

Calendar View (react-big-calendar):
- Default: Week view, switch to Day view
- Events colored by doctor (use doctor.doctorProfile.color)
- Event display: "Patient Name - Token #X"
- Click empty slot → open New Appointment slide-over with date/time pre-filled
- Click existing event → open appointment detail sheet
- Include doctor filter dropdown to show/hide specific doctors

List View:
- Table: Time | Patient | Doctor | Chair | Procedures | Status | Actions
- Filters: Date picker, Doctor select, Status select
- Pagination
- Status badge with colors
- Actions: View, Update Status, Cancel

New Appointment Slide-over (Sheet component):
Form fields:
1. Patient search (autocomplete calling GET /patients/search?q=...)
   - Show dropdown with: PatientID | Name | Phone
   - "Register New Patient" option at bottom of dropdown
2. Doctor select (GET /users/doctors)
3. Chair select (from tenant settings)
4. Date picker (calendar popup)
5. Available Slots (loaded AFTER doctor + date selected):
   - Call GET /appointments/slots?doctorId=&date=
   - Display as clickable chips: "09:00" "09:30" "10:00"
   - Booked slots greyed out, available slots clickable
   - Loading spinner while fetching
6. Appointment type select
7. Procedures multi-select (from GET /billing/procedures)
8. Chief complaint textarea
9. Notes textarea

On submit: POST /appointments → show success toast → close sheet → refetch

Appointment Detail Sheet:
- Show all appointment info
- Status update buttons based on current status
- Link to patient profile
- Link to clinical note (if exists)
- Link to invoice (if exists)
- Reschedule option → opens new date/slot picker inline

--- 4. PATIENTS PAGE ---
/app/(dashboard)/patients/page.tsx

Search bar (top, prominent): debounced 300ms, calls GET /patients?search=
Table columns: Patient ID | Name | Phone | Age | Last Visit | Total Visits | Balance | Actions
"Register New Patient" button → /patients/new

/app/(dashboard)/patients/new/page.tsx
Full registration form with sections:
Section 1 - Basic Info: Name*, Phone*, Email, DOB (auto-calculate age), Gender, Blood Group
Section 2 - Address: Street, City, Pincode
Section 3 - Medical: Allergies (tag input), Medical History (textarea), Current Medications
Section 4 - Emergency Contact: Name, Phone, Relation
Section 5 - Preferences: WhatsApp opt-in toggle, Referral source, ABHA ID, Notes
"Register Patient" button → POST /patients → redirect to patient profile

/app/(dashboard)/patients/[id]/page.tsx
Patient Profile with 5 tabs:

Tab 1 - Overview:
- Header card: Name, Patient ID badge, Phone, Age, Blood group, Active/inactive badge
- Allergy badges (red) and medical notes
- Stats row: Total visits, Last visit, Pending balance (₹), Upcoming appointment
- Quick action buttons: Book Appointment, New Invoice, Add Note

Tab 2 - Visit History:
- Timeline (vertical) of all appointments newest first
- Each item: Date | Time | Doctor | Chair | Status badge | Token | Procedures
- Click item → navigate to appointment or open detail sheet

Tab 3 - Clinical Notes:
- List of notes with: Date, Doctor, Chief complaint (preview)
- Expand/collapse each note to show full details
- "Add New Note" button → slide-over form
  Form: appointmentId (optional, dropdown of recent appts), visitDate, 
  chiefComplaint, clinicalFindings, diagnosis, treatmentDone, 
  treatmentPlan, prescriptions (dynamic add/remove rows), 
  toothChart (simple free-text JSON or tooth number → note mapping), followUpInDays
- Notes are read-only for RECEPTIONIST role (only DOCTOR/ADMIN can add)

Tab 4 - Documents:
- Grid of uploaded documents with file type icons
- Each card: file name, type badge, upload date, uploaded by
- "View" button → calls GET /storage/signed-url → opens in new tab
- Upload zone (drag-and-drop or click):
  1. File selected → POST /storage/upload → get filePath + fileUrl
  2. POST /patients/:id/documents with metadata → save record
  3. Refresh list
- Filter by file type (X-Ray, Report, Consent etc.)

Tab 5 - Billing:
- Pending balance alert (if any) in orange/red
- Invoice list for this patient
- Advance balance (if any) in green
- "Create Invoice" button → /billing/new?patientId=XXX

--- 5. BILLING PAGE ---
/app/(dashboard)/billing/page.tsx

Tabs: Invoices | Advance Payments

Invoices tab:
- Filters: Status (chips), Doctor select, Date range picker
- Table: Invoice# | Patient | Doctor | Date | Grand Total | Paid | Pending | Status | Actions
- Status filter chips: ALL | DRAFT | ISSUED | PARTIAL | PAID | CANCELLED
- "New Invoice" button → /billing/new

/app/(dashboard)/billing/new/page.tsx
Two-column layout:

Left column (form):
1. Patient — searchable autocomplete (same as appointments)
2. Doctor — select
3. Link to appointment — optional select (shows recent appts for selected patient)
4. Line Items section:
   - "Add Procedure" button → opens dropdown to select from procedures master list
     OR "Add Custom Item" for free-text entry
   - Each row: Description | Qty | Unit Price | Discount% | Tax% | Total
   - All calculations happen in real-time as user types
   - Remove row button (X)
5. Notes textarea
6. Due date picker

Right column (live summary card — sticky):
- Subtotal: ₹X,XXX
- Total Discount: - ₹XXX
- GST: + ₹XXX
- Grand Total: ₹X,XXX (large, bold)
- Two buttons: "Save Draft" | "Issue Invoice"

/app/(dashboard)/billing/[id]/page.tsx
Invoice detail view:
- Invoice header: number, date, status badge, doctor
- Patient card: name, ID, phone
- Line items table (read-only)
- Totals section
- Payment history table: Date | Mode | Reference | Amount
- Action buttons (context-sensitive by status):
  - DRAFT: Edit | Issue Invoice | Cancel
  - ISSUED/PARTIAL: Record Payment (opens modal) | Use Advance | Download PDF | Cancel
  - PAID: Download PDF | View Only
  - CANCELLED: View Only

Record Payment Modal:
- Amount input (default = pendingAmount)
- Mode select: Cash, Card, UPI, Bank Transfer, Cheque
- Reference input (optional, e.g. UPI transaction ID)
- "Record Payment" button

Download PDF: 
- Click → call GET /billing/invoices/:id/pdf → get signedUrl → window.open(signedUrl)

--- 6. INVENTORY PAGE ---
/app/(dashboard)/inventory/page.tsx

Tabs: Stock Items | Lab Cases

Stock Items tab:
- Summary cards: Total Items, Low Stock Count (red), Total Inventory Value
- Filter: category select, "Show Low Stock Only" toggle
- Table: Name | Category | Unit | Current Stock | Min Stock | Unit Cost | Value | Status | Actions
- Status: "Low" (red badge) if currentStock <= minimumStock, else "OK" (green)
- Actions per row: Record Usage | Record Purchase | View History | Edit
- Record Usage modal: quantity input, reference note, optional patient link
- Record Purchase modal: quantity, unit cost, reference note
- View History: opens sheet with transaction timeline for that item
- "Add New Item" slide-over

/app/(dashboard)/inventory/lab-cases/page.tsx
- Filter: Status chips, Doctor select
- Table: Patient | Lab Name | Case Type | Shade | Sent Date | Expected Return | Status | Cost
- Status badge with color: SENT (blue), RECEIVED (green), FITTED (teal), REJECTED (red)
- "Update Status" button → dropdown: Received, Fitted, Cancelled, Rejected
  → if RECEIVED: prompt for actualReturnDate
- "New Lab Case" slide-over form

--- 7. REPORTS PAGE ---
/app/(dashboard)/reports/page.tsx

Tabs: Revenue | Appointments | Patients | Inventory

All tabs have date range picker at top (from/to).

Revenue tab:
- Stat cards: Total Billed | Total Collected | Total Pending | Outstanding Invoices
- Daily Revenue Bar Chart (recharts BarChart):
  X: dates, Y: ₹ amount, two bars: Billed + Collected
- Monthly Revenue Line Chart:
  X: months, Y: ₹ amount, two lines: Billed + Collected
- Doctor Revenue Horizontal Bar Chart:
  Y: doctor names, X: ₹ revenue
  

Appointments tab:
- Stats: Total | Completed | Cancelled | No-Shows
- Pie chart (recharts PieChart): breakdown by status, colored
- No-Show table: Patient Name | Phone | Date | Doctor | WhatsApp icon (if opted in)
  WhatsApp icon → opens wa.me/91{phone} link
- Chair Utilization: progress bars per chair showing utilization %

Patients tab:
- Patient Growth Line Chart (new patients per month)
- Pending Payments table: Patient | Phone | Total Pending | Oldest Invoice Date
  Sortable by pending amount

Inventory tab:
- Expense by Category Bar Chart
- Low Stock Items list (click → goes to /inventory?filter=low)

--- 8. SETTINGS PAGE ---
/app/(dashboard)/settings/page.tsx

Tabs: Clinic | Team | Procedures | Chairs

Clinic tab:
- Edit: clinic name, email, phone, address
- Working hours: start time + end time pickers
- Working days: day toggles (Mon-Sun checkboxes)
- Default appointment duration: 15/30/45/60 min select
- GST number input
- Save button → PATCH /tenants/:id

Team tab:
- Table: Name | Email | Role | Last Login | Status | Actions
- "Add Team Member" button → slide-over:
  Name, Email, Temp Password, Role (DOCTOR/RECEPTIONIST), 
  If DOCTOR: Specialization, Registration#, Consultation Duration, Chair assignments
- Deactivate/Reactivate user toggle

Procedures tab:
- Table: Code | Name | Category | Duration | Price | Taxable | Status
- Add/Edit/Deactivate procedures
- "Set as Default" to use in appointments

Chairs tab:
- List of chairs with names
- Add chair (just a name/ID string like "CHAIR-1")
- Drag to reorder
- Delete chair

=== FRONTEND TECHNICAL REQUIREMENTS ===

lib/api/client.ts:
- Axios instance: baseURL = process.env.NEXT_PUBLIC_API_URL
- Request interceptor: add Authorization header from zustand store
- Response interceptor: unwrap data.data from standard API response format
- On 401: clear auth store + redirect to /login
- On 422/400: extract error message and throw

lib/stores/auth.store.ts (zustand):
interface AuthState {
  token: string | null
  user: { sub, tenantId, role, email, name } | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}
- Persist to localStorage
- Decode JWT on login using jwt-decode

middleware.ts:
- Protect all /dashboard/* and / → redirect to /login
- Allow /login as public
- Read token from localStorage via cookies for SSR compatibility

lib/types/index.ts — all TypeScript interfaces:
Export: Tenant, User, Patient, Appointment, DoctorLeave, ClinicalNote, 
PatientDocument, Invoice, LineItem, Payment, Procedure, AdvancePayment,
InventoryItem, StockTransaction, LabCase, DashboardReport, RevenueReport, 
AppointmentSummary, PaginatedResult<T>, ApiResponse<T>

lib/utils/format.ts:
- formatCurrency(amount): "₹1,234.50"
- formatDate(date): "15 Jan 2024"
- formatDateTime(date): "15 Jan 2024, 10:30 AM"
- formatPhone(phone): "+91 98765 43210"
- formatTime(time): "10:30 AM" from "10:30"
- getStatusColor(status): returns tailwind class string

Design System:
- Primary: Teal #0D9488 (medical, trustworthy)
- Configure in tailwind.config.ts
- Status colors:
  SCHEDULED: blue, CONFIRMED: indigo, IN_PROGRESS: yellow, 
  COMPLETED: green, CANCELLED: red, NO_SHOW: orange
  PAID: green, PARTIALLY_PAID: yellow, DRAFT: gray, ISSUED: blue
- Clean sidebar: white bg, teal active state
- All pages have PageWrapper with title + subtitle + action button slot
- Dark mode: use next-themes, sidebar and cards invert cleanly
- Mobile: sidebar collapses to hamburger menu (MobileSidebar.tsx)

=== PART B: WHATSAPP AUTOMATION MODULE ===
Location in backend: src/modules/whatsapp/

Install: npm install axios (already there, confirm)

Schemas:

WhatsAppPhoneMapping (collection: wa_phone_mappings):
- _id
- whatsappPhoneNumberId: string (indexed)
- tenantId: string
- isActive: boolean

WhatsAppSession (collection: wa_sessions):
- _id
- phone: string (indexed)
- tenantId: string
- state: enum:
    'IDLE' | 'AWAITING_NAME' | 'AWAITING_DATE' | 
    'AWAITING_DOCTOR_CHOICE' | 'AWAITING_SLOT' | 
    'BOOKING_CONFIRM' | 'RESCHEDULE_SELECT' | 'CANCEL_SELECT'
  default: 'IDLE'
- context: Object (stores partial booking data between messages)
  Example: { name, date, doctorId, doctorName, slotTime, tempPatientId }
- lastInteraction: Date (indexed, for TTL)
- createdAt, updatedAt

TTL index: lastInteraction expires after 30 minutes → reset state to IDLE on read

WhatsAppController:
GET /whatsapp/webhook
- Query: hub.mode, hub.verify_token, hub.challenge
- If hub.verify_token === env.WHATSAPP_VERIFY_TOKEN → return hub.challenge as plain text
- Else → throw ForbiddenException

POST /whatsapp/webhook
- Validate incoming Meta payload shape
- Extract: from (phone), messageBody (text), phoneNumberId
- Immediately return 200 OK (do NOT await processing — use setImmediate or fire-and-forget)
- Call whatsappService.processMessage(from, messageBody, phoneNumberId) asynchronously

WhatsAppService:

processMessage(from, text, phoneNumberId):
1. Find tenantId from WhatsAppPhoneMapping where whatsappPhoneNumberId = phoneNumberId
2. If no mapping found: do nothing (unknown number)
3. Load session for phone (create if not exists)
4. Check if session.lastInteraction > 30 min ago → reset state to IDLE
5. Normalize text: trim + lowercase for comparison
6. Route to handler based on state + text

Message Router:
Any state - priority keywords (check first before state routing):
  "hi","hello","hey","start","menu" → showMainMenu()
  "book","appointment","1" → startBooking()
  "my appointments","2" → showMyAppointments()
  "cancel","3" → startCancelFlow()
  "hours","clinic hours","4" → sendClinicHours()
  "staff","help","5" → sendStaffMessage()

State-based routing:
  AWAITING_NAME → handleNameInput(text)
  AWAITING_DATE → handleDateInput(text)
  AWAITING_DOCTOR_CHOICE → handleDoctorChoice(text)
  AWAITING_SLOT → handleSlotChoice(text)
  BOOKING_CONFIRM → handleBookingConfirm(text)
  CANCEL_SELECT → handleCancelChoice(text)
  IDLE + no keyword match → route to GeminiService.generateReply()

Flow implementations:

showMainMenu(tenantId):
  Fetch tenant name
  Send: "Welcome to [Clinic Name]! 👋\n\nHow can we help you today?\n\n1️⃣ Book Appointment\n2️⃣ My Appointments\n3️⃣ Cancel Appointment\n4️⃣ Clinic Hours\n5️⃣ Speak to Staff\n\nReply with a number or keyword."

startBooking(session):
  Send: "Let's book your appointment! 😊\n\nPlease share your full name:"
  Update session: state = AWAITING_NAME

handleNameInput(session, text):
  Store in context: { name: text }
  Send: "Thanks [name]! 📅\n\nWhat date would you like? (e.g., 26 Jan, tomorrow, next Monday)"
  Update state: AWAITING_DATE

handleDateInput(session, text):
  Parse date from text using dayjs (handle relative: tomorrow, next monday etc.)
  If invalid date → re-ask
  Fetch doctors: GET available doctors for that date (call AppointmentsService)
  Build numbered list of available doctors
  Send: "Available doctors for [date]:\n\n1. Dr. Priya Sharma\n2. Dr. Rajan Kumar\n\nReply with the number:"
  Store in context: { date }
  Update state: AWAITING_DOCTOR_CHOICE

handleDoctorChoice(session, text):
  Parse number from text
  Get doctor from context's doctor list
  Fetch slots: AppointmentsService.getAvailableSlots(tenantId, doctorId, date)
  If no slots: "Sorry, no slots available for [doctor] on [date]. Try another date? Reply with a new date or 'menu' to go back."
  Build numbered slot list (max 8)
  Send: "Available times with [Doctor]:\n\n1. 10:00 AM\n2. 10:30 AM\n3. 11:00 AM\n\nReply with slot number:"
  Store in context: { doctorId, doctorName }
  Update state: AWAITING_SLOT

handleSlotChoice(session, text):
  Parse slot from list in context
  Show confirmation:
  Send: "Please confirm your appointment:\n\n👤 Name: [name]\n📅 Date: [date]\n🕐 Time: [time]\n👨‍⚕️ Doctor: [doctor]\n\nReply *YES* to confirm or *NO* to cancel"
  Store in context: { slotTime }
  Update state: BOOKING_CONFIRM

handleBookingConfirm(session, text):
  If text includes "yes" / "y":
    Call PatientsService.findOrCreateByPhone(tenantId, phone, name)
    Call AppointmentsService.createAppointment({ tenantId, patientId, doctorId, date, startTime, type: 'CONSULTATION' })
    Send: "✅ Appointment Confirmed!\n\n🎫 Token: #[tokenNumber]\n📅 [date] at [time]\n👨‍⚕️ [doctor]\n🏥 [Clinic Name]\n\nWe look forward to seeing you! 🦷"
    Reset state to IDLE, clear context
  If text includes "no" / "n":
    Send: "Booking cancelled. Type 'Book' anytime to schedule. 😊"
    Reset state to IDLE, clear context

showMyAppointments(phone, tenantId):
  Find patient by phone
  Get upcoming appointments (today + future, status: SCHEDULED/CONFIRMED)
  If none: "No upcoming appointments found. Type 'Book' to schedule one."
  Format and send list

startCancelFlow + handleCancelChoice:
  Show numbered list of upcoming appointments
  User selects number
  Confirm: "Cancel appointment on [date] at [time] with [doctor]? Reply YES/NO"
  On YES: call AppointmentsService update status to CANCELLED
  Send: "Your appointment has been cancelled. We hope to see you soon!"

sendClinicHours(tenantId):
  Load tenant settings
  Format working days and hours
  Send: "🕐 Clinic Hours\n\n[Clinic Name]\nMon-Sat: 9:00 AM - 8:00 PM\nSunday: Closed\n\n📞 [phone]\n📍 [address]"

WA Message Sender (util function):
sendWhatsAppMessage(to: string, body: string, phoneNumberId: string):
  POST https://graph.facebook.com/v18.0/{phoneNumberId}/messages
  Headers: Authorization: Bearer {WHATSAPP_TOKEN}
  Body: { messaging_product: "whatsapp", to, type: "text", text: { body } }
  Wrap in try-catch, log errors

Scheduled Jobs (BullMQ):
Install: npm install @nestjs/bull bull ioredis (if not already in project)

Queue name: "whatsapp"

Job 1: appointment-reminders
Cron: every hour (0 * * * *)
Logic:
  Find appointments: date = tomorrow, status IN [SCHEDULED, CONFIRMED], reminderSent = false
  For each:
    Find patient phone (via patientId)
    Send: "🦷 Appointment Reminder!\n\nHi [name], your appointment is tomorrow:\n📅 [date] at [time]\n👨‍⚕️ [doctor]\n🎫 Token: #[token]\n🏥 [Clinic]\n\nReply CONFIRM to confirm or CANCEL to cancel."
    Update appointment: reminderSent = true
    Log sent/failed

Job 2: no-show-recovery
Cron: daily at 8 PM (0 20 * * *)
Logic:
  Find appointments: date = today, status = NO_SHOW
  For each patient (deduplicate, one message per patient):
    Send: "We missed you today! 😔\n\n[Clinic Name] had an appointment scheduled for you today that we were unable to complete.\n\nWould you like to reschedule? Reply BOOK to pick a new time! 🗓️"

=== PART C: GEMINI AI MODULE ===
Location: src/modules/ai/

Install in backend: npm install @google/generative-ai

GeminiService:

generateReply(tenantId, patientMessage, sessionContext):
  Load tenant (name, address, working hours)
  Build system prompt:
  "You are a friendly and professional dental clinic receptionist assistant 
   for [Clinic Name] located at [address]. 
   Your job: help patients with appointment info, dental FAQs, clinic details.
   Clinic hours: [hours].
   Rules: 
   - Never diagnose medical conditions
   - Keep replies under 120 words
   - Be warm, friendly, professional
   - For emergencies: advise calling clinic immediately at [phone]
   - If unsure, say our team will help during clinic hours
   - End with a helpful suggestion when appropriate
   Patient context: [sessionContext if available]"
  
  Call Gemini API (model: gemini-1.5-flash):
  {
    contents: [{ role: "user", parts: [{ text: patientMessage }] }],
    generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
  }
  
  Return: generated text
  On any error: return "Our team will be happy to help you during clinic hours. 
  Please call us at [clinic phone] or visit us! 😊"

generatePatientSummary(patient, recentNotes):
  Build prompt with patient data and last 3 clinical notes
  Return structured AI summary paragraph
  Used by frontend Patient Profile page

AiController:
POST /ai/patient-summary
  Body: { patientId }
  ADMIN or DOCTOR role only
  Calls GeminiService.generatePatientSummary
  Returns: { summary: string }

POST /ai/chat-test
  Body: { message, tenantId }
  ADMIN only (for testing AI responses)
  Returns: { reply: string }

=== CODING STANDARDS — FRONTEND ===
- TypeScript strict everywhere, no `any`
- All forms: React Hook Form + Zod schema
- All API calls: TanStack Query (useQuery for GET, useMutation for POST/PATCH/DELETE)
- Loading states: use shadcn Skeleton components on all data-dependent UI
- Errors: show in toast (shadcn Toaster) for mutations, inline for forms
- Never useEffect for API calls — always TanStack Query
- Responsive: desktop-first, works on tablet
- Dark mode: all components must have dark: variants in Tailwind

=== CODING STANDARDS — BACKEND ADDITIONS ===
- TypeScript strict, no `any`
- WhatsApp webhook: always return 200 immediately → process async
- Gemini: always have fallback string on error
- BullMQ jobs: 3 retry attempts, exponential backoff
- Rate limit WA outbound: simple in-memory Map, max 1 msg/patient/60s
- Never block webhook response waiting for DB or API calls

=== DELIVERABLES ===
1. Complete Next.js frontend — all 8 pages, all components, fully working
2. WhatsApp NestJS module — conversation flows + scheduled jobs
3. Gemini AI NestJS module — intelligent reply + patient summary
4. FRONTEND.md: how to run, env vars, page list, component guide
5. WHATSAPP.md: webhook setup, conversation flow diagram (text tree), 
   ngrok testing steps, how to test each conversation flow manually
6. Add to backend app.module.ts: WhatsAppModule, AiModule with comment "// Person 4 modules"
```

---
---
