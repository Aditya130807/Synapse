# Synapse — High-Level Design

## 1. Architecture Overview

Synapse is built as a modular multi-tier application comprising a modern Single Page Application (SPA) frontend, a RESTful & Server-Sent Events (SSE) Express API backend, a PostgreSQL database managed via Prisma ORM, an extensible multi-agent orchestration engine, and a dual-provider Vector Search Engine.

```text
┌──────────────────────────────────────────────────────────────────────┐
│                           React Frontend                             │
│       Vite SPA • Tailwind CSS • React Router • Context API           │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ HTTP REST / SSE Stream
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Express Backend API                           │
│   Auth Middleware • Chat Controller • File Processing • Memory Pipeline│
└───────┬──────────────────────────┬───────────────────────────┬───────┘
        │                          │                           │
        ▼                          ▼                           ▼
┌──────────────┐          ┌─────────────────┐        ┌──────────────────┐
│  Context     │          │ Multi-Agent     │        │ Persistent       │
│  Engine      │          │ Orchestrator    │        │ Memory Pipeline  │
└───────┬──────┘          └────────┬────────┘        └─────────┬────────┘
        │                          │                           │
        ▼                          ▼                           ▼
┌──────────────┐          ┌─────────────────┐        ┌──────────────────┐
│ RAG Service &│          │ AI Provider     │        │ PostgreSQL DB    │
│ Vector DB    │          │ Factory         │        │ (Prisma ORM)     │
└──────────────┘          └────────┬────────┘        └──────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ External AI     │
                          │ Gateways        │
                          │ (OmniRoute /    │
                          │ OpenRouter)     │
                          └─────────────────┘
```

---

## 2. System Architecture Diagram

```mermaid
graph TD
    Client["React Frontend (SPA)"]
    
    subgraph Backend ["Express Node.js Backend"]
        API["API Router (/api)"]
        AuthMiddleware["Auth Middleware (JWT)"]
        
        ChatCtrl["Chat Controller"]
        FilesCtrl["Files / Knowledge Controller"]
        MemCtrl["Memory Controller"]
        DashCtrl["Dashboard Controller"]
        
        ContextEng["Context Engine"]
        AgentOrch["Agent Orchestrator"]
        AgentRtr["Agent Router"]
        ToolReg["Tool Registry"]
        MemPipeline["Memory Pipeline"]
        DocProc["Document Processor"]
        
        subgraph Agents ["Registered Agents"]
            GenAgent["GeneralAgent"]
            CodeAgent["CodingAgent"]
            ResAgent["ResearchAgent"]
            DocAgent["DocumentAgent"]
        end
        
        subgraph Tools ["Authorized Tools"]
            CalcTool["CalculatorTool"]
            KBSearchTool["KnowledgeSearchTool"]
            WebSearchTool["WebSearchTool"]
        end
        
        ProviderFactory["AI Provider Factory"]
        OmniRoute["OmniRoute Provider"]
        OpenRouter["OpenRouter Provider"]
    end
    
    subgraph DataStorage ["Data & Storage Layer"]
        Postgres[(PostgreSQL DB)]
        LocalStorage["Local File Storage"]
        VectorDB["Vector Store (Memory / Pinecone)"]
    end

    Client -->|HTTP / SSE| API
    API --> AuthMiddleware
    AuthMiddleware --> ChatCtrl
    AuthMiddleware --> FilesCtrl
    AuthMiddleware --> MemCtrl
    AuthMiddleware --> DashCtrl
    
    ChatCtrl --> AgentOrch
    FilesCtrl --> DocProc
    MemCtrl --> MemPipeline
    
    AgentOrch --> ContextEng
    AgentOrch --> AgentRtr
    AgentRtr --> Agents
    Agents --> ToolReg
    ToolReg --> Tools
    
    ContextEng --> VectorDB
    DocProc --> LocalStorage
    DocProc --> VectorDB
    MemPipeline --> Postgres
    
    Agents --> ProviderFactory
    ProviderFactory --> OmniRoute
    ProviderFactory --> OpenRouter
    
    ChatCtrl --> Postgres
    FilesCtrl --> Postgres
    DashCtrl --> Postgres
```

---

## 3. Frontend Architecture

