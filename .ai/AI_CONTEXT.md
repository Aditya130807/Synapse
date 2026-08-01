# AI Context

This file acts as the shared context between AI agents working on Synapse.

Every AI agent must read this file before making changes and update it after completing a task.

---

## Current Status

**Project Stage**

Authentication Complete

**Current Branch**

main

**Current Focus**

Ready for database connection and next feature development.

---

## Completed

* GitHub repository created.
* MIT License added.
* Initial README created.
* AI documentation structure established.
* Frontend setup (React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui + React Router + Axios)
* Backend setup (Express + TypeScript + Prisma + PostgreSQL + security middleware + health endpoint)
* Authentication system (signup, login, JWT, protected routes, session persistence, logout)

---

## In Progress

None.

---

## Pending

* Database configuration (connect to a running PostgreSQL instance, run migrations)
* Dashboard
* Chat
* AI Integration
* File Upload
* Settings
* Deployment

---

## Tech Stack

Frontend

* React 19
* TypeScript 6
* Vite 8
* Tailwind CSS v4
* shadcn/ui (new-york style, components: button, input, label, card)
* React Router (react-router-dom v7)
* Axios (with JWT interceptors)
* class-variance-authority, lucide-react, radix-ui (shadcn/ui dependencies)

Backend

* Express 5
* TypeScript 7
* Prisma 6 (User model defined, standard PostgreSQL datasource)
* tsx (dev server with watch mode)
* Helmet (security headers)
* CORS
* Morgan (request logging)
* dotenv
* bcryptjs (password hashing)
* jsonwebtoken (JWT auth)
* zod (request validation)

Database

* PostgreSQL (configured via Prisma 6, requires connection to run migrations)

---

## Architecture Decisions

1. **Separate projects**: Frontend and backend are fully independent npm projects under `app/`. No monorepo tooling — each has its own `package.json`, `tsconfig.json`, and `node_modules`.

2. **Tailwind CSS v4**: Uses the modern `@tailwindcss/vite` plugin instead of PostCSS. CSS entry point is `@import "tailwindcss"` in `src/styles/index.css`.

3. **Absolute imports**: Frontend uses `@/` path alias (configured in both `vite.config.ts` and `tsconfig.app.json`).

4. **shadcn/ui**: Configured via `components.json`. Components installed: button, input, label, card. Add more as needed during feature development.

5. **Prisma 6 Architecture**: Migrated from Prisma 7 pre-release to latest stable Prisma 6 line. Restored declarative `url = env("DATABASE_URL")` in `schema.prisma`. Removed experimental `prisma.config.ts` and driver adapter requirements, allowing `new PrismaClient()` to instantiate cleanly.

6. **Express middleware stack**: Helmet → CORS → JSON/URL parsing → Morgan logger → Routes → Error handler. This ordering ensures security headers are set first and errors are caught last.

7. **Custom error handling**: `ApiError` class for operational errors with status codes. The global error handler returns sanitized messages in production.

8. **Environment config**: Backend uses a centralized `env.ts` module that validates and exports all env vars (PORT, NODE_ENV, CORS_ORIGIN, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN). Frontend uses Vite's `import.meta.env` with `VITE_` prefix.

9. **NodeNext module resolution**: Backend TypeScript uses `NodeNext` module/moduleResolution with `.js` extensions in imports for full ESM compatibility.

10. **React Router**: Uses `createBrowserRouter` with a layout-based route structure (`RootLayout` → child routes). Public routes (`/login`, `/signup`) and protected routes (`/` via `ProtectedRoute`).

11. **Feature-based architecture**: All business logic is organized inside `src/features/<name>/`. Each feature owns its controllers, services, routes, validation, and types. No generic top-level `controllers/`, `services/`, `repositories/`, or `validators/` directories.

12. **Global type augmentation**: Express `req.user` augmentation lives in `src/types/express.d.ts` (application-wide, not feature-specific).

13. **JWT with standard claims**: JWT payload uses the `sub` (subject) claim for user ID. Token is stored in `localStorage` under `synapse_token` key.

14. **Session restoration**: On app startup, the AuthProvider reads the token from localStorage, validates it via `GET /api/auth/me`, and restores or clears the session accordingly.

15. **Axios interceptors**: Request interceptor attaches Bearer token; response interceptor clears invalid tokens on 401 (excluding auth endpoints to avoid loops).

---

## Known Issues

* Backend requires a running PostgreSQL instance. The Prisma migration (`add-user-model`) needs to be run once a database is connected: `npx prisma migrate dev --name add-user-model`.

---

## AI Agent Instructions

Before starting:

