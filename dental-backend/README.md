# 🦷 Dental Clinic SaaS - Foundation Layer (Person 1)

### 🤖 AGENT INSTRUCTIONS (READ FIRST)
You are acting as **Person 1 (Lead Architect)**. Your goal is to build the foundation of a multi-tenant NestJS backend.
1. **Initialize** a new NestJS 10 project in the current directory.
2. **Install** all dependencies listed in the Tech Stack.
3. **Check Prerequisites**: Ensure Node.js and NestJS CLI are available locally.
4. **Implement** the folder structure and all code for Modules 1-8 (Excluding Docker).
5. **Enforce Isolation**: Every database query MUST be scoped by `tenantId`.

---

### 🛠 TECH STACK & INSTALLATION
**Execute these commands first:**
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/config @nestjs/swagger swagger-ui-express class-validator class-transformer bcrypt uuid slugify helmet compression @prisma/client
npm install -D prisma @types/bcrypt @types/passport-jwt @types/uuid.

ARCHITECTURE & CODING STANDARDS:

​Global Prefix: All routes must start with /api/v1.
​Security: Use helmet and compression in main.ts.
​Multi-Tenancy: Data isolation is handled via a tenantId field in every schema.
​Base Service: Create src/common/base/base.service.ts. All services must extend this to ensure they receive tenantId as the first argument for any CRUD operation.
​Strict Types: No usage of any. Use .lean() for read queries.

FOLDER STRUCTURE TO GENERATE:

src/
├── main.ts                      # Swagger, Helmet, Global Prefix
├── app.module.ts                # Import Database, Tenant, Auth, Users
├── common/
│   ├── base/
│   │   └── base.service.ts      # Abstract class for Tenant-aware CRUD
│   ├── constants/               # Role { ADMIN, DOCTOR, RECEPTIONIST }
│   ├── decorators/              # @Roles, @GetTenant, @CurrentUser
│   ├── dto/                     # PaginationDto, PaginatedResult<T>
│   ├── filters/                 # Global HttpExceptionFilter
│   ├── guards/                  # JwtAuthGuard, RolesGuard
│   ├── interceptors/            # TransformInterceptor (wraps responses)
│   ├── middleware/              # TenantMiddleware (extracts tenantId)
│   └── types/                   # express.d.ts (extends Request)
├── config/                      # configuration.ts (Env mapping)
└── modules/
    ├── database/                # Prisma service and client
    ├── tenant/                  # Registration, Settings, Slugify logic
    ├── auth/                    # JWT Strategy, Login, Register
    └── users/                   # CRUD for Clinic Staff

SCHEMAS & LOGIC DETAILS:

​1. Tenant Schema (Table: Tenant)
​name, slug (auto-generated via slugify), plan (FREE, BASIC, PRO), isActive.
​settings: workingHours, workingDays, appointmentDuration, currency.
​2. User Schema (Table: User)
​tenantId (String, Ref: Tenant, Indexed).
​role (Enum), passwordHash (select: false).
​doctorProfile: Only for DOCTOR role (specialization, registrationNumber).
​3. Auth Logic
​POST /auth/register: Create a Tenant AND the first ADMIN user in one flow.
​POST /auth/login: Issue JWT with payload: { sub, tenantId, role, email }.

LOCAL DEVELOPMENT SETUP:

​Database: Ensure you have a PostgreSQL instance running either locally or via Supabase (as configured in Prisma schema).
​Environment: Create a .env file with DATABASE_URL, JWT_SECRET, and PORT=3001.
​Swagger: Available at http://localhost:3001/api/docs once the server starts.