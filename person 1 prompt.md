🤖 PERSON 1 — AI PROMPT
You are building the FOUNDATION layer of a production-grade multi-tenant 
Dental Clinic SaaS backend using NestJS and MongoDB.

⚠️ IMPORTANT CONTEXT — READ BEFORE WRITING ANY CODE:
This project is being built by 4 developers in parallel, each owning 
separate NestJS modules. Your job is to build the foundation that the 
other 3 developers will plug their modules into. Every decision you make 
here (folder structure, naming conventions, base schemas, shared utilities, 
module boundaries) will be used by:
- Person 2: who builds appointments/ and patients/ modules
- Person 3: who builds billing/ inventory/ reports/ modules  
- Person 4: who builds whatsapp/ and ai/ modules

So build everything with clean module interfaces. Each module must be 
self-contained. app.module.ts must be structured so other modules 
can be imported with a single line. No circular dependencies.

=== YOUR MODULES TO BUILD ===
1. NestJS project scaffold (full structure)
2. Database connection module
3. Tenant module (clinic registration + settings)
4. Auth module (JWT login + user management)
5. Users module (user CRUD + role management)
6. Common/ directory (all shared code)
7. Docker setup (Dockerfile + docker-compose)
8. README.md

=== TECH STACK ===
- NestJS 10 (TypeScript strict mode)
- Mongoose (MongoDB ODM)
- @nestjs/jwt + passport-jwt
- @nestjs/config
- @nestjs/swagger
- class-validator + class-transformer
- bcrypt for password hashing

Install command:
npm install @nestjs/mongoose mongoose @nestjs/jwt @nestjs/passport 
passport passport-jwt @nestjs/config @nestjs/swagger swagger-ui-express 
class-validator class-transformer bcrypt uuid
npm install -D @types/bcrypt @types/passport-jwt @types/uuid

=== COMPLETE FOLDER STRUCTURE TO CREATE ===

dental-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── constants/
│   │   │   ├── roles.constant.ts        # ADMIN, DOCTOR, RECEPTIONIST
│   │   │   └── status.constant.ts       # shared status enums
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts       # @Roles('ADMIN')
│   │   │   ├── tenant.decorator.ts      # @GetTenant() 
│   │   │   └── current-user.decorator.ts # @CurrentUser()
│   │   ├── dto/
│   │   │   └── pagination.dto.ts        # shared PaginationDto + PaginatedResult<T>
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts  # wraps all responses in { success, data, message }
│   │   ├── middleware/
│   │   │   └── tenant.middleware.ts
│   │   └── types/
│   │       └── express.d.ts             # extend Request with tenantId, user
│   ├── config/
│   │   └── configuration.ts
│   └── modules/
│       ├── database/
│       │   └── database.module.ts       # MongooseModule.forRootAsync
│       ├── tenant/
│       │   ├── tenant.module.ts
│       │   ├── tenant.controller.ts
│       │   ├── tenant.service.ts
│       │   ├── tenant.schema.ts
│       │   └── dto/
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts
│       │   └── dto/
│       └── users/
│           ├── users.module.ts
│           ├── users.controller.ts
│           ├── users.service.ts
│           ├── user.schema.ts
│           └── dto/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── nest-cli.json
├── tsconfig.json
└── README.md

=== DETAILED SCHEMAS ===

--- Tenant Schema ---
Collection: tenants
Fields:
- _id: ObjectId
- name: string (required) — "Lalitha Dental Clinic"
- slug: string (unique, auto-generated from name) — "lalitha-dental-clinic"
- email: string (unique)
- phone: string
- address: {
    street: string,
    city: string,
    state: string,
    pincode: string
  }
- plan: enum ['FREE', 'BASIC', 'PRO'] default 'FREE'
- isActive: boolean default true
- settings: {
    workingHours: { start: string, end: string } default { start: "09:00", end: "20:00" }
    workingDays: number[] default [1,2,3,4,5,6] (Mon-Sat, 0=Sunday)
    appointmentDuration: number default 30 (minutes)
    timezone: string default "Asia/Kolkata"
    currency: string default "INR"
    gstNumber: string
    clinicLogo: string (GCS URL)
  }
- whatsappPhoneNumberId: string — the Meta WA business number ID mapped to this clinic
- createdAt, updatedAt (timestamps: true)

Indexes: { slug: 1 } unique, { email: 1 } unique

--- User Schema ---
Collection: users
Fields:
- _id: ObjectId
- tenantId: ObjectId (required, ref: 'Tenant', indexed)
- name: string (required)
- email: string (required)
- phone: string
- passwordHash: string (required, select: false)
- role: enum ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] (required)
- isActive: boolean default true
- doctorProfile: {           # only populated when role = DOCTOR
    specialization: string,
    registrationNumber: string,
    consultationDuration: number default 30,
    availableChairs: string[],  # e.g. ['CHAIR-1', 'CHAIR-2']
    color: string               # hex color for calendar display
  }
- lastLogin: Date
- createdBy: ObjectId (ref: 'User')
- createdAt, updatedAt (timestamps: true)

Indexes: 
{ tenantId: 1, email: 1 } unique compound
{ tenantId: 1, role: 1 }

=== AUTH LOGIC ===

POST /auth/register
- Creates first ADMIN user for a tenant
- Body: { tenantId, name, email, password, phone }
- Hash password with bcrypt (rounds: 12)
- Return: { token, user }

POST /auth/login
- Body: { email, password, tenantId }
- Verify password with bcrypt.compare
- Return JWT token
- JWT Payload: { sub: userId, tenantId: string, role: string, email: string, name: string }
- Update lastLogin

GET /auth/me
- JwtAuthGuard protected
- Return current user (no passwordHash)

