# Synapse AI Workspace – Changelog

All notable changes, architectural milestones, and sprint deliverables for **Synapse** are documented in this file.

---

## [Sprint 8.1] – Production Hardening & System Quality
*Released: August 2026*

### Security & Reliability
- **Orphaned Vector Cleanup**: Integrated vector deletion (`vectorProvider.deleteByFileId`) into document removal lifecycle before physical storage and database record cleanup.
- **Storage Path Traversal Containment**: Implemented `assertInsideStorageRoot(fullPath)` containment guard in `LocalStorageProvider`, prohibiting directory traversal attempts.
- **SSE Error Event Resilience**: Wrapped SSE streaming handlers (`createStreamMessageHandler` and `regenerateStreamMessageHandler`) with structured error emission (`data: {"type":"error","message":"..."}`) and clean connection teardowns.
- **Health Check Endpoint**: Added lightweight unauthenticated health endpoint (`GET /health` & `GET /api/health`) checking Database (`SELECT 1`), Storage, Vector Engine, and AI Provider status.

---

## [Sprint 8.0] – Retrieval-Augmented Generation (RAG) & AI Context Injection
*Released: August 2026*

### Features & RAG Architecture
- **RAG Engine Module (`features/rag/`)**:
  - `RetrievalService`: Retrieves top relevant chunks prioritized by conversation attachments or user knowledge base.
  - `ContextService`: Constructs structured Markdown context blocks (`--- BEGIN SOURCE [N]: filename (Page X) ---`) within configurable token budgets.
  - `PromptBuilder`: Injects retrieved knowledge into AI system prompts with anti-hallucination constraints and citation formatting rules.
  - `CitationService`: Formats citation metadata stored inside assistant message records in PostgreSQL.
- **Frontend Citations & Source Inspection**:
  - **Knowledge Sources Panel**: Collapsible `CitationsList` at the bottom of assistant responses showing `% Match` badges, page numbers, and source preview triggers.
  - **Developer Retrieval Inspector**: Expandable debug mode displaying token counts, raw similarity scores, and chunk text excerpts.
  - **Composer Knowledge Counter**: Displays `Using N knowledge sources for AI context` badge above chat composer.

---

## [Sprint 7.5] – Embeddings & Semantic Search Foundation
*Released: August 2026*

### Vector Engine & Semantic Search
- **Vector Provider Abstraction (`src/lib/vector/`)**:
  - Created `VectorProvider` contract (`upsertVectors`, `deleteVectors`, `deleteByFileId`, `searchVectors`).
  - Built `MemoryVectorProvider` with exact cosine similarity matching and `PineconeVectorProvider` with fallback capability.
  - Added `VectorProviderFactory` for environment-driven vector database switching.
- **Embedding Generation**:
  - Created `EmbeddingService` integrating `@google/genai` (`text-embedding-004`) and 384-dimensional semantic feature vector fallback.
  - Added `embeddingId` and `embeddedAt` to `KnowledgeChunk` Prisma schema.
- **Semantic Search APIs & UI**:
  - Added `POST /api/search/semantic` and `POST /api/search/conversation`.
  - Upgraded Knowledge Base page with **Semantic** vs **Filename** search mode toggle and `SearchResultCard` grid.

---

## [Sprint 7.0] – Document Processing & RAG Foundation (Phase 1)
*Released: August 2026*

### Document Parsing & Chunking Pipeline
- **Document Processing Module (`features/document-processing/`)**:
  - Created `DocumentParser` interface supporting PDF (`PdfParser` with v1/v2 `pdf-parse` interop), DOCX (`DocxParser` via `mammoth`), Markdown (`MarkdownParser`), and Text (`TxtParser`).
  - Implemented `TextNormalizer` (`\r\n` -> `\n`, whitespace & break normalization).
  - Built `SemanticChunker` (600–1000 char target window, 100–150 char overlap window).
  - Added `KnowledgeChunk` model (`id`, `fileId`, `chunkIndex`, `page`, `content`, `tokenEstimate`) to Prisma schema.
  - Asynchronous background queue (`DocumentProcessorService` using `setImmediate`).
