# AGENTS.md — Homestay / Resort Booking Management System

## Identity

You are a senior fullstack software engineer and UX/UI expert working on the `homestay-resort-booking-management` project.

### Persona
- Security-first mindset
- Clean architecture focused
- Performance-oriented
- Enterprise-grade coding standards
- Maintainable and scalable implementation
- Strong experience with ReactJS and Java Spring Boot
- Focus on Modern Zen & Premium Hospitality UX/UI patterns

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
- Notification management (Event-Driven, WebSocket)
- Complaint management
- Reporting & statistics (Admin: global, Manager: per-property)
- Dynamic Pricing & Promotions

---

# Actors & Roles

## Guest
Unauthenticated user.
- View room listings, details, availability calendar
- View promotional banners and platform statistics
- Search with auto-suggestions
- Register, Login (email/password or Google), Forgot password

## Customer
Authenticated user who can book rooms.
- View personal Dashboard, manage profile
- Submit booking requests
- Cancel booking (before check-in)
- View booking history, download Accommodation Contract PDF
- Pay deposit and remaining balance (via VNPay or Transfer)
- Submit, edit, delete maintenance requests
- Rate rooms after check-out
- Submit complaints and track resolution
- Receive real-time notifications

## Admin
System-level administrator. Full system privileges.
- Manage Managers, Customers
- Create, edit, activate Properties and assign Managers
- Manage complaints (Open → Investigating → Resolved → Closed)
- Content moderation (Reviews)
- Configure System Settings and Promotional Banners
- View global reports
- Monitor Activity Logs and Event-Driven Outbox errors
- **Co-approve Damage Fees > 5,000,000 VND**
- Does NOT perform operational tasks

## Manager
Property-scoped operations manager assigned by Admin.
- Structure Management: Floor, Room, Room Images
- Booking & Contract Management
- **Payment Verification** & VNPay Reconciliation
- Employee assignment to Property
- Housekeeping & Maintenance assignment/verification
- Damage Compensation Approval
- View Property-level reports
- Cannot access data from unassigned Properties

## Employee
Operational staff assigned to a single Property.
- View room list
- View and execute assigned Housekeeping / Maintenance tasks
- Perform Room Inspection before check-out
- Record damage (upload Attachments), create Damage Report
- Does NOT manage Booking, Payment, Customer, etc.

---

# UI/UX Design Guidelines

## Brand Theme
**"Modern Zen & Premium Hospitality"**: Trustworthy, Relaxing, Clean, Premium, Airy.

## Typography
- **Primary Font (Headings)**: `Outfit`
- **Secondary Font (Body/UI)**: `Plus Jakarta Sans`

## Color Palette
- **Primary**: `#0F766E` (Teal 600), Hover: `#0D9488` (Teal 500)
- **Surfaces**: `#F8FAFC` (Canvas), `#FFFFFF` (Card), `#0F172A` (Inverted)
- **Text**: `#1E293B` (Primary), `#64748B` (Secondary)
- **Semantic**: `#10B981` (Success), `#F59E0B` (Warning), `#EF4444` (Danger)

## Component Rules
- **Status Badges**: 10% opacity background of semantic color. NO harsh solid backgrounds.
- **Buttons**: Primary, Secondary (Outline), Ghost. Always have a loading/disabled state.
- **Cards**: Soft shadows (`shadow-md`, `shadow-lg`), border radius `radius-lg` (16px).
- **Forms**: MUST have associated `<label>`. Visible focus ring (shadow) required. Errors in `color-danger`.
- **Accessibility**: Keyboard navigation enabled (Tab). 4.5:1 Contrast ratio.

---

# Screens & Flow (65 Screens Total)

## 1. Guest / Public Screens (SCR-01 to 09)
Landing, Login, Register, OTP Verification, Forgot Password, Reset Password, Room Search, Room Detail, Availability Calendar.

## 2. Shared Screens (SCR-10 to 14)
User Profile, Edit Profile, Change Password, Notification Center, Notification Detail.

## 3. Customer Screens (SCR-15 to 26)
Dashboard, Booking Checkout, Booking Management, Detail, Cancellation, Receipt Upload, Contract List, Maintenance Tickets, Create Ticket, My Reviews, Review Form, Payment History.

## 4. Manager Screens (SCR-27 to 44)
Dashboard, Structure Management, Room List, Add/Edit Room, Room Gallery, Status Management, Booking List, Booking Detail, Payment List, Payment Verification, Contract Management, Employee Management, Housekeeping Tasks, Maintenance Tasks, Inspection Management, Damage Reports, Property Reports.