The frontend is a Vite React SPA written in TypeScript.
- **Routing (`src/routes/index.tsx`)**: `react-router-dom` v6 `createBrowserRouter`. Public routes (`/login`, `/signup`) render independently; protected routes (`/dashboard`, `/chat`, `/history`, `/files`, `/settings`) are wrapped in `<ProtectedRoute>` and `<DashboardLayout>`.
- **State Management & Contexts**: `AuthContext` (session auth), `ChatContext` (conversations & streaming), `ThemeContext` (dark/light mode).
- **Feature Modules**: Organized under `src/features/`: `auth`, `chat`, `dashboard`, `files`, `history`, `search`, `settings`.
- **UI Components**: Built using Tailwind CSS and shadcn/ui. Key components include `ConversationWorkspace`, `MessageBubble`, `CodeBlock`, `ContextInspectorDrawer`, and `CitationsList`.

---

## 4. Backend Architecture

The backend is an Express server built with TypeScript following a modular architecture.
- **Entry Point (`src/app.ts`)**: Initializes security headers (`helmet`), CORS, JSON parsing, logging (`requestLogger`), feature routers under `/api`, and central error handling (`errorHandler`).
- **Route Modules**: `/api/auth`, `/api/chat`, `/api/files`, `/api/memory` & `/api/workspace-memory`, `/api/search`, `/api/dashboard`.
- **Error Handling**: Centralized `ApiError` class with operational HTTP status codes (400, 401, 403, 404, 429, 500, 502).

---

## 5. AI Architecture

The AI layer abstracts LLM providers, manages model fallbacks, routes prompt intent, and orchestrates single or multi-agent collaboration workflows.

```mermaid
graph TD
    UserQuery["Incoming User Query"] --> ContextAssembly["ContextEngine (RAG & Memory)"]
    ContextAssembly --> CollabRouter["AgentRouter.routeCollaboration()"]
    
    CollabRouter -->|Single Domain| SingleRoute["AgentRouter.route()"]
    CollabRouter -->|Multi-Domain Complex| MultiCollab["Parallel / Sequential Collaboration"]
    
    SingleRoute --> SelectAgent["Select Agent (Document / Coding / Research / General)"]
    SelectAgent --> ToolExecution["Execute Authorized Tools (Calculator / WebSearch)"]
    ToolExecution --> ExecAgent["Execute Primary Model"]
    
    ExecAgent -->|Success| SaveResp["Save Assistant Message & Metadata"]
    ExecAgent -->|Provider Failure| EmergencyFallback["Emergency Fallback to GeneralAgent"]
    EmergencyFallback --> SaveResp
    
    MultiCollab --> Subtasks["Execute Agent Subtasks"]
    Subtasks --> Synthesis["SynthesisService.synthesize()"]
    Synthesis --> SaveResp
```

### 5.1 Provider Factory & Agent Framework
- **Provider Factory (`features/ai/factory/providerFactory.ts`)**: Maps `AI_PROVIDER` (`omniroute` or `openrouter`) to instances implementing `AIProvider`.
- **Agent Registry (`AgentRegistry`)**: Singleton registry managing active agents (`general`, `coding`, `research`, `document`).
- **Agent Router (`AgentRouter`)**: Deterministic intent routing (`DocumentAgent` > `CodingAgent` > `ResearchAgent` > `GeneralAgent`).
- **Agent Orchestrator (`AgentOrchestrator`)**: Assembles context, executes primary/collaborative agents, executes tools, manages fallbacks, and triggers background memory extraction.

---

## 6. RAG Architecture

Message-level file isolation, multi-format document parsing, semantic chunking, and dual vector indexing:
- **Document Processing**: `PdfParser` (`pdf-parse`), `DocxParser` (`mammoth`), `MarkdownParser`, `TxtParser`.
- **Semantic Chunking**: Splits text into sliding window chunks of ~500 tokens with 50-token overlap (`SemanticChunker`).
- **Vector Indexing**: Computes embeddings and indexes vectors into `MemoryVectorProvider` or `PineconeVectorProvider`.
- **File Isolation**: Priority 1 message attachments (`MessageKnowledgeFile`) take exclusive priority over conversation files (`ConversationKnowledgeFile`).

---

## 7. Memory Architecture

