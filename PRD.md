# Synapse — Product Requirements Document

## 1. Product Overview

**Synapse** is an AI-powered workspace designed for modern knowledge work.

It unifies:
- Conversational AI
- Document processing
- Intelligent context retrieval (RAG)
- Persistent memory management
- Specialized multi-agent collaboration
- Tool execution

All features are integrated into a single web application.

Rather than switching between isolated AI chat assistants, note-taking apps, and file reference tools, Synapse provides a seamless workspace where users converse with specialized AI agents that access workspace context, message-attached documents, and user preferences while maintaining strict message-level file isolation.

---

## 2. Problem Statement

Modern knowledge work across software engineering, technical research, and document analysis suffers from fragmentation:

- **Context Fragmentation**:
  Standard AI chat interfaces lack awareness of user coding preferences, workspace rules, and project history across sessions, forcing users to repeatedly re-prompt instructions.

- **Irrelevant Retrieval & Context Pollution in RAG**:
  Generic RAG implementations load broad document repositories into LLM context windows, introducing noise, high latency, hallucinated citations, and privacy leakage between unrelated conversations.

- **One-Size-Fits-All AI**:
  General LLMs struggle with specialized technical tasks (such as code debugging vs document summarization vs multi-source technical trade-off evaluation) without dedicated prompt engineering, capability permissions, and routing.

Synapse addresses these challenges by providing a unified workspace with deterministic agent routing, message-level file attachment scope, persistent multi-scoped memory, and transparent retrieval diagnostics.

---

## 3. Product Vision

The vision of Synapse is to serve as an **Intelligent AI Workspace for Modern Knowledge Work**.

It aims to eliminate context fragmentation and cognitive overhead by ensuring that AI interactions remain:
- Contextually aware
- Secure and isolated
- Transparent and inspectable
- Structured and reliable

The current foundation focuses on text-based intelligence, specialized single and collaborative agent orchestration, semantic search over user-uploaded knowledge files, and persistent workspace rules.

---

## 4. Target Users

Synapse is built for professionals who rely on structured, high-context AI interactions:

### 4.1 Software Engineers & Developers
- Code review and refactoring
- Syntax debugging and stack trace analysis
- Architecture evaluation and trade-off analysis
- Database schema design using technical agents

### 4.2 Researchers & Technical Analysts
- Comparative trade-off evaluation
- Multi-source technical synthesis
- Web search verification
- Structured technical report generation

### 4.3 Knowledge Workers & Document Managers
- Multi-format file uploading (PDF, DOCX, Markdown, TXT)
- Document summarization and analysis
- Specific chunk retrieval
- Verifiable inline source citations

---

## 5. Core User Workflows

### 5.1 Account Creation & Authentication
1. User navigates to `/signup` to register with name, email, and password.
2. User logs in at `/login` to receive a signed JWT token.
3. JWT token is stored securely in browser `localStorage`.
4. Protected workspace routes automatically redirect unauthenticated requests to `/login`.

### 5.2 Starting a Conversation & Normal AI Chat
1. User creates a new conversation or selects an existing session from the navigation sidebar.
2. User submits a text query in the chat composer.
3. Response tokens stream back in real time via Server-Sent Events (SSE).
4. System automatically routes query to `GeneralAgent` for standard conversational prompts.

### 5.3 Document Upload & RAG Q&A
1. User uploads files (PDF, DOCX, MD, TXT) via `/files` page or directly in chat composer.
2. Files are parsed, normalized, chunked semantically, and embedded into vector store.
3. When attached to a message (`MessageKnowledgeFile`), document chunks are injected with exclusive priority.
4. User receives response containing inline citations linking to exact source chunks and page numbers.

### 5.4 Specialized Agent Routing & Collaboration
1. User submits a domain-specific query (e.g. `"Debug this API endpoint returning 500"`).
2. `AgentRouter` deterministically evaluates prompt intent and selects `CodingAgent`.
3. For multi-domain prompts (e.g. `"Audit our architecture against security standards"`), `AgentRouter` triggers **Multi-Agent Collaboration**.
4. Collaborating agents (`CodingAgent` and `ResearchAgent`) execute parallel/sequential subtasks.
5. `SynthesisService` synthesizes subtask findings into a single unified completion.

### 5.5 Memory & Rule Management
1. User states an explicit rule (e.g. `"Remember that our project uses PostgreSQL and Prisma"`).
2. `MemoryPipeline` extracts, deduplicates, and persists instruction under `WORKSPACE` scope.
3. Subsequent chat requests automatically rank and inject active persistent instructions into system prompt.
4. User views, edits, pins, or deletes memories in Workspace Memory Panel or persistent memory pages.

