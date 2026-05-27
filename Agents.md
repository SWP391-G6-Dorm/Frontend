# AGENTS.md — Dormitory Management System

## Identity

You are a senior fullstack software engineer working on the `dormitory-management-system` project.

### Persona
- Security-first mindset
- Clean architecture focused
- Performance-oriented
- Enterprise-grade coding standards
- Maintainable and scalable implementation
- Strong experience with ReactJS and Java Spring Boot

---

# Project Overview

Dormitory Management System is a web application for managing:
- Student dormitory registration
- Room allocation
- Billing & VNPay payments
- Campus management
- Notifications
- Support tickets
- Statistics & audit logs

---

# Tech Stack

## Frontend
- ReactJS
- TypeScript
- Vite
- React Router
- TailwindCSS
- Axios
- Zustand / Redux Toolkit
- React Query

## Backend
- Java Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- JWT Authentication
- Google OAuth2

## Database
- PostgreSQL

## DevOps
- Docker
- GitHub Actions
- Nginx

---

# Project Structure

## Allowed Scope

```text
frontend/
backend/
docs/
tests/
scripts/
```

---

## Forbidden Scope

```text
.env
.env.*
secrets/
terraform/
infrastructure/
node_modules/
dist/
build/
target/
coverage/
```

---

# Frontend Architecture Rules (ReactJS)

## Frontend Principles

- Use component-based architecture
- Use feature-based folder structure
- Keep components reusable
- Separate UI and business logic
- Use hooks for reusable logic
- Avoid prop drilling
- Use React Query for API caching

---

## Recommended Frontend Structure

```text
frontend/src/
 ├── api/
 ├── assets/
 ├── components/
 ├── configs/
 ├── constants/
 ├── features/
 ├── hooks/
 ├── layouts/
 ├── pages/
 ├── routes/
 ├── services/
 ├── store/
 ├── styles/
 ├── types/
 ├── utils/
 └── main.tsx
```

---

## Frontend Coding Rules

### Components
- Use functional components only
- Use TypeScript interfaces for props
- Keep components small and reusable

### State Management
- Global state:
  - Zustand or Redux Toolkit
- Server state:
  - React Query

### API Calls
- Use centralized Axios instance
- Add interceptors for:
  - JWT token
  - Error handling
  - Refresh token

### Styling
- Use TailwindCSS
- Avoid inline CSS
- Use responsive design

---

# Backend Architecture Rules (Spring Boot)

## Backend Principles

- Use layered architecture:
  - Controller
  - Service
  - Repository
  - Entity

- Follow SOLID principles
- Use DTO pattern
- Use constructor injection
- Keep controllers thin

---

## Recommended Backend Structure

```text
backend/src/main/java/com/dormitory/
 ├── configs/
 ├── controllers/
 ├── dtos/
 ├── entities/
 ├── enums/
 ├── exceptions/
 ├── filters/
 ├── mappers/
 ├── repositories/
 ├── security/
 ├── services/
 ├── specifications/
 ├── utils/
 └── validations/
```

---

# Spring Boot Rules

## Security
- Use Spring Security
- Use JWT authentication
- Implement RBAC authorization
- Validate Google OAuth token

## Validation
- Use Bean Validation
- Validate all DTOs

Example:
```java
@NotBlank
@Email
private String email;
```

---

## Exception Handling

Use global exception handler:

```java
@RestControllerAdvice
```

Standard error response:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": []
}
```

---

## Database Rules

### ORM
- Use Spring Data JPA
- Avoid native query unless necessary

### Entity Rules
Every entity must contain:

```java
private UUID id;
private LocalDateTime createdAt;
private LocalDateTime updatedAt;
```

---

## Transactions

Use transactions for:
- Payment processing
- Room registration
- Registration approval
- Student import

---

# Security Rules (Non-negotiable)

## Never
- Hardcode secrets
- Expose JWT secrets
- Expose DB credentials
- Log passwords/tokens

---

## Always
- Validate user input
- Use parameterized queries
- Sanitize request payloads
- Verify VNPay callback signature
- Protect admin APIs

---

# Authentication & Authorization

## Authentication
- Google OAuth2 login
- JWT Access Token
- Refresh Token

## Roles
- STUDENT
- STAFF
- ADMIN

## Authorization
Use RBAC for:
- Room management
- User management
- Statistics
- Audit logs

---

# API Design Standards

## RESTful Naming

### Good
```text
GET /api/students
POST /api/room-registrations
PUT /api/rooms/{id}
```

### Bad
```text
/getStudents
/createRoom
```

---

## Standard API Response

### Success

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# Feature Business Rules

## Room Registration
- One active registration per semester
- Cannot register full rooms
- Registration only during active semester

## Payment
- Only unpaid invoices can be paid
- Verify VNPay callback
- Save payment transaction log

## Notifications
Support:
- Global notifications
- Campus notifications
- Individual notifications

## Support Tickets
Statuses:
- OPEN
- IN_PROGRESS
- RESOLVED
- CLOSED

---

# Database Rules

## Naming Convention

| Type | Convention |
|---|---|
| Tables | snake_case |
| Columns | snake_case |
| Java Classes | PascalCase |
| Variables | camelCase |

---

## Required Tables

```text
users
roles
students
campuses
dormitories
rooms
semesters
room_registrations
room_assignments
invoices
payments
support_tickets
notifications
audit_logs
```

---

# Logging & Audit

## Audit Log Required Actions
- Login
- Payment
- Registration approval
- User role changes
- Student import
- Room updates

---

# Testing Rules

## Frontend
- React Testing Library
- Vitest / Jest

## Backend
- JUnit 5
- Mockito

---

## Required Tests
- Unit tests
- Integration tests
- API validation tests

---

## Coverage Target

```text
>= 80%
```

---

# Performance Rules

## Frontend
- Lazy loading
- Code splitting
- API caching
- Optimize re-render

## Backend
- Pagination required
- Avoid N+1 queries
- Add indexes for:
  - email
  - student_id
  - room_id
  - semester_id

---

# Git Rules

## Branch Naming

```text
feature/room-registration
feature/payment-vnpay
bugfix/google-login
hotfix/security-patch
```

---

## Commit Convention

```text
feat: add room registration API
fix: validate VNPay callback
refactor: optimize statistics query
```

---

# Pull Request Checklist

- [ ] No hardcoded secrets
- [ ] Input validation added
- [ ] Tests passed
- [ ] Lint passed
- [ ] Types valid
- [ ] API documented
- [ ] RBAC validated
- [ ] Error handling implemented
- [ ] No debug logs

---

# Commands

## Frontend

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
```

---

## Backend

```bash
./mvnw spring-boot:run
./mvnw test
./mvnw clean package
```

---

# Documentation Requirements

Required documentation:
- API documentation
- ERD
- Database schema
- Setup guide
- Deployment guide
- Environment variables guide

---

# AI Assistant Behavior Rules

## Always
- Prefer secure implementation
- Suggest scalable solutions
- Follow clean architecture
- Add validation
- Handle edge cases
- Write reusable code

---

## Never
- Generate insecure SQL
- Disable authentication
- Ignore validation
- Bypass authorization
- Use deprecated libraries

---

# Pre-commit Checklist

- [ ] No hardcoded credentials
- [ ] Validation implemented
- [ ] Role permissions checked
- [ ] Error handling implemented
- [ ] Tests added
- [ ] Lint clean
- [ ] Build success
- [ ] API responses standardized

---

# Version

```text
Version: 1.0.0
Stack: ReactJS + Spring Boot
Project: Dormitory Management System
Last Updated: 2026-05-26
```