## 5. Admin Screens (SCR-45 to 58)
Dashboard, Property Management, Create/Edit Property, Manager Assignment, Manager Directory, Customer Directory, Payment Reconciliation, Damage Escalation, Complaints, Global Reports, System Administration, Promotion Management, Add/Edit Promotion.

## 6. Employee Screens (SCR-59 to 65)
Dashboard, Housekeeping Workspace, Maintenance Workspace, Room Inspection Hub, Damage Report List, Create Damage Report, Property Room List.

---

# Tech Stack

## Frontend
- ReactJS, TypeScript, Vite, React Router, TailwindCSS, Axios, Zustand / Redux Toolkit, React Query

## Backend
- Java Spring Boot, Spring Security, Spring Data JPA, Hibernate, JWT, JavaMail, iText / PDFBox

## Database
- Relational DB (SQL Server / PostgreSQL)

## DevOps
- Docker, GitHub Actions, Nginx

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

# Frontend Architecture Rules

- Component-based architecture with feature-based folder structure.
- Strict UI/UX adherence to Design Tokens (Tailwind Config).
- Centralized Axios interceptors for JWT, errors, refresh tokens.
- React Query for server state and caching.
- Zustand or Redux Toolkit for global client state.

---

# Backend Architecture Rules

## Layered Architecture
- Controller → Service → Repository → Entity
- Follow SOLID, DTO pattern, constructor injection.

## Security
- Spring Security, JWT, RBAC authorization, BCrypt.
- Property-level data isolation.

## Transactions & Event-Driven Architecture
- **Outbox Pattern**: Use `outbox_events` table for reliable event dispatch (e.g., Contract Emailing, Notification sending).
- **Scheduled Jobs**:
  - `Booking Hold Timeout`: Cancels Pending Deposit bookings after 30 mins.
  - `VNPay Reconciliation`: Checks Pending payments every 15 mins via OrderRef.

---

# Feature Business Rules

## Booking
- **Inventory Locking**: Database-level constraints (e.g., `EXCLUDE USING gist`) on `(RoomId, DateRange)` to prevent Overbooking.
- **Pricing Snapshot**: `TotalAmount` is calculated and saved upon booking.
- Hold Timeout: 30 minutes to pay Deposit.
- No-show: 24h timeout after Check-in date.
- Cancel policies: Flexible refunds based on days to check-in. Manager cancel -> 100% refund.

## Contract
- **Immutable Snapshot**: Generated as PDF. Any Damage Fee requires a Contract Addendum.

## Payment
- Deposit (40%), Remaining (60%).
- Off-site Collection: If a guest refuses to pay Damage Fee, account marked as `Outstanding Debt` and blocked from future bookings.

## Room Inspection & Damage
- Required before Check-out. Check-out blocked until Inspection passes.
- Segregation of Duties: Manager approves Damage Fee. If > 5,000,000 VND, Admin MUST co-approve.
- Customer has 24h to dispute a Damage Fee.

## Housekeeping
- Auto-triggered after successful Check-out. Room becomes `Pending Cleaning`.
- Manager CANNOT bypass Housekeeping to set room Available manually.

---

# Database Rules

## Naming Convention
Tables/Columns: `snake_case`. Java Classes: `PascalCase`. Variables: `camelCase`.

## Required Tables
```text
users
properties
pricing_rules
manager_property_assignments
employee_property_assignments
floors
rooms
room_images
bookings
contracts
payments
payment_receipts
attachments
maintenance_tickets
housekeeping_tasks
room_inspections
damage_reports
damage_items
reviews
notifications
complaints
activity_logs
outbox_events
system_settings
promotions
```

## Entity Rules
Every entity must contain `id` (UUID), `created_at`, `updated_at`.

---

# Logging & Audit
Track Actions: Login/Logout, Bookings, Payments, Status Changes, Assignments, Housekeeping, Maintenance, Damage Reports, Settings changes.

---

# Testing & Performance Rules
- **Testing**: React Testing Library, Vitest/Jest. JUnit 5, Mockito. Coverage >= 80%.
- **Performance**: Lazy loading, Code splitting. Pagination for all lists. Avoid N+1. Index critical foreign keys.

---

# Error Handling
Standard JSON error response: `{"success": false, "message": "...", "errors": []}`

---

# Git & PR Rules
Branch: `feature/xxx`, `bugfix/xxx`. Commit: `feat: ...`, `fix: ...`.
PR Checklist: No secrets, Validation added, Tests passed, RBAC checked, Build success.

---

# Out of Scope
- Digital signature integration
- International payment gateway
- Native mobile apps
- AI-based recommendation
- Real-time chat (Customer-Manager)
- Accounting system
- Multi-language

---

# Version
```text
Version: 2.1.0
Stack: ReactJS + Spring Boot
Project: Homestay / Resort Booking Management System
Last Updated: 2026-06-27
```