### 5.6 Transparency & Inspection
1. User opens **Context Inspector** to view RAG context statistics: tokens used, strategy applied, chunks injected, and agent execution metadata.
2. User opens **Retrieval Inspector** to review exact matched file excerpts, page numbers, and similarity scores.

### 5.7 Dashboard & Settings Management
1. User views workspace analytics on Dashboard (`/dashboard`): total conversations, uploaded files, storage footprint, active memory count, available models, and recent activity timeline.
2. User manages profile details, changes passwords, and toggles dark/light theme preferences in Settings (`/settings`).

---

## 6. Core Features

- **Authentication**:
  JWT-based auth, password hashing via bcryptjs, protected workspace routes (`/dashboard`, `/chat`, `/history`, `/files`, `/settings`).

- **Real-Time Streaming**:
  Real-time SSE streaming over HTTP POST (`/api/chat/:id/messages/stream`) for response tokens, keepalives, and error frames.

- **Conversation Management**:
  Conversation creation, renaming, deletion, message history pagination, regeneration via `/api/chat/:id/messages/regenerate`.

- **Multi-Agent System**:
  Deterministic router selecting specialized agents: `GeneralAgent`, `CodingAgent`, `ResearchAgent`, `DocumentAgent`.

- **Multi-Agent Collaboration**:
  Parallel and sequential subtask execution with LLM-based `SynthesisService` to combine multi-domain analysis.

- **Message-Level RAG**:
  Strict file isolation for message attachments, PDF/DOCX/MD/TXT parsing, semantic chunking (~500 tokens, 50 overlap).

- **Vector Search Engine**:
  Dual vector engine using `MemoryVectorProvider` by default with optional `PineconeVectorProvider` integration.

- **Persistent Memory System**:
  Multi-scope (`GLOBAL`, `WORKSPACE`, `CONVERSATION`) instructions, secret filtering, deduplication, conflict archiving.

- **Tool Execution System**:
  Permission-checked tool registry (`CalculatorTool`, `KnowledgeSearchTool`, `WebSearchTool`).

- **Transparency UI**:
  Context Inspector drawer, Citations List, Retrieval Inspector, and Memory notification toasts.

- **Dashboard & Analytics**:
  Aggregated stats for conversations, storage bytes, active memories, available models, and recent activity.

- **Settings & Theme**:
  Theme context (Dark/Light mode toggles), profile update, and password change endpoints.

---

## 7. Functional Requirements

### 7.1 Authentication & User Management
- **FR-1.1**:
  System MUST allow user registration with full name, unique email address, and password.
- **FR-1.2**:
  System MUST enforce a minimum password length of 6 characters during signup and password updates.
- **FR-1.3**:
  System MUST issue signed JSON Web Tokens (JWT) containing `userId`, `email`, and 7-day expiration upon successful authentication.
- **FR-1.4**:
  System MUST protect all `/api/chat`, `/api/files`, `/api/memory`, `/api/search`, and `/api/dashboard` API routes, returning `401 Unauthorized` when an invalid token is provided.

### 7.2 Chat & Streaming
- **FR-2.1**:
  System MUST persist conversation messages with roles (`user`, `assistant`, `system`) and structured JSON metadata in PostgreSQL.
- **FR-2.2**:
  System MUST stream assistant response tokens in real time using Server-Sent Events (SSE) over HTTP POST (`/api/chat/:id/messages/stream`).
- **FR-2.3**:
  System MUST send periodic keepalive comments (`: keepalive`) every 8 seconds during long-running reasoning phases to prevent HTTP timeouts.
- **FR-2.4**:
  System MUST monitor client disconnects via `AbortController` and `res.on('close')`, aborting background LLM requests when client disconnects.
- **FR-2.5**:
  System MUST support message regeneration by deleting trailing assistant responses and re-streaming a fresh completion (`/api/chat/:id/messages/regenerate`).

### 7.3 Knowledge Processing & RAG
- **FR-3.1**:
  System MUST support file uploads up to 10MB in format PDF, DOCX, Markdown, or TXT.
- **FR-3.2**:
  System MUST parse documents into plain text, normalize whitespace, and split text into semantic overlapping chunks (~500 tokens, 50-token overlap).
- **FR-3.3**:
  System MUST store original uploaded files on local storage and chunk metadata in PostgreSQL.
- **FR-3.4**:
  System MUST enforce message-level file isolation: message-attached file IDs take exclusive priority during RAG retrieval.
- **FR-3.5**:
  System MUST only search prior conversation files if the user's prompt explicitly references prior uploaded documents.

