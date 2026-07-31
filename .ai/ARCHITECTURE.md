# Synapse Architecture

## High-Level Architecture

```text
Frontend (React)

        │

REST API (Express)

        │

Business Logic

        │

Prisma ORM

        │

PostgreSQL

        │

AI Provider
```

---

# Frontend

Responsibilities

* Authentication
* Dashboard
* Chat Interface
* File Upload
* Settings
* API Communication
* State Management

---

# Backend

Responsibilities

* Authentication
* AI Requests
* Conversation Management
* File Upload
* Database Operations
* API Validation

---

# Database

Current Models

* User
* Conversation
* Message

Future models may include:

* Workspace
* File
* Memory
* Prompt
* Agent

---

# API Structure

Authentication

* POST /auth/signup
* POST /auth/login
* GET /auth/me

Chat

* POST /chat
* GET /chat/history
* GET /chat/:id

Files

* POST /files/upload

Settings

* GET /settings
* PATCH /settings

---

# Folder Layout

```text
app/

├── frontend/
└── backend/
```

The exact internal structure should remain modular and feature-oriented.

---

# Design Principles

* REST-first architecture
* Modular components
* Clear separation of concerns
* Reusable services
* Type-safe code
* Scalable project structure

---

# Future Architecture

Planned additions:

* Multiple AI providers
* Streaming responses
* RAG
* AI memory
* Plugin system
* Workspace management
* Team collaboration

These are future goals and should not be implemented unless explicitly requested.
