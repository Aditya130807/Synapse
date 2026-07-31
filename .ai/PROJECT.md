# Synapse — Project Overview

## Vision

Synapse is an AI Workspace for Modern Knowledge Work.

The goal is to create a unified platform where users can interact with AI, manage conversations, upload documents, and organize knowledge without switching between multiple applications.

This project prioritizes a clean architecture, excellent user experience, and long-term scalability over feature quantity.

---

# Goals

* Build a production-ready AI workspace.
* Keep the codebase modular and maintainable.
* Design for scalability from the beginning.
* Follow modern full-stack best practices.
* Build an excellent portfolio-quality application.

---

# MVP Scope

The initial version should include:

* User Authentication
* Dashboard
* AI Chat
* Conversation History
* File Upload
* Settings
* Responsive UI

Anything outside this list should be considered out of scope unless explicitly requested.

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui

## Backend

* Node.js
* Express
* TypeScript

## Database

* PostgreSQL
* Prisma ORM

## AI

* OpenAI API
* Provider abstraction for future integrations

---

# Coding Principles

* Write clean, readable code.
* Prefer reusable components.
* Avoid duplication.
* Keep functions focused on one responsibility.
* Use TypeScript strictly.
* Follow existing project conventions.

---

# Project Structure

The project consists of:

* Frontend
* Backend
* Database
* Shared AI documentation

All implementation should respect this structure.

---

# AI Agent Rules

Before making any changes:

1. Read PROJECT.md.
2. Read ARCHITECTURE.md.
3. Read AI_CONTEXT.md.

When finished:

* Update AI_CONTEXT.md.
* Mention every modified file.
* Mention any new dependencies.
* Report known issues.
* Do not modify unrelated code.

---

# Development Philosophy

Build a working MVP first.

Prioritize:

1. Correctness
2. Maintainability
3. Simplicity
4. Performance
5. New features
