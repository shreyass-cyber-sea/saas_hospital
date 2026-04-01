🤖 PERSON 2 — AI PROMPT
You are extending an existing NestJS backend for a multi-tenant Dental Clinic SaaS.
You are working in the `dental-backend` repository on branch `feat/person2-clinical`.

⚠️ IMPORTANT CONTEXT — READ BEFORE WRITING ANY CODE:
This backend is being built by 4 developers in parallel.
- Person 1 has already built: auth/ tenant/ users/ common/ (foundation)
- YOU are building: appointments/ patients/ storage/
- Person 3 is building (separately): billing/ inventory/ reports/
- Person 4 is building (separately): whatsapp/ ai/ (in backend) + full frontend

YOUR RULES:
1. Do NOT touch or modify these files: auth.module.ts, tenant.module.ts, 
   users.module.ts, app.module.ts, main.ts, common/
2. You ONLY create new files inside: src/modules/appointments/, 
   src/modules/patients/, src/modules/storage/
3. At the end, add your 3 modules to app.module.ts imports with a comment 
   "// Person 2 modules"
4. Import shared utilities ONLY from '../../common' (Person 1's exports)
5. Your module exports must be clean so Person 3 and Person 4 can import 
   PatientsService and AppointmentsService without circular dependencies.

=== PACKAGES TO INSTALL ===
npm install @google-cloud/storage multer @types/multer

=== YOUR MODULES ===
1. StorageModule — Google Cloud Storage file handling
2. AppointmentsModule — full appointment management
3. PatientsModule — patient registration + clinical records

=== MODULE BOUNDARIES & EXPORTS ===
AppointmentsModule must EXPORT: AppointmentsService
PatientsModule must EXPORT: PatientsService
StorageModule must EXPORT: StorageService

Person 3 (billing) will import AppointmentsService to link invoices to appointments.
Person 3 (billing) will import PatientsService to look up patients during billing.
Person 4 (whatsapp) will import AppointmentsService to create/read appointments via WhatsApp flow.
Person 4 (whatsapp) will import PatientsService to find-or-create patients by phone number.

=== STORAGE MODULE ===
Location: src/modules/storage/

StorageService methods:

uploadFile(params: {
  tenantId: string,
  folder: 'xrays' | 'reports' | 'consents' | 'invoices' | 'misc',
  originalName: string,
  mimeType: string,
  buffer: Buffer
}): Promise<{ fileUrl: string, filePath: string, fileName: string }>
- Path in GCS: {tenantId}/{folder}/{Date.now()}-{sanitizedFileName}
- Returns both the path (for signed URLs) and full URL

getSignedUrl(filePath: string, expiresInMinutes = 60): Promise<string>
- Generate V4 signed URL for secure access

deleteFile(filePath: string): Promise<void>

StorageController:
POST /storage/upload
- Multipart form: file (binary), folder (string), patientId (string, optional)
- Auth required, any role
- Returns: { fileUrl, filePath, fileName, fileSize, mimeType }

GET /storage/signed-url
- Query: ?path=tenantId/xrays/filename.jpg
- Auth required
- Returns: { signedUrl, expiresAt }

=== APPOINTMENTS MODULE ===
Location: src/modules/appointments/

--- Schemas ---

DoctorLeave Schema (collection: doctor_leaves):
- _id, tenantId (required, indexed)
- doctorId: ObjectId ref User (required)
- date: Date (required)
- reason: string
- createdBy: ObjectId ref User
- createdAt, updatedAt
Compound index: { tenantId: 1, doctorId: 1, date: 1 } unique

Appointment Schema (collection: appointments):
- _id
- tenantId: ObjectId (required)
- patientId: ObjectId ref Patient (required)
- doctorId: ObjectId ref User (required)
- chairId: string (e.g. "CHAIR-1")
- date: Date (required) — store as date-only, normalize to midnight UTC
- startTime: string (required) — "10:30" (24hr format)
- endTime: string (required) — "11:00"
- duration: number — minutes, calculated from start/end
- status: enum required:
    'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 
    'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED'
  default: 'SCHEDULED'
- type: enum:
    'NEW_PATIENT' | 'FOLLOW_UP' | 'PROCEDURE' | 'EMERGENCY' | 'CONSULTATION'
  default: 'CONSULTATION'
- procedures: string[] — planned procedure names
- chiefComplaint: string
- notes: string
- tokenNumber: number — auto-assigned, daily sequential per doctor
- reminderSent: boolean default false
- followUpDate: Date (optional)
- cancelledReason: string
- cancelledAt: Date
- cancelledBy: ObjectId ref User
- rescheduledFrom: ObjectId ref Appointment (self-ref)
- createdBy: ObjectId ref User (required)
- createdAt, updatedAt

Indexes:
{ tenantId: 1, date: 1, doctorId: 1 }
{ tenantId: 1, patientId: 1 }
{ tenantId: 1, status: 1 }
{ tenantId: 1, date: 1, chairId: 1 }
{ tenantId: 1, reminderSent: 1 } — used by WhatsApp scheduler

--- Business Logic (implement in AppointmentsService) ---

getAvailableSlots(tenantId, doctorId, date):
1. Load tenant settings (working hours, default duration)
2. Check DoctorLeave — if doctor on leave → return []
3. Generate all slots between workingHours.start and workingHours.end 
   with appointmentDuration interval
4. Load all SCHEDULED/CONFIRMED/IN_PROGRESS appointments for doctorId + date
5. Remove booked slots from generated slots
6. Return available slots as string[] e.g. ["09:00","09:30","10:30"]

checkConflict(tenantId, doctorId, date, startTime, endTime, excludeId?):
- Query appointments overlapping the time window
- Exclude own ID when checking for reschedule
- Returns boolean

getNextTokenNumber(tenantId, doctorId, date):
- Find max tokenNumber for doctorId + date
- Return max + 1 (start from 1)

createAppointment:
- Validate conflict first → throw ConflictException if conflict
- Assign tokenNumber
- Create and return appointment

updateAppointmentStatus(id, tenantId, status):
- Allowed transitions:
  SCHEDULED → CONFIRMED, CANCELLED, NO_SHOW
  CONFIRMED → IN_PROGRESS, CANCELLED, NO_SHOW
  IN_PROGRESS → COMPLETED
  RESCHEDULED is set only during reschedule flow
- Throw BadRequestException for invalid transitions

rescheduleAppointment(id, tenantId, { newDate, newStartTime, newDoctorId? }):
- Check conflict on new slot
- Set old appointment status = RESCHEDULED
- Create new appointment with rescheduledFrom = old._id
- Return new appointment

--- Endpoints ---

POST /appointments
- Body: { patientId, doctorId, chairId, date, startTime, procedures, type, chiefComplaint, notes }
- Auto-calculate endTime based on doctor's consultationDuration
- Auto-assign tokenNumber
- Conflict check before creating

GET /appointments
- Query params: date?, doctorId?, status?, patientId?, from?, to?, page, limit
- Returns paginated list with patient and doctor populated

GET /appointments/today
- Returns today's appointments grouped by doctor
- { doctors: [{ doctorId, doctorName, color, appointments: [...] }] }

GET /appointments/slots
- Query: doctorId (required), date (required)
- Returns: { available: string[], booked: string[], leaveBlocked: boolean }

GET /appointments/:id
- Populate: patientId (name, phone, patientId), doctorId (name, role), createdBy

PATCH /appointments/:id
- Update notes, chiefComplaint, procedures, chairId
- Status changes must use PATCH /appointments/:id/status

PATCH /appointments/:id/status
- Body: { status, cancelledReason? }
- Apply transition rules

POST /appointments/:id/reschedule
- Body: { newDate, newStartTime, newDoctorId? }

DELETE /appointments/:id
- Soft delete: set status = CANCELLED, cancelledAt = now

POST /appointments/doctor-leave
- Body: { doctorId, date, reason }
- ADMIN only
- Check no existing appointments for that doctor+date → warn but allow

GET /appointments/doctor-leave
- Query: doctorId?, month?, year?
- Returns list of leave dates

DELETE /appointments/doctor-leave/:id
- ADMIN only

=== PATIENTS MODULE ===
Location: src/modules/patients/

--- Schemas ---

Patient Schema (collection: patients):
- _id
- tenantId: ObjectId (required, indexed)
- patientId: string (unique per tenant) — format: "LDC-2024-0001"
  (LDC = first 3 letters of clinic slug, auto-generated on create)
- name: string (required)
- phone: string (required)
- email: string
- dateOfBirth: Date
- age: number (virtual or stored, calculate from DOB)
- gender: enum ['MALE', 'FEMALE', 'OTHER']
- address: { street: string, city: string, pincode: string }
- bloodGroup: enum ['A+','A-','B+','B-','AB+','AB-','O+','O-','UNKNOWN']
- allergies: string[] — ["Penicillin", "Latex"]
- medicalHistory: string — free text for conditions
- currentMedications: string
- abhaId: string — India health stack ID
- emergencyContact: { name: string, phone: string, relation: string }
- isActive: boolean default true
- firstVisit: Date — auto-set on creation
- lastVisit: Date — updated externally when appointment completed
- totalVisits: number default 0
- whatsappOptIn: boolean default true
- referredBy: string — "Google", "Friend", doctor name
- notes: string — general admin notes
- createdBy: ObjectId ref User
- createdAt, updatedAt

Indexes:
{ tenantId: 1, phone: 1 } unique compound
{ tenantId: 1, patientId: 1 } unique compound
{ tenantId: 1, name: 'text' } — text search index

ClinicalNote Schema (collection: clinical_notes):
- _id
- tenantId: ObjectId (required, indexed)
- patientId: ObjectId ref Patient (required)
- appointmentId: ObjectId ref Appointment (optional)
- doctorId: ObjectId ref User (required)
- visitDate: Date (required)
- chiefComplaint: string
- clinicalFindings: string
- diagnosis: string
- treatmentDone: string
- treatmentPlan: string — future planned procedures
- prescriptions: [{
    medicine: string,
    dosage: string,
    frequency: string,
    duration: string,
    instructions: string
  }]
- toothChart: Object — free-form JSON for per-tooth notes
  Example: { "11": "caries", "36": "root canal done", "21": "crown" }
- followUpInDays: number
- attachments: string[] — GCS file URLs
- createdAt, updatedAt

Indexes: { tenantId: 1, patientId: 1 }, { tenantId: 1, doctorId: 1 }

PatientDocument Schema (collection: patient_documents):
- _id
- tenantId: ObjectId (required)
- patientId: ObjectId ref Patient (required)
- appointmentId: ObjectId ref Appointment (optional)
- fileName: string
- fileType: enum ['XRAY', 'REPORT', 'PRESCRIPTION', 'CONSENT', 'PHOTO', 'OTHER']
- filePath: string — GCS path (for signed URL generation)
- fileUrl: string — GCS public/CDN URL
- fileSize: number — bytes
- mimeType: string
- uploadedBy: ObjectId ref User
- notes: string
- createdAt

Indexes: { tenantId: 1, patientId: 1 }

--- Business Logic ---

Auto-generate patientId:
- Get tenant slug (first 3 chars uppercase, e.g. "LAL")
- Get current year
- Count existing patients for tenant → pad to 4 digits
- Format: "LAL-2024-0001"

findOrCreateByPhone(tenantId, phone, name):
- Used by WhatsApp module (Person 4 will call this)
- Find patient by tenantId + phone
- If not found, create minimal patient record with name + phone
- Return patient

searchPatients(tenantId, query):
- Search by: name (partial, case-insensitive), phone (partial), patientId (exact)
- Use MongoDB text index OR $regex
- Return paginated results

--- Endpoints ---

POST /patients
- Body: full patient registration form
- Auto-generate patientId
- Set firstVisit = today

GET /patients
- Query: search? (name/phone/id), page, limit
- Returns paginated list with: patientId, name, phone, lastVisit, totalVisits, pendingBalance (0 for now — Person 3 billing will update)

GET /patients/:id
- Full patient object

PATCH /patients/:id
- Update any patient field except tenantId, patientId

DELETE /patients/:id
- Soft delete: isActive = false

GET /patients/:id/appointments
- All appointments for patient, newest first
- Populate: doctorId (name), chairId, status, date, tokenNumber

GET /patients/:id/notes
- All clinical notes, newest first
- Populate: doctorId (name), appointmentId

POST /patients/:id/notes
- Create clinical note
- Body: { appointmentId?, visitDate, chiefComplaint, clinicalFindings, 
          diagnosis, treatmentDone, treatmentPlan, prescriptions, toothChart, 
          followUpInDays, attachments }
- DOCTOR or ADMIN role only

PATCH /patients/:id/notes/:noteId
- Update clinical note
- DOCTOR who created it or ADMIN only

GET /patients/:id/documents
- List all documents for patient
- Include signed URL for each (call StorageService.getSignedUrl)

POST /patients/:id/documents
- Body: { filePath, fileName, fileType, fileSize, mimeType, appointmentId?, notes }
- File is already uploaded via /storage/upload — this just saves metadata

DELETE /patients/:id/documents/:docId
- Soft delete (or hard delete + remove from GCS)

GET /patients/search
- Query: q (search string)
- Fast search endpoint for autocomplete
- Return top 10 matches: { _id, patientId, name, phone, lastVisit }
- Used by frontend dropdowns in appointment and billing forms

=== CODING STANDARDS ===
- TypeScript strict, no `any`
- All shared imports from '../../common' (JwtAuthGuard, RolesGuard, Roles, Role, PaginationDto)
- Import User type from '../users/user.schema' — do not redefine it
- Do NOT import from billing/ inventory/ whatsapp/ — those don't exist yet in your branch
- Mongoose: always filter with tenantId first in every query
- Services: always first param is tenantId
- Paginated endpoints use PaginationDto from common
- All responses use standard format via transform interceptor (already set up by Person 1)
- At end of your work, add to app.module.ts:
  // Person 2 modules - Clinical
  StorageModule,
  AppointmentsModule,
  PatientsModule,

Write MODULES.md documenting:
- What each module does
- All endpoints with method, path, auth role, description
- What you export for other modules to use
- Dependencies: what you import from Person 1