POST /auth/create-user
- Roles: ADMIN only
- Creates DOCTOR or RECEPTIONIST under same tenantId
- Body: { name, email, password, phone, role, doctorProfile? }

PATCH /auth/change-password
- Body: { currentPassword, newPassword }
- Verify current, hash new, update

POST /auth/refresh
- Refresh token mechanism (optional, implement if time allows)

=== USERS MODULE ===

GET /users
- ADMIN only
- Return all users for tenantId
- Include doctor profiles

GET /users/:id
- Return user by ID (must match tenantId)

PATCH /users/:id
- ADMIN only
- Update name, phone, role, isActive, doctorProfile
- Cannot change tenantId

DELETE /users/:id (soft delete)
- ADMIN only
- Set isActive = false

GET /users/doctors
- Return only DOCTOR role users for the tenant
- Used by Person 2 (appointments) and Person 4 (frontend dropdowns)

=== TENANT MODULE ===

POST /tenants
- Public endpoint (clinic onboarding)
- Creates tenant + first admin user in one transaction
- Body: { clinicName, email, phone, address, adminName, adminPassword }
- Auto-generate slug from clinicName
- Return: { tenant, token }

GET /tenants/:id
- ADMIN only, must match tenantId from JWT
- Return full tenant with settings

PATCH /tenants/:id
- ADMIN only
- Update settings (working hours, days, appointment duration, GST etc.)

GET /tenants/:id/chairs
- Return configured chairs from settings
- Default: ['CHAIR-1', 'CHAIR-2', 'CHAIR-3']

POST /tenants/:id/chairs
- Add or update chair list

=== COMMON UTILITIES TO BUILD ===

1. PaginationDto (src/common/dto/pagination.dto.ts):
class PaginationDto {
  page: number (default 1, min 1)
  limit: number (default 20, min 1, max 100)
}
PaginatedResult<T> interface:
{
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
Export this — Person 2 and 3 will import it.

2. Transform Interceptor:
Wrap ALL successful responses in:
{
  success: true,
  data: <actual data>,
  message: "Success",
  timestamp: ISO string
}

3. HTTP Exception Filter:
Wrap ALL error responses in:
{
  success: false,
  error: {
    statusCode: number,
    message: string,
    details?: any
  },
  timestamp: ISO string
}

4. Logging Interceptor:
Log: [METHOD] /path - tenantId: xxx - userId: xxx - 200 - 45ms
Use NestJS Logger.

5. Tenant Middleware:
- For routes that are not public: extract tenantId from JWT
- Attach to req.tenantId
- All services receive tenantId as parameter — never query without it

6. Express type extension (src/common/types/express.d.ts):
declare global {
  namespace Express {
    interface Request {
      tenantId: string
      user: {
        sub: string
        tenantId: string
        role: string
        email: string
        name: string
      }
    }
  }
}

7. Roles constant (src/common/constants/roles.constant.ts):
export enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST'
}

Export everything from common/index.ts so other modules import cleanly:
import { JwtAuthGuard, RolesGuard, Roles, Role, PaginationDto } from '../../common'

=== APP MODULE STRUCTURE ===

app.module.ts must be clean and scalable:
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,          // Person 1
    TenantModule,            // Person 1
    AuthModule,              // Person 1
    UsersModule,             // Person 1
    // Person 2 will add: AppointmentsModule, PatientsModule, StorageModule
    // Person 3 will add: BillingModule, InventoryModule, ReportsModule  
    // Person 4 will add: WhatsAppModule, AiModule
  ]
})

Add a clear comment block above the imports explaining the module ownership structure. 
This helps the AI tools of other developers understand where to add their modules.

=== SWAGGER SETUP ===

In main.ts:
- Enable swagger at /api/docs
- Title: "Dental Clinic SaaS API"
- Version: "1.0.0"
- BearerAuth setup
- All controllers tagged by module name

=== DOCKER SETUP ===

Dockerfile (multi-stage):
Stage 1 (builder): node:20-alpine → install all deps → build
Stage 2 (runner): node:20-alpine → copy dist + node_modules → EXPOSE 3001 → CMD

docker-compose.yml (local dev):
services:
  api:
    build: .
    ports: "3001:3001"
    env_file: .env
    depends_on: [mongo, redis]
    volumes: ./gcp-key.json:/app/gcp-key.json
  
  mongo:
    image: mongo:7
    ports: "27017:27017"
    volumes: mongo-data:/data/db
    (fallback if Atlas not configured)
  
  redis:
    image: redis:7-alpine
    ports: "6379:6379"

volumes: mongo-data

=== CODING STANDARDS ===
- TypeScript strict: true — no `any` anywhere
- All business logic in Service, never in Controller
- Controller only: parse request → call service → return response
- DTOs for every request body and response
- class-validator decorators on all DTO fields
- @ApiProperty on all DTO fields (swagger)
- Mongoose schemas: always define indexes explicitly
- Services: first param is always tenantId for any data operation
- Use NestJS Logger (not console.log)
- All async functions properly awaited
- Handle Mongoose duplicate key errors (code 11000) with ConflictException
- README.md must include: setup steps, env vars explained, API overview table

=== README.md TO GENERATE ===
Include:
- Project overview
- Prerequisites
- Installation steps
- Running locally (with and without Docker)
- Environment variables table with descriptions
- Module structure diagram
- API endpoints overview
- Note: "This is the foundation module. Person 2 owns appointments/ and patients/. 
  Person 3 owns billing/ inventory/ reports/. Person 4 owns whatsapp/ and ai/."

=== DELIVERABLE ===
Complete, runnable NestJS backend foundation.
`npm run start:dev` must work.
`docker-compose up` must work.
Zero TypeScript errors.
All endpoints returning correct response format.