- **UI Processing Status**:
  - `FileCard` processing spinner and `Ready` status badges.
  - `FilePreviewModal` dual-tab view ("Raw Preview" vs "Parsed Chunks").

---

## [Sprint 6.5] – Chat File Attachment Integration
*Released: August 2026*

### Chat-First Document Entry & Decoupled Architecture
- **Chat Composer File Upload**:
  - Integrated `📎 Attach File` menu (`Upload New File` & `Choose from Knowledge Base` modal).
  - Drag-and-drop overlay directly onto chat composer.
  - Attached file chips bar with `✓ Context Ready` badges.
- **Database Model**:
  - Created `ConversationKnowledgeFile` junction table with `isPinned` status metadata.
- **Knowledge Base Refactor**:
  - Knowledge Base transformed into an AI Document Library showing usage badges and conversation navigation links.
  - Decoupled React Contexts: Knowledge components navigate using React Router search params (`/chat?id=convId`).

---

## [Sprint 6.0] – Knowledge Base & Storage Foundation
*Released: August 2026*

### File Storage & Knowledge Management
- **Prisma Data Model**: Created `KnowledgeFile` model with per-user SHA-256 deduplication (`@@unique([userId, hash])`).
- **Storage Abstraction**: Built `StorageProvider` interface with `LocalStorageProvider` (`storage/uploads/:userId/:fileId.:ext`).
- **Files REST API**: `POST /upload`, `GET /`, `GET /:id`, `GET /:id/preview`, `GET /:id/download`, `PATCH /:id`, `DELETE /:id`.
- **Knowledge Base UI**: Document grid view, `StorageBar` quota indicator, type chips, `FilePreviewModal`, and inline `FileRenameModal`.

---

## [Sprint 5.0 - 5.7] – AI Provider Integration, Streaming & Premium UX
*Released: July 2026*

### OpenRouter & Chat Experience
- **AI Abstraction Layer**: Built `AIProvider` interface, `OpenRouterProvider`, and `providerFactory`.
- **Streaming Responses**: Implemented Server-Sent Events (SSE) streaming (`POST /api/chat/:id/messages/stream`) with real-time token rendering and cancel button.
- **Markdown & Code Experience**: Syntax-highlighted code blocks, language badges, 1-click copy buttons, and GFM table/list typography.
- **Conversation UX**: Automatic title generation from initial user prompt, real-time title search filtering, inline title editing, context menu, and delete dialog.
- **Composer UX**: Auto-resizing growing textarea (44px → 220px), Esc shortcut, send/stop toggle buttons.
- **Message Actions**: Contextual hover action bars for Assistant (Copy, 👍/👎 Thumbs rating, Regenerate) and User (Inline prompt editing).
- **Motion & Premium UX**: Glass navbar header, stopwatch thinking timer (`Thinking... 1.4s`), model badge, and Framer Motion spring physics.

---

## [Sprint 4.0] – AI Chat Workspace Architecture
*Released: July 2026*

### Workspace Core
- **Conversations & Messages CRUD**: Built backend controllers, services, and routes for managing user conversations and message history.
- **Chat Workspace UI**: 2-panel desktop workspace layout, `ChatProvider` React Context, optimistic UI updates, auto-scroll to bottom, and design token styling.

---

## [Sprint 1.0 - 3.0] – Foundation, Auth & Workspace Shell
*Released: June 2026*

### Core Infrastructure
- **Backend Architecture**: Express + TypeScript + Prisma + PostgreSQL + security middleware (Helmet, CORS, Request Logger).
- **Authentication System**: User signup, login, JWT token auth, bcryptjs password hashing (10 salt rounds), protected routes, session persistence (`localStorage`).
- **Frontend Architecture**: React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui + React Router.
- **Workspace Shell**: `DashboardLayout`, expandable navigation rail (72px → 260px), and top header navigation bar.
