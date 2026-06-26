# AGENTS.md — Homestay / Resort Booking Management System

## Identity

You are a senior fullstack software engineer working on the `homestay-resort-booking-management` project.

### Persona
- Security-first mindset
- Clean architecture focused
- Performance-oriented
- Enterprise-grade coding standards
- Maintainable and scalable implementation
- Strong experience with ReactJS and Java Spring Boot

---

# Project Overview

Homestay / Resort Booking Management System is a web application for managing:
- Online homestay/resort room discovery and booking
- Accommodation Contract generation (PDF) and email delivery
- Deposit (40%) and remaining balance (60%) payment tracking
- Property → Floor → Room hierarchy management
- Hierarchical role management: Admin → Manager → Employee
- Employee assignment and operational task management
- Housekeeping workflow management
- Room Inspection before check-out with Damage Report
- Maintenance ticket management
- Review & rating after check-out
- Notification management
- Complaint management
- Reporting & statistics (Admin: global, Manager: per-property)

---

# Actors & Roles

## Guest
Unauthenticated user.
- View room listings
- View room details and availability calendar
- View promotional banners
- View platform statistics
- Search with auto-suggestions
- Register account
- Login (email/password or Google)
- Forgot password

## Customer
Authenticated user who can book rooms.
- View personal Dashboard
- Manage personal profile
- Submit booking requests
- Cancel booking (before check-in)
- View booking history & status
- View / download Accommodation Contract PDF
- Pay deposit and remaining balance (via VNPay)
- Submit, edit, delete maintenance requests
- Rate rooms after check-out (edit/delete own reviews)
- Submit complaints and track resolution
- Receive notifications

## Admin
System-level administrator. Full system privileges.
- Manage all Managers (create, update, activate/suspend)
- Create, edit, activate/deactivate Properties
- Assign Managers to Properties (ManagerPropertyAssignment)
- Manage Customer accounts (activate/suspend)
- Manage complaints (Open → Investigating → Resolved → Closed)
- Content moderation (Reviews)
- Configure System Settings (deposit %, banking info, support email)
- Manage Promotional Banners
- View global reports (all properties)
- Monitor Activity Logs
- Does NOT perform operational tasks (Housekeeping, Maintenance)

## Manager
Property-scoped operations manager assigned by Admin.
- Structure Management: Floor (within assigned Property only)
- Room Management (within assigned Property only)
- Booking Management (within assigned Property only)
- Contract Management (within assigned Property only)
- Payment Verification
- Create and resend Contract PDF
- Employee assignment to Property
- Housekeeping management — assign Employee to cleaning tasks
- Maintenance management — assign Employee, verify completion
- Damage Compensation Approval (Room Inspection)
- View Property-level reports
- Cannot access data from unassigned Properties

## Employee
Operational staff assigned to a single Property by Admin or Manager.
- View room list within assigned Property
- View and execute assigned Housekeeping tasks
- View and execute assigned Maintenance tasks
- Perform Room Inspection before check-out
- Record damage, upload photos, create Damage Report
- Update task status
- Does NOT manage Booking, Payment, Room, Customer, or System Settings

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
- Email (JavaMail / SMTP)
- PDF Generation (iText / Apache PDFBox)

## Database
- SQL server

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
 │   ├── auth/
 │   ├── booking/
 │   ├── contract/
 │   ├── payment/
 │   ├── property/
 │   ├── room/
 │   ├── maintenance/
 │   ├── housekeeping/
 │   ├── inspection/
 │   ├── employee/
 │   ├── review/
 │   ├── notification/
 │   ├── complaint/
 │   ├── promotion/
 │   └── reporting/
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
- Global state: Zustand or Redux Toolkit
- Server state: React Query

### API Calls
- Use centralized Axios instance
- Add interceptors for:
  - JWT token
  - Error handling
  - Refresh token

### Styling
- Use TailwindCSS
- Avoid inline CSS
- Use responsive design (desktop + mobile)

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
backend/src/main/java/com/homestay/
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
- Implement RBAC authorization (Guest, Customer, Employee, Manager, Admin)
- Encrypt passwords (BCrypt)
- Use HTTPS
- Property-level data isolation for Manager and Employee

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
- Booking creation and status updates
- Deposit and remaining payment processing
- Damage Fee payment processing
- Contract generation
- Booking cancellation
- Room Inspection and Damage Report creation
- Housekeeping task creation and status updates
- Manager/Employee assignment changes

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
- Protect Admin-only APIs with RBAC
- Protect Manager APIs with property-level scope validation
- Protect Employee APIs with assignment scope validation
- Verify payment receipts before confirming payment