### 7.4 Agents & Tools
- **FR-4.1**:
  System MUST implement an extensible `Agent` interface with `canHandle` and `execute` methods.
- **FR-4.2**:
  System MUST provide deterministic agent routing (`DocumentAgent` > `CodingAgent` > `ResearchAgent` > `GeneralAgent`).
- **FR-4.3**:
  System MUST execute emergency fallback to `GeneralAgent` if a specialized model chain fails with provider or rate-limit errors.
- **FR-4.4**:
  System MUST authorize tools based on agent capabilities (`web.search` authorized for `ResearchAgent`, `calculator.execute` authorized for `GeneralAgent` and `CodingAgent`).

### 7.5 Memory Management
- **FR-5.1**:
  System MUST support persistent memories across `GLOBAL`, `WORKSPACE`, and `CONVERSATION` scopes.
- **FR-5.2**:
  System MUST automatically reject persistent memories containing sensitive patterns (passwords, API keys, bearer tokens).
- **FR-5.3**:
  System MUST archive older conflicting tech-stack instructions when new conflicting rules are saved (e.g. PostgreSQL vs MySQL).

---

## 8. Non-Functional Requirements

### 8.1 Performance & Latency
- **NFR-1.1**:
  First SSE token delivery SHOULD occur within 1.5 seconds for direct AI responses under standard provider latency.
- **NFR-1.2**:
  RAG document processing SHOULD complete background chunking and vector indexing within 3 seconds for documents under 50 pages.
- **NFR-1.3**:
  Database queries for conversation listing and message history pagination SHOULD complete within 50ms.

### 8.2 Reliability & Fallbacks
- **NFR-2.1**:
  System MUST support multi-tier model fallbacks (Primary model -> Fallback Model 1 -> Fallback Model 2).
- **NFR-2.2**:
  System MUST degrade gracefully to memory-based vector search (`MemoryVectorProvider`) if Pinecone is unconfigured or unreachable.
- **NFR-2.3**:
  Unhandled exceptions in background processing MUST NOT crash the Node.js server process.

### 8.3 Maintainability & Code Quality
- **NFR-3.1**:
  System MUST maintain strict modular separation between frontend features and backend controllers/services.
- **NFR-3.2**:
  Provider Factory pattern MUST allow new LLM providers to be integrated by modifying only `providerFactory.ts` and adding a provider class.

---

## 9. User Experience Requirements

- **Theme & Responsiveness**:
  Clean, modern dark and light theme interface built with Tailwind CSS and shadcn/ui components, fully responsive across desktop, tablet, and mobile viewports.

- **Rich Markdown & Code Rendering**:
  Full Markdown rendering with syntax highlighting, language labels, line numbers, one-click copy buttons, and rendered LaTeX math expressions.

- **Citation Badges**:
  Interactive citation badges in assistant messages displaying file name, page number, and similarity percentage.

- **Inspector Drawers**:
  Slide-over drawers for Context Inspector (RAG token budget, strategy metadata, agent execution traces) and Workspace Memory Panel.

- **Loading & Toast Notifications**:
  Skeletons and typing indicators during loading states, and toast notifications when persistent memories are created or forgotten.

---

## 10. Security Requirements

- **Password Security**:
  Passwords MUST be hashed using `bcryptjs` with salt factor 10 before saving to database.

- **Token Handling**:
  JWT tokens MUST be verified on every protected API request via `authenticate` middleware.

- **File Isolation & Tenant Ownership**:
  File retrieval and preview routes MUST verify that `file.userId === req.user.sub`.

- **Secret Protection in Memory**:
  Persistent memory inputs MUST be scanned against regular expression patterns to reject secrets, credentials, and API keys.

- **API Credential Safety**:
  LLM provider API keys (`OMNIROUTE_API_KEY`, `OPENROUTER_API_KEY`) MUST be stored server-side only in environment configuration.

---

## 11. Current Limitations

To maintain full transparency, the following features are **NOT** currently implemented in the Synapse codebase:

1. **Vision / Image Analysis**:
   Document processing and chat engine only accept text, PDF, DOCX, and Markdown files. Image upload and multimodal vision models are currently not supported.

2. **Arbitrary Sandbox Code Execution**:
   The `CodingAgent` performs static code analysis, debugging, and generation. Real-time code execution in an isolated Docker container or WASM sandbox is planned for future releases.

3. **Voice & Audio Chat**:
   Real-time speech-to-text and text-to-speech audio streaming are not implemented.

4. **Multi-User Workspace Collaboration**:
   Workspaces are currently scoped per individual user (`workspaceId="default"`). Shared team workspaces with role-based access control (RBAC) are planned.
