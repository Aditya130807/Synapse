# AI Context

This file acts as the shared context between AI agents working on Synapse.

Every AI agent must read this file before making changes and update it after completing a task.

---

## Current Status

**Project Stage**

Project Foundation Complete

**Current Branch**

main

**Current Focus**

Ready for feature development.

---

## Completed

* GitHub repository created.
* MIT License added.
* Initial README created.
* AI documentation structure established.
* Frontend setup (React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui + React Router + Axios)
* Backend setup (Express + TypeScript + Prisma + PostgreSQL + security middleware + health endpoint)

---

## In Progress

None.

---

## Pending

* Database configuration (connect to a running PostgreSQL instance)
* Authentication
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
* shadcn/ui (new-york style, configured but no components added yet)
* React Router (react-router-dom v7)
* Axios

Backend

* Express 5
* TypeScript 7
* Prisma 7 (generator + datasource configured, no models)
* tsx (dev server with watch mode)
* Helmet (security headers)
* CORS
* Morgan (request logging)
* dotenv

Database

* PostgreSQL (configured via Prisma, not yet connected)

---

## Architecture Decisions

1. **Separate projects**: Frontend and backend are fully independent npm projects under `app/`. No monorepo tooling — each has its own `package.json`, `tsconfig.json`, and `node_modules`.

2. **Tailwind CSS v4**: Uses the modern `@tailwindcss/vite` plugin instead of PostCSS. CSS entry point is `@import "tailwindcss"` in `src/styles/index.css`.

3. **Absolute imports**: Frontend uses `@/` path alias (configured in both `vite.config.ts` and `tsconfig.app.json`).

4. **shadcn/ui**: Configured via `components.json` only. No components installed yet — they should be added as needed during feature development.

5. **Prisma v7**: Uses the new `prisma.config.ts` pattern where the database URL is configured outside the schema file. The `prisma/schema.prisma` contains only `generator` and `datasource` blocks — no models yet.

6. **Express middleware stack**: Helmet → CORS → JSON/URL parsing → Morgan logger → Routes → Error handler. This ordering ensures security headers are set first and errors are caught last.

7. **Custom error handling**: `ApiError` class for operational errors with status codes. The global error handler returns sanitized messages in production.

8. **Environment config**: Backend uses a centralized `env.ts` module that validates and exports all env vars. Frontend uses Vite's `import.meta.env` with `VITE_` prefix.

9. **NodeNext module resolution**: Backend TypeScript uses `NodeNext` module/moduleResolution with `.js` extensions in imports for full ESM compatibility.

10. **React Router**: Uses `createBrowserRouter` with a layout-based route structure (`RootLayout` → child routes).

---

## Known Issues

None.

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

Database configuration and initial Prisma models (User, Conversation, Message) as defined in ARCHITECTURE.md.

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

Future updates should be appended below this section rather than replacing previous entries.