Multi-scoped persistent memory system maintaining user preferences and workspace rules:
- **Scopes**: `GLOBAL` (user-wide), `WORKSPACE` (project rules), `CONVERSATION` (chat session).
- **Memory Types**: `INSTRUCTION`, `PREFERENCE`, `FACT`, `CONSTRAINT`, `PROJECT_CONTEXT`, `SUMMARY`.
- **Memory Pipeline**: Command parsing (`"Remember..."`, `"Forget..."`), auto-detection, secret scanning (`containsSensitiveInfo`), and conflict archiving.

---

## 8. Tool Architecture

Tools extend agent capabilities through permission checks.

```mermaid
graph LR
    Agent["Agent (e.g. ResearchAgent)"] -->|Request Tool| Registry["ToolRegistry.executeTool()"]
    Registry -->|Verify Capability| PermissionCheck{"Has Capability?"}
    PermissionCheck -->|Yes| Execute["Execute Tool (WebSearch / Calculator)"]
    PermissionCheck -->|No| Error["Throw Security Error"]
    Execute --> ToolResult["Return ToolResult to Agent"]
```

- `ToolRegistry`: Validates that calling agent possesses required `AgentCapability`.
- **Registered Tools**: `CalculatorTool` (`calculator`), `KnowledgeSearchTool` (`knowledge.search`), `WebSearchTool` (`web.search`).

---

## 9. Authentication & Authorization

- **Authentication**: Credentials validated during `/api/auth/login`. Returns signed JWT containing `{ sub: user.id, email: user.email }`.
- **Authorization**: `authenticate` middleware verifies `Authorization: Bearer <token>` header.
- **Tenant Ownership**: Controllers enforce resource isolation by filtering queries with `userId: req.user.sub`.

---

## 10. Data Flow

### 10.1 Normal Chat SSE Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as React Client
    participant API as Express API (/chat/:id/messages/stream)
    participant Orch as AgentOrchestrator
    participant Router as AgentRouter
    participant Agent as GeneralAgent
    participant Provider as OmniRoute / OpenRouter API

    User->>API: POST /messages/stream { role: "user", content: "..." }
    API->>API: Save User Message in DB
    API-->>User: SSE Header & event: userMessage
    API->>Orch: orchestrate(userId, conversationId)
    Orch->>Router: route(context)
    Router-->>Orch: Decision (Agent: general)
    Orch->>Agent: execute(context, { onChunk })
    Agent->>Provider: generateStreamResponse()
    loop Token Streaming
        Provider-->>Agent: Token Chunk
        Agent-->>API: onChunk(chunk)
        API-->>User: event: token { content: chunk }
    end
    Provider-->>Agent: Stream Complete
    Agent-->>Orch: AgentResult
    Orch->>API: Save Assistant Message in DB
    API-->>User: event: done { assistantMessage }
    API-->>User: Close SSE Stream
```

### 10.2 Document / RAG Chat SSE Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as React Client
    participant API as Express API (/chat/:id/messages/stream)
    participant Orch as AgentOrchestrator
    participant CtxEng as ContextEngine
    participant RAG as RetrievalService
    participant DocAgent as DocumentAgent
    participant Provider as AI Provider API

    User->>API: POST /messages/stream { content: "Summarize this", fileIds: ["file-123"] }
    API->>API: Save User Message & MessageKnowledgeFile attachment
    API-->>User: SSE Header & event: userMessage
    API->>Orch: orchestrate()
    Orch->>CtxEng: execute(conversationId, userId, query, fileIds)
    CtxEng->>RAG: retrieveAttachedDocuments(["file-123"])
    RAG-->>CtxEng: Document Chunks
    CtxEng-->>Orch: RAGPromptResult
    Orch->>DocAgent: execute(context)
    DocAgent->>Provider: generateStreamResponse(systemPrompt + chunks)
    loop Stream Tokens
        Provider-->>DocAgent: Token Chunk
        DocAgent-->>User: event: token
    end
    Provider-->>DocAgent: Response Finished
    Orch->>API: Save Assistant Message with Metadata
    API-->>User: event: done { assistantMessage }
```

---

## 11. External Integrations & Deployment

- **External Integrations**: OmniRoute / OpenRouter API, PostgreSQL DB, local disk storage, Pinecone Vector DB.
- **Deployment Architecture**: Currently implemented as local Node.js Express server + Vite SPA; containerized Docker Compose deployment planned.
- **Scalability**: Stateless JWT auth for horizontal scaling, Prisma connection pooling, and background async file chunking.
