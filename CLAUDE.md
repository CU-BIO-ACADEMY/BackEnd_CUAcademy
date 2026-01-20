# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime & Commands

This project uses **Bun** runtime instead of Node.js.

**Development:**
```bash
bun install           # Install dependencies
bun run dev          # Start dev server with hot reload (port 8000)
```

**Database (Drizzle ORM):**
```bash
bunx drizzle-kit generate    # Generate migrations from schema
bunx drizzle-kit migrate     # Run migrations
bunx drizzle-kit push        # Push schema changes directly
bunx drizzle-kit studio      # Open Drizzle Studio GUI
```

**Testing:**
```bash
bun test             # Run all tests
bun test <file>      # Run specific test file
```

**Bun-specific commands:**
- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bunx <package>` instead of `npx <package>`
- Bun automatically loads .env files

## Architecture Overview

### Tech Stack
- **Runtime:** Bun
- **Framework:** Express.js (TypeScript)
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Google OAuth 2.0
- **Storage:** MinIO (S3-compatible object storage)
- **Validation:** Zod

### Project Structure

```
src/
├── config/              # Environment configuration (Zod validation)
├── lib/
│   ├── drizzle/        # Database schema, relations, DB instance
│   ├── google-auth/    # Google OAuth client setup
│   ├── minio/          # MinIO storage client
│   ├── container.ts    # Dependency injection container
│   ├── error.ts        # Custom error classes & error handler
│   └── http-status.ts  # HTTP status code constants
├── modules/            # Feature modules (domain-driven)
│   ├── user/
│   ├── session/
│   ├── auth/
│   ├── tags/
│   └── activities/
├── routes/             # Express route definitions
├── middlewares/        # Express middlewares
└── index.ts            # Application entry point
```

## Layered Architecture Pattern

This codebase follows **strict layered architecture** with clear separation of concerns:

### Layer Hierarchy (3-tier)

```
Controller Layer (HTTP)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
```

**Critical Rules:**
1. **Controllers** only handle HTTP requests/responses and call Services
2. **Services** contain business logic and MUST call other Services (not Repositories of other modules)
3. **Repositories** handle database operations via Drizzle ORM
4. **Cross-module communication happens ONLY through Services**

### Module Structure Pattern

Each module follows this structure:

```
module-name/
├── module-name.repository.ts    # Interface + Drizzle implementation
├── module-name.service.ts       # Business logic, uses repositories
└── module-name.controller.ts    # HTTP handlers (optional)
```

**Example:**
```typescript
// ✅ CORRECT: Service uses another Service
class UserInterestsService {
    constructor(
        private userInterestsRepository: UserInterestsRepository,
        private tagService: TagService,           // ← Service
        private userService: UserService          // ← Service
    ) {}
}

// ❌ WRONG: Service uses another module's Repository
class UserInterestsService {
    constructor(
        private userInterestsRepository: UserInterestsRepository,
        private tagRepository: TagRepository,     // ❌ Direct repository access
        private userRepository: UserRepository    // ❌ Direct repository access
    ) {}
}
```

## Dependency Injection Container

All services are instantiated in `src/lib/container.ts`:

```typescript
// Repository instances
const userRepository = new DrizzleUserRepository()
const tagRepository = new DrizzleTagRepository()

// Service instances (inject dependencies)
const userService = new UserService(userRepository)
const tagService = new TagService(tagRepository)

// Composed services (inject other services, not repositories)
const userInterestsService = new UserInterestsService(
    userInterestsRepository,
    tagService,      // ← Service dependency
    userService      // ← Service dependency
)

// Controllers
const authController = new AuthController(authService)

// Export ONLY controllers
export { authController }
```

**Rules:**
- Only export **controllers** from container
- Services and repositories are NOT exported (internal to container)
- Follow dependency injection pattern throughout

## Database Schema Architecture

**Schema Location:** `src/lib/drizzle/schema.ts`

All table definitions are centralized in one file. Uses Drizzle ORM with PostgreSQL dialect.

**Key Tables:**
- `usersTable` - User accounts
- `sessionsTable` - User sessions (foreign key to users)
- `tagsTable` - Tags with soft delete (`deleted_at`)
- `userInterestsTable` - Junction table (user ↔ tags)
- `activitiesTable` - Activities/events
- `activityTagsTable` - Junction table (activity ↔ tags)
- `activityImagesTable` - Activity image URLs
- `activityUsersTable` - Activity participants
- `activityHistoryTable` - Activity participation history

### Soft Delete Pattern

Tables with `deleted_at` field use soft delete:

```typescript
// Repository handles soft delete implementation
async delete(id: string): Promise<void> {
    await db.update(tagsTable)
        .set({ deleted_at: new Date() })
        .where(eq(tagsTable.id, id));
}

// Always filter out deleted records in queries
async get(): Promise<GetTagType[]> {
    return db.select()
        .from(tagsTable)
        .where(isNull(tagsTable.deleted_at));
}
```

**Why Repository handles it:** Encapsulation - Services call `repository.delete(id)` without knowing implementation details.

## Junction Tables (Many-to-Many Relationships)

Junction tables are managed by the **owning domain**:

- `userInterestsTable` → Lives in `src/modules/user/` (User owns the relationship)
- `activityTagsTable` → Lives in `src/modules/activities/` (Activity owns the relationship)

The `tags` module only manages tag master data (CRUD), not relationships.

## Error Handling

Custom error classes in `src/lib/error.ts`:

```typescript
throw new NotFoundError("Resource not found")      // 404
throw new BadRequestError("Invalid input")         // 400
throw new UnauthorizedError("Not authenticated")   // 401
throw new ForbiddenError("Access denied")          // 403
throw new ConflictError("Resource already exists") // 409
```

Centralized error handler `handleError(res, error)` handles:
- Zod validation errors → 400
- Custom HttpError → Respective status code
- Unknown errors → 500

## Environment Variables

Validated at startup via Zod schema in `src/config/env.ts`:

```env
DATABASE_URL=postgresql://...
MINIO_ENDPOINT=
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

Validation runs on import - application fails fast if env vars are missing/invalid.

## Authentication Flow

Google OAuth 2.0 implementation:

1. User visits `/api/auth/google` → Redirects to Google consent screen
2. Google redirects back to `/api/auth/google/callback` with auth code
3. Exchange code for tokens → Fetch user profile
4. Create/update user → Create session → Set HTTP-only cookie
5. Cookie name: Defined in `AuthService.COOKIE_NAME`
6. Session TTL: Defined in `AuthService.SESSION_TTL`

**Key files:**
- `src/lib/google-auth/index.ts` - OAuth2 client setup
- `src/modules/auth/auth.service.ts` - Auth business logic
- `src/modules/auth/auth.controller.ts` - Auth HTTP handlers

## Code Style

- No comments unless logic is non-obvious
- TypeScript strict mode
- Use Drizzle's `InferSelectModel` and `InferInsertModel` for types
- Error messages in Thai for user-facing responses
- UUID v7 for all primary keys (via `uuid` package v7() function)
