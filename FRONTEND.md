# DentalCloud Frontend Architecture

This document provides a high-level overview of the `dental-frontend` architecture, design decisions, and component structure for the Dental Clinic SaaS platform.

## 🚀 Tech Stack Highlights

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict typing enforced)
- **Styling**: Tailwind CSS
- **UI Components**: `shadcn/ui` (Radix UI primitives built with Tailwind)
- **State Management**:
  - `zustand`: Used for global client-side state (User Authentication, Theme).
  - *Note*: TanStack Query is planned for server state integration with the backend API.
- **Forms**: React Hook Form combined with `zod` schema validation.
- **Charts**: Recharts (Revenue, Appointment, and Treatment analytics)
- **Icons**: Lucide React

## 📂 Directory Structure

The project follows a standard Next.js App Router structure with encapsulated features:

```
dental-frontend/
├── src/
│   ├── app/                    # Next.js App Router definitions
│   │   ├── (auth)/             # Authentication routes (login, forgot-password)
│   │   ├── (dashboard)/        # Layout wrapped authorized routes
│   │   │   ├── appointments/   # Calendar & list views
│   │   │   ├── patients/       # Directory & profile views
│   │   │   ├── billing/        # Invoices & payments
│   │   │   ├── inventory/      # Stock tracking & lab cases
│   │   │   ├── reports/        # Analytics dashboard
│   │   │   └── settings/       # App configuration
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main redirect entry
│   │
│   ├── components/             # Reusable UI components
│   │   ├── appointments/       # Specific feature components
│   │   ├── auth/               # Login forms
│   │   ├── billing/            # Invoice list, advance payments
│   │   ├── inventory/          # Stock and config tables
│   │   ├── layout/             # Sidebar, Header, PageWrapper
│   │   ├── patients/           # Profile header, history, documents
│   │   ├── reports/            # Dashboard widgets, charts
│   │   ├── settings/           # Config modules
│   │   └── ui/                 # Shadcn base components (buttons, inputs)
│   │
│   ├── lib/                    # Core utilities and configs
│   │   ├── api/                # Axios interceptors & config
│   │   ├── store/              # Zustand global stores (authStore)
│   │   ├── utils/              # Formatting (currency, dates) & generic utils
│   │   └── validation/         # Zod schemas
│   │
│   ├── types/                  # Global TypeScript definitions
│   └── middleware.ts           # Route protection (JWT verification)
```

## 🧩 Key Design Patterns

### 1. The `PageWrapper` Layout Strategy
To ensure maximum consistency across the dashboard, almost every page is wrapped with a custom `PageWrapper` component located at `src/components/layout/PageWrapper.tsx`. 

This wrapper standardizes:
- **Main Headings**: Title and Subtitles.
- **Action Slots**: Adding action buttons (like "New Patient", "Export") aligned properly at the top right.
- **Header Additions**: Allowing custom headers underneath the title via `headerContent`.
- **Responsive Paddings**: Handling mobile layouts smoothly.

### 2. Feature-Based Component Splitting
Logic is deliberately pushed out of the Next.js `page.tsx` routes into the `src/components/{feature}` directory.

*Example*: Instead of writing a massive 500-line patient profile page, `patients/[id]/page.tsx` just orchestrates tabs combining isolated features like `<PatientHistory />`, `<PatientClinicalNotes />`, `<PatientDocuments />`, and `<PatientBillingSummary />`.

### 3. Zod Schema Validation
We use strict client-side validation using `zod`. Forms are bound using `@hookform/resolvers/zod`. This ensures data matches required payload structures before hitting backend endpoints.

### 4. Data Fetching (Mock Data Phase)
Currently, to facilitate rapid UI iterations, components use localized structured MOCK lists (e.g. `const patients = [...]`). Once the API proxy is fully configured, these arrays will be swapped with TanStack Query hooks fetching JSON from our Express server.

### 5. Axios Middleware (`lib/api`)
The default `axios` instance inside `lib/api/axios.ts` employs interceptors. 
- **Request Interceptor**: Injects the Bearer JWT from `localStorage` into every outgoing request automatically.
- **Response Interceptor**: Listens for `401 Unauthorized` responses and forcibly clears the `authStore` to redirect users out gracefully.

## 🎨 Styling & Theming
- Built on a **Teal / Slate / White** theme palette providing a clinical, clean, and modern look.
- **Dark Mode Ready**: Nearly all shadcn primitives support dynamic Tailwind `dark:` variants by default. 

## 🛠️ Upcoming Integration (Phase 7+)
The next immediate step for frontend architecture is dropping in real TanStack query hooks to replace mock arrays.

The backend implementation will serve data for:
- Patient Profiles.
- Appointments fetching & creating.
- Invoicing and Inventory syncing.