* Read PROJECT.md.
* Read ARCHITECTURE.md.
* Read this file.

After completing work:

* Update the Completed, In Progress, and Pending sections.
* List every modified file.
* Mention any dependencies added.
* Record known issues.
* Recommend the next logical task.

---

## Recommended Next Task

Connect a PostgreSQL database instance and run the initial migration (`npx prisma migrate dev`). Then proceed to the Dashboard feature.

---

## Change Log

### 2026-07-31

* Initialized repository.
* Added MIT License.
* Added README.
* Added AI documentation system.

### 2026-07-31 — Project Foundation

* Scaffolded frontend: React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui + React Router + Axios
* Scaffolded backend: Express + TypeScript + Prisma v7 + PostgreSQL + security middleware
* Created health endpoint: `GET /api/health`
* Verified both servers start successfully
* Verified Prisma schema validates

### 2026-08-01 — Authentication (Sprint 2)

**Backend changes:**
* Added User model to Prisma schema (cuid ID, name, email unique, hashed password, timestamps)
* Created `src/lib/prisma.ts` — singleton Prisma client
* Created `src/types/express.d.ts` — global `req.user` type augmentation (`{ sub: string }`)
* Updated `src/config/env.ts` — added JWT_SECRET, JWT_EXPIRES_IN
* Created `src/features/auth/` — complete auth feature module:
  * `auth.types.ts` — SignupBody, LoginBody, SafeUser, AuthResponse, JwtPayload
  * `auth.validation.ts` — Zod schemas (password 8-128 chars) + validate() middleware
  * `auth.service.ts` — signup (bcryptjs hash, 409 on duplicate), login (bcryptjs compare, 401), getMe
  * `auth.controller.ts` — signupHandler (201), loginHandler (200), getMeHandler (200)
  * `auth.middleware.ts` — authenticate (Bearer token → jwt.verify → req.user.sub)
  * `auth.routes.ts` — POST /signup, POST /login, GET /me
* Updated `src/app.ts` — registered auth routes at `/api/auth`
* Updated `.env` and `.env.example` — added JWT_SECRET, JWT_EXPIRES_IN

**Frontend changes:**
* Installed shadcn/ui components: button, input, label, card
* Created `src/features/auth/` — complete auth feature module:
  * `auth.types.ts` — User, AuthState, LoginCredentials, SignupCredentials, AuthContextType
  * `auth.service.ts` — signup, login, getMe API calls
  * `auth.context.tsx` — AuthProvider with 5-step session restoration, login, signup, logout
  * `components/LoginPage.tsx` — email/password form with shadcn/ui
  * `components/SignupPage.tsx` — name/email/password/confirm form with validation
  * `components/ProtectedRoute.tsx` — loading/redirect/outlet guard
  * `index.ts` — barrel exports
* Updated `src/lib/api.ts` — JWT request interceptor + 401 response interceptor
* Updated `src/routes/index.tsx` — public routes (/login, /signup) + protected routes (/)
* Updated `src/layouts/RootLayout.tsx` — wrapped with AuthProvider

**Dependencies added:**
* Backend: bcryptjs, jsonwebtoken, zod, @types/bcryptjs, @types/jsonwebtoken
* Frontend: class-variance-authority, lucide-react, radix-ui (via shadcn)

### 2026-08-01 — Prisma Fix & Maintenance

* **Rationale**: Migrated backend to latest stable Prisma 6 line (`^6.3.1`) to resolve `PrismaClientInitializationError: A driver adapter is required`. Prisma 6 restores declarative `url = env("DATABASE_URL")` configuration inside `schema.prisma`, removing experimental `prisma.config.ts` and unnecessary driver adapter dependencies (`pg`, `@prisma/adapter-pg`).
* **Files Modified**: `app/backend/package.json`, `app/backend/prisma/schema.prisma`.
* **Files Deleted**: `app/backend/prisma.config.ts`.
* **Dependencies Updated**: `prisma` (`^6.3.1`), `@prisma/client` (`^6.3.1`).
* **Dependencies Removed**: `@types/bcryptjs` (redundant, as `bcryptjs` includes built-in types).
* **Verification Results**:
  - `npx prisma generate` succeeded (Client v6.19.3 generated).
  - `npx prisma validate` succeeded (schema valid).
  - `npm run dev` succeeded (Express server started on port 5000 with zero Prisma errors).
  - `GET /api/health` returned 200 OK.
  - Backend production build (`tsc`) succeeded with zero errors.
  - Frontend production build (`tsc -b && vite build`) succeeded with zero errors.

Future updates should be appended below this section rather than replacing previous entries.