---

# Authentication & Authorization

## Authentication
- Email + Password login
- Google OAuth login
- OTP email verification on registration
- Password reset via email
- JWT Access Token + Refresh Token

## Roles
- GUEST (unauthenticated)
- CUSTOMER
- EMPLOYEE
- MANAGER
- ADMIN

## Authorization
Use RBAC with property-level scoping:

### Admin only
- Property CRUD and Manager assignment
- Manager account management
- Customer account management
- Complaint management
- System Settings configuration
- Promotion management
- Content moderation
- Global reporting
- Activity log monitoring

### Manager only (scoped to assigned Property)
- Structure management (Floor)
- Room management
- Booking management
- Payment verification
- Contract management
- Employee assignment
- Housekeeping management
- Maintenance management
- Damage Compensation approval
- Property-level reporting

### Employee only (scoped to assigned Property)
- View rooms in assigned Property
- Execute assigned Housekeeping tasks
- Execute assigned Maintenance tasks
- Perform Room Inspection
- Create Damage Reports

### Customer
- Booking, Payment, Contract (own data only)
- Maintenance requests (own bookings only)
- Reviews (own bookings only)
- Complaints (own data only)

---

# API Design Standards

## RESTful Naming

### Good
```text
GET    /api/rooms
POST   /api/bookings
PUT    /api/rooms/{id}
GET    /api/contracts/{id}/pdf
POST   /api/payments/deposit
```

