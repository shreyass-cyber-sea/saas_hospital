dental-backend/
│
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 tsconfig.json
├── 📄 tsconfig.build.json
├── 📄 nest-cli.json
├── 📄 .env
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 Dockerfile
├── 📄 docker-compose.yml
├── 📄 gcp-key.json                          ← GCP service account (gitignored)
├── 📄 README.md
├── 📄 MODULES.md
│
└── src/
    │
    ├── 📄 main.ts
    ├── 📄 app.module.ts
    │
    ├── config/                               ← PERSON 1
    │   └── 📄 configuration.ts
    │
    ├── common/                               ← PERSON 1 (shared by all)
    │   │
    │   ├── constants/
    │   │   ├── 📄 roles.constant.ts
    │   │   └── 📄 status.constant.ts
    │   │
    │   ├── decorators/
    │   │   ├── 📄 roles.decorator.ts
    │   │   ├── 📄 tenant.decorator.ts
    │   │   └── 📄 current-user.decorator.ts
    │   │
    │   ├── dto/
    │   │   └── 📄 pagination.dto.ts
    │   │
    │   ├── filters/
    │   │   └── 📄 http-exception.filter.ts
    │   │
    │   ├── guards/
    │   │   ├── 📄 jwt-auth.guard.ts
    │   │   └── 📄 roles.guard.ts
    │   │
    │   ├── interceptors/
    │   │   ├── 📄 logging.interceptor.ts
    │   │   └── 📄 transform.interceptor.ts
    │   │
    │   ├── middleware/
    │   │   └── 📄 tenant.middleware.ts
    │   │
    │   ├── types/
    │   │   └── 📄 express.d.ts
    │   │
    │   └── 📄 index.ts                       ← barrel export for all common
    │
    └── modules/
        │
        ├── database/                         ← PERSON 1
        │   └── 📄 database.module.ts
        │
        │
        │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │  PERSON 1 — Auth + Tenant + Users
        │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │
        ├── auth/
        │   ├── 📄 auth.module.ts
        │   ├── 📄 auth.controller.ts
        │   ├── 📄 auth.service.ts
        │   ├── strategies/
        │   │   └── 📄 jwt.strategy.ts
        │   └── dto/
        │       ├── 📄 login.dto.ts
        │       ├── 📄 register.dto.ts
        │       ├── 📄 create-user.dto.ts
        │       └── 📄 change-password.dto.ts
        │
        ├── tenant/
        │   ├── 📄 tenant.module.ts
        │   ├── 📄 tenant.controller.ts
        │   ├── 📄 tenant.service.ts
        │   ├── 📄 tenant.schema.ts
        │   └── dto/
        │       ├── 📄 create-tenant.dto.ts
        │       └── 📄 update-tenant.dto.ts
        │
        ├── users/
        │   ├── 📄 users.module.ts
        │   ├── 📄 users.controller.ts
        │   ├── 📄 users.service.ts
        │   ├── 📄 user.schema.ts
        │   └── dto/
        │       ├── 📄 create-user.dto.ts
        │       └── 📄 update-user.dto.ts
        │
        │
        │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │  PERSON 2 — Appointments + Patients + Storage
        │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │
        ├── storage/
        │   ├── 📄 storage.module.ts
        │   ├── 📄 storage.controller.ts
        │   ├── 📄 storage.service.ts
        │   └── dto/
        │       └── 📄 upload-file.dto.ts
        │
        ├── appointments/
        │   ├── 📄 appointments.module.ts
        │   ├── 📄 appointments.controller.ts
        │   ├── 📄 appointments.service.ts
        │   ├── 📄 appointment.schema.ts
        │   ├── 📄 doctor-leave.schema.ts
        │   ├── helpers/
        │   │   ├── 📄 slot-generator.helper.ts
        │   │   └── 📄 conflict-checker.helper.ts
        │   └── dto/
        │       ├── 📄 create-appointment.dto.ts
        │       ├── 📄 update-appointment.dto.ts
        │       ├── 📄 reschedule-appointment.dto.ts
        │       ├── 📄 update-status.dto.ts
        │       ├── 📄 get-slots.dto.ts
        │       └── 📄 create-leave.dto.ts
        │
        ├── patients/
        │   ├── 📄 patients.module.ts
        │   ├── 📄 patients.controller.ts
        │   ├── 📄 patients.service.ts
        │   ├── 📄 patient.schema.ts
        │   ├── 📄 clinical-note.schema.ts
        │   ├── 📄 patient-document.schema.ts
        │   └── dto/
        │       ├── 📄 create-patient.dto.ts
        │       ├── 📄 update-patient.dto.ts
        │       ├── 📄 create-clinical-note.dto.ts
        │       ├── 📄 update-clinical-note.dto.ts
        │       └── 📄 create-document.dto.ts
        │
        │
        │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │  PERSON 3 — Billing + Inventory + Reports
        │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │
        ├── billing/
        │   ├── 📄 billing.module.ts
        │   ├── 📄 billing.controller.ts
        │   ├── 📄 billing.service.ts
        │   ├── 📄 invoice.schema.ts
        │   ├── 📄 procedure.schema.ts
        │   ├── 📄 advance-payment.schema.ts
        │   ├── helpers/
        │   │   ├── 📄 invoice-calculator.helper.ts
        │   │   ├── 📄 invoice-number.helper.ts
        │   │   ├── 📄 pdf-generator.helper.ts
        │   │   └── 📄 gcs-upload.helper.ts   ← temp (replaced at merge)
        │   ├── interfaces/
        │   │   ├── 📄 patient-ref.interface.ts  ← stub (replaced at merge)
        │   │   └── 📄 appointment-ref.interface.ts ← stub (replaced at merge)
        │   └── dto/
        │       ├── 📄 create-procedure.dto.ts
        │       ├── 📄 update-procedure.dto.ts
        │       ├── 📄 create-invoice.dto.ts
        │       ├── 📄 update-invoice.dto.ts
        │       ├── 📄 record-payment.dto.ts
        │       ├── 📄 cancel-invoice.dto.ts
        │       ├── 📄 refund-invoice.dto.ts
        │       └── 📄 create-advance.dto.ts
        │
        ├── inventory/
        │   ├── 📄 inventory.module.ts
        │   ├── 📄 inventory.controller.ts
        │   ├── 📄 inventory.service.ts
        │   ├── 📄 inventory-item.schema.ts
        │   ├── 📄 stock-transaction.schema.ts
        │   ├── 📄 lab-case.schema.ts
        │   └── dto/
        │       ├── 📄 create-inventory-item.dto.ts
        │       ├── 📄 update-inventory-item.dto.ts
        │       ├── 📄 create-transaction.dto.ts
        │       ├── 📄 create-lab-case.dto.ts
        │       └── 📄 update-lab-case.dto.ts
        │
        ├── reports/
        │   ├── 📄 reports.module.ts
        │   ├── 📄 reports.controller.ts
        │   ├── 📄 reports.service.ts
        │   ├── pipelines/
        │   │   ├── 📄 revenue-daily.pipeline.ts
        │   │   ├── 📄 revenue-monthly.pipeline.ts
        │   │   ├── 📄 revenue-doctor.pipeline.ts
        │   │   ├── 📄 appointment-summary.pipeline.ts
        │   │   ├── 📄 patient-growth.pipeline.ts
        │   │   ├── 📄 pending-payments.pipeline.ts
        │   │   ├── 📄 inventory-expenses.pipeline.ts
        │   │   └── 📄 chair-utilization.pipeline.ts
        │   └── dto/
        │       └── 📄 date-range.dto.ts
        │
        │
        │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │  PERSON 4 — WhatsApp + AI (backend)
        │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │
        ├── whatsapp/
        │   ├── 📄 whatsapp.module.ts
        │   ├── 📄 whatsapp.controller.ts
        │   ├── 📄 whatsapp.service.ts
        │   ├── 📄 whatsapp-session.schema.ts
        │   ├── 📄 whatsapp-phone-mapping.schema.ts
        │   ├── flows/
        │   │   ├── 📄 booking.flow.ts
        │   │   ├── 📄 cancel.flow.ts
        │   │   ├── 📄 my-appointments.flow.ts
        │   │   └── 📄 menu.flow.ts
        │   ├── jobs/
        │   │   ├── 📄 reminder.job.ts
        │   │   └── 📄 no-show-recovery.job.ts
        │   ├── utils/
        │   │   ├── 📄 wa-sender.util.ts
        │   │   └── 📄 date-parser.util.ts
        │   └── dto/
        │       ├── 📄 webhook-payload.dto.ts
        │       └── 📄 phone-mapping.dto.ts
        │
        └── ai/
            ├── 📄 ai.module.ts
            ├── 📄 ai.controller.ts
            ├── 📄 ai.service.ts
            └── dto/
                ├── 📄 patient-summary.dto.ts
                └── 📄 chat-test.dto.ts