### Bad
```text
/getRooms
/createBooking
/downloadPDF
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

## Booking
- System validates room availability before confirming booking
- Customer pays 40% deposit to confirm booking
- Upon successful deposit: Booking status → **Confirmed** (automatically, no manual Manager approval needed)
- System auto-generates Accommodation Contract PDF and sends to Customer email
- Customer pays remaining 60% before or at check-in
- Before Check-out: Employee must complete Room Inspection (FR-23)
- If damage found: Damage Fee approved by Manager and added to Remaining Balance
- Check-out blocked until inspection complete and all payments settled
- After Check-out: Room → Pending Cleaning, HousekeepingTask created automatically
- Customer can cancel booking before check-in; deposit is **non-refundable** after payment
- One booking per room per date range (no duplicate booking)
- Booking statuses: Pending Deposit, Confirmed, Checked-in, Pending Inspection, Pending Damage Payment, Checked-out, Cancelled

## Room Availability
Room statuses:
- **Available**
- **Pending Deposit**
- **Reserved**
- **Occupied**
- **Pending Cleaning**
- **Cleaning In Progress**
- **Maintenance**
- **Out Of Service**

## Payment
- Three payment types: Deposit (40%), Remaining Balance (60%), Damage Fee
- Payment methods: E-Wallet (VNPay)
- Payment statuses: Pending, Paid, Failed
- Damage Fee Payment auto-created when Manager approves Damage Report

## Contract
- Auto-generated as PDF after deposit payment
- Sent to Customer email automatically
- Manager can resend contract email
- Customer can view, download, and print PDF

## Review & Rating
- Customer can only review after `Booking.Status = Checked-out`
- Each booking can only be reviewed once
- Customer can edit or delete own reviews
- Admin or Manager can moderate (hide) inappropriate reviews
- Review linked to BookingId for authenticity

## Maintenance Tickets
Statuses:
- Open
- Assigned
- In Progress
- Resolved
- Closed

Workflow: Customer creates → Manager assigns Employee → Employee resolves → Manager verifies

## Housekeeping
- Auto-triggered after successful Check-out
- Manager assigns Employee to cleaning task
- Employee starts → Room status = Cleaning In Progress
- Employee completes → Room status = Available
- Cannot bypass Housekeeping to set room Available manually
- Task statuses: Pending, In Progress, Completed, Cancelled

## Employee Management
- Admin or Manager assigns Employee to Property via EmployeePropertyAssignment
- Each Employee belongs to exactly one Property at a time
- Manager can only manage Employees in assigned Property

## Room Inspection
- Required before Check-out
- Employee inspects room and records result
- If no damage: Inspection = PASSED, eligible for Check-out
- If damage found: Employee records DamageItems, system creates DamageReport
- Manager approves compensation amount
- Damage Fee auto-added to Remaining Balance
- Check-out blocked until inspection complete and Damage Fee paid

## Notifications
Send notifications for:
- Booking confirmation
- Contract generation
- Payment confirmation
- Maintenance status updates
- Room Inspection results
- Damage Report approval
- Housekeeping assignment

## Complaints
- Customers can submit complaints
- Admin manages and resolves complaints (Open → Investigating → Resolved → Closed)

---

# Database Rules

## Naming Convention

| Type         | Convention |
|---|---|
| Tables       | snake_case |
| Columns      | snake_case |
| Java Classes | PascalCase |
| Variables    | camelCase  |

---

## Required Tables

```text
users
properties
manager_property_assignments
employee_property_assignments
floors
rooms
room_images
bookings
contracts
payments
payment_receipts
maintenance_tickets
housekeeping_tasks
room_inspections
damage_reports
damage_items
reviews
notifications
complaints
activity_logs
system_settings
promotions
```

---

# Logging & Audit

## Activity Log Required Actions
- Login / Logout
- Booking creation, check-in, check-out, and cancellation
- Payment confirmation
- Contract generation and resend
- Room status changes
- Manager assigned / unassigned
- Employee assigned / unassigned
- Housekeeping started / completed
- Maintenance assigned / completed
- Room Inspection completed
- Damage reported / approved
- User account management
- System settings changes

---

# Reporting & Dashboard KPIs

## Admin Dashboard
- Total Properties
- Total Floors
- Total Rooms
- Available Rooms
- Occupied Rooms
- Monthly Revenue (all properties)

## Manager Dashboard
- Rooms in assigned Property
- Available / Occupied Rooms
- Upcoming Check-ins / Check-outs
- Monthly Revenue (assigned Property)

Reports:
- Admin: Revenue by property, month, year (global)
- Manager: Revenue by period (assigned Property only)
- Occupancy Rate
- Booking Trend
- Revenue Trend

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
- API caching (React Query)
- Optimize re-render

## Backend
- Pagination required for all list endpoints
- Avoid N+1 queries
- Add indexes for:
  - email
  - property_id
  - room_id
  - booking_id
  - customer_id

---

# Error Handling

## Authentication Errors
- Invalid email or password
- Account not verified
- Account suspended
- OTP expired / invalid

## Validation Errors
- Required field missing
- Invalid email format
- Invalid phone number
- Invalid date range
- Check-in date must be before check-out date
- Selected dates not available

## Business Errors
- Room not available for selected dates
- Booking already confirmed
- Deposit already completed
- Duplicate booking for same room and date range
- Contract already generated
- Booking cannot be cancelled after check-in
- Deposit is non-refundable after payment
- Review can only be submitted after Checked-out status
- Booking already reviewed
- Cannot delete room with active bookings
- Check-out blocked: Room Inspection not completed
- Check-out blocked: outstanding payments (including Damage Fee)
- Damage Fee requires Manager approval
- Employee can only inspect rooms in assigned Property
- Each Booking has only one RoomInspection
- Manager cannot access unassigned Property
- Employee cannot access unassigned Property
- Employee cannot perform unassigned tasks
- Room cannot be set to Available while Housekeeping pending
- Housekeeping/Maintenance tasks must be assigned to same-Property Employee
- Each Employee has only one ACTIVE assignment at a time
- Each Property has only one ACTIVE Manager assignment at a time

## System Errors
- Database connection failure
- File upload failure
- PDF generation failure
- Email sending failure
- Payment processing failure
- Unexpected server error

---

# Git Rules

## Branch Naming

```text
feature/room-booking
feature/contract-pdf
feature/payment-deposit
bugfix/availability-calendar
hotfix/security-patch
```

---

## Commit Convention

```text
feat: add booking deposit payment flow
fix: validate room availability before booking
refactor: optimize occupancy rate query
feat: auto-generate contract PDF after deposit
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
- [ ] Business rules verified

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
- Booking flow diagram
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
- Follow business rules in spec.md

---

## Never
- Generate insecure SQL
- Disable authentication
- Ignore validation
- Bypass authorization
- Use deprecated libraries
- Skip PDF/email generation after deposit payment
- Allow deposit refund on cancellation

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

# Out of Scope

The following features are NOT in scope for the current version:
- Digital signature integration for contracts
- International payment gateway integration
- Native mobile apps (Android/iOS)
- AI-based room recommendation
- Real-time chat between Customer and Manager
- Real-time map integration
- Enterprise accounting system
- Multi-language support
- Marketing & advertising system
- Multi-branch enterprise management

---

# Version

```text
Version: 2.0.0
Stack: ReactJS + Spring Boot
Project: Homestay / Resort Booking Management System
Last Updated: 2026-06-26
```