dental-frontend/
│
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 tsconfig.json
├── 📄 next.config.ts
├── 📄 tailwind.config.ts
├── 📄 postcss.config.js
├── 📄 components.json                        ← shadcn config
├── 📄 .env.local
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 middleware.ts
├── 📄 FRONTEND.md
├── 📄 WHATSAPP.md
│
├── public/
│   ├── 🖼 logo.svg
│   ├── 🖼 logo-dark.svg
│   └── 🖼 favicon.ico
│
├── app/
│   │
│   ├── 📄 globals.css
│   ├── 📄 layout.tsx                         ← root: QueryProvider, ThemeProvider, Toaster
│   │
│   ├── (auth)/
│   │   ├── 📄 layout.tsx                     ← centered card layout
│   │   └── login/
│   │       └── 📄 page.tsx
│   │
│   └── (dashboard)/
│       │
│       ├── 📄 layout.tsx                     ← sidebar + header shell
│       │
│       ├── dashboard/
│       │   └── 📄 page.tsx
│       │
│       ├── appointments/
│       │   ├── 📄 page.tsx                   ← calendar + list view
│       │   └── [id]/
│       │       └── 📄 page.tsx               ← appointment detail
│       │
│       ├── patients/
│       │   ├── 📄 page.tsx                   ← patient list + search
│       │   ├── new/
│       │   │   └── 📄 page.tsx               ← registration form
│       │   └── [id]/
│       │       ├── 📄 page.tsx               ← patient profile (5 tabs)
│       │       └── notes/
│       │           └── 📄 page.tsx
│       │
│       ├── billing/
│       │   ├── 📄 page.tsx                   ← invoice list
│       │   ├── new/
│       │   │   └── 📄 page.tsx               ← create invoice
│       │   └── [id]/
│       │       └── 📄 page.tsx               ← invoice detail + payment
│       │
│       ├── inventory/
│       │   ├── 📄 page.tsx                   ← stock items
│       │   └── lab-cases/
│       │       └── 📄 page.tsx               ← lab cases
│       │
│       ├── reports/
│       │   └── 📄 page.tsx                   ← all reports (4 tabs)
│       │
│       └── settings/
│           └── 📄 page.tsx                   ← clinic + team + procedures + chairs
│
│
├── components/
│   │
│   ├── ui/                                   ← shadcn auto-generated (DO NOT EDIT)
│   │   ├── 📄 button.tsx
│   │   ├── 📄 input.tsx
│   │   ├── 📄 label.tsx
│   │   ├── 📄 card.tsx
│   │   ├── 📄 table.tsx
│   │   ├── 📄 badge.tsx
│   │   ├── 📄 dialog.tsx
│   │   ├── 📄 sheet.tsx
│   │   ├── 📄 calendar.tsx
│   │   ├── 📄 select.tsx
│   │   ├── 📄 textarea.tsx
│   │   ├── 📄 form.tsx
│   │   ├── 📄 toast.tsx
│   │   ├── 📄 toaster.tsx
│   │   ├── 📄 avatar.tsx
│   │   ├── 📄 dropdown-menu.tsx
│   │   ├── 📄 tabs.tsx
│   │   ├── 📄 progress.tsx
│   │   ├── 📄 skeleton.tsx
│   │   ├── 📄 alert.tsx
│   │   ├── 📄 separator.tsx
│   │   └── 📄 scroll-area.tsx
│   │
│   ├── layout/
│   │   ├── 📄 Sidebar.tsx
│   │   ├── 📄 Header.tsx
│   │   ├── 📄 MobileSidebar.tsx
│   │   └── 📄 PageWrapper.tsx
│   │
│   ├── appointments/
│   │   ├── 📄 AppointmentCalendar.tsx        ← react-big-calendar wrapper
│   │   ├── 📄 AppointmentForm.tsx            ← new appointment slide-over
│   │   ├── 📄 AppointmentCard.tsx
│   │   ├── 📄 AppointmentDetailSheet.tsx
│   │   ├── 📄 SlotPicker.tsx                 ← time slot chips
│   │   ├── 📄 AppointmentStatusBadge.tsx
│   │   ├── 📄 TodayAppointmentList.tsx       ← dashboard widget
│   │   └── 📄 StatusUpdateButtons.tsx
│   │
│   ├── patients/
│   │   ├── 📄 PatientSearch.tsx              ← autocomplete input
│   │   ├── 📄 PatientForm.tsx                ← full registration form
│   │   ├── 📄 PatientProfileHeader.tsx
│   │   ├── 📄 PatientHistory.tsx             ← visit timeline
│   │   ├── 📄 ClinicalNoteForm.tsx           ← add note slide-over
│   │   ├── 📄 ClinicalNoteCard.tsx           ← expandable note
│   │   ├── 📄 PatientDocuments.tsx           ← upload + list
│   │   └── 📄 PatientBillingSummary.tsx      ← balance + invoices tab
│   │
│   ├── billing/
│   │   ├── 📄 InvoiceForm.tsx                ← create invoice page form
│   │   ├── 📄 LineItemRow.tsx                ← dynamic line item
│   │   ├── 📄 InvoiceTotals.tsx              ← live totals summary card
│   │   ├── 📄 PaymentModal.tsx               ← record payment dialog
│   │   ├── 📄 InvoiceStatusBadge.tsx
│   │   └── 📄 InvoiceDetailView.tsx
│   │
│   ├── inventory/
│   │   ├── 📄 StockTable.tsx
│   │   ├── 📄 StockItemForm.tsx
│   │   ├── 📄 TransactionModal.tsx           ← usage / purchase modal
│   │   ├── 📄 TransactionHistory.tsx         ← per item history sheet
│   │   └── 📄 LabCaseTable.tsx
│   │
│   ├── reports/
│   │   ├── 📄 DashboardWidgets.tsx           ← 4 stat cards
│   │   ├── 📄 RevenueBarChart.tsx
│   │   ├── 📄 RevenueLineChart.tsx
│   │   ├── 📄 DoctorRevenueChart.tsx
│   │   ├── 📄 AppointmentPieChart.tsx
│   │   ├── 📄 PatientGrowthChart.tsx
│   │   ├── 📄 ChairUtilizationBars.tsx
│   │   ├── 📄 PendingPaymentsTable.tsx
│   │   └── 📄 NoShowTable.tsx
│   │
│   └── shared/
│       ├── 📄 DataTable.tsx                  ← reusable paginated table
│       ├── 📄 SearchInput.tsx                ← debounced search
│       ├── 📄 ConfirmDialog.tsx
│       ├── 📄 FileUpload.tsx                 ← drag-drop upload zone
│       ├── 📄 LoadingSpinner.tsx
│       ├── 📄 EmptyState.tsx
│       ├── 📄 PageHeader.tsx
│       ├── 📄 CurrencyDisplay.tsx            ← ₹ formatted amount
│       ├── 📄 DateRangePicker.tsx
│       └── 📄 TagInput.tsx                   ← for allergies field
│
│
├── lib/
│   │
│   ├── api/
│   │   ├── 📄 client.ts                      ← axios + interceptors
│   │   ├── 📄 auth.api.ts
│   │   ├── 📄 appointments.api.ts
│   │   ├── 📄 patients.api.ts
│   │   ├── 📄 billing.api.ts
│   │   ├── 📄 inventory.api.ts
│   │   └── 📄 reports.api.ts
│   │
│   ├── hooks/
│   │   ├── 📄 useAuth.ts
│   │   ├── 📄 useAppointments.ts
│   │   ├── 📄 usePatients.ts
│   │   ├── 📄 useBilling.ts
│   │   ├── 📄 useInventory.ts
│   │   └── 📄 useReports.ts
│   │
│   ├── stores/
│   │   └── 📄 auth.store.ts                  ← zustand + localStorage persist
│   │
│   ├── providers/
│   │   ├── 📄 QueryProvider.tsx              ← TanStack Query provider
│   │   └── 📄 ThemeProvider.tsx              ← next-themes provider
│   │
│   ├── utils/
│   │   ├── 📄 format.ts                      ← currency, date, phone formatters
│   │   └── 📄 cn.ts                          ← tailwind classnames helper
│   │
│   └── types/
│       └── 📄 index.ts                       ← all TypeScript interfaces
│
└── __mocks__/                                ← Day 1 mock data for offline dev
    ├── 📄 appointments.mock.ts
    ├── 📄 patients.mock.ts
    ├── 📄 billing.mock.ts
    ├── 📄 inventory.mock.ts
    └── 📄 reports.mock.ts


    
