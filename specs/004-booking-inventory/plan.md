# Implementation Plan: FR-04 Booking & Inventory Management

**Branch**: `006-booking-inventory` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-booking-inventory/spec.md`

**Nguồn docs**: `docs/Specification_v2.md` (FR-04, §5 Booking/Payment/OutboxEvent), `docs/api-spec-by-screen.md` (SCR-15–20, SCR-34–37), `docs/entity-ui-mapping.md` §2.1, `docs/Agents.md`, frontend `bookingApi.ts`, `paymentApi.ts`, booking pages

**Phụ thuộc**: FR-01 (auth CUSTOMER/MANAGER); FR-03 (room selection, PricingService); Room/Property data (FR-06/08). **Ranh giới**: Contract PDF template/worker (FR-10); VNPay reconciliation cron (FR-12); inspection dispute workflow (FR-23); housekeeping execution UI (FR-21); billing invoices (FR-11).

## Summary

Triển khai **FR-04 Booking & Inventory Management**: Customer đặt phòng + cọc 40% (VNPay/chuyển khoản), khóa tồn kho PostgreSQL `EXCLUDE gist`, snapshot giá, vòng đời booking (Pending Deposit → Confirmed → Checked-in → Inspection → Checked-out), hủy theo tier, Manager check-in/out/sửa/hủy, jobs timeout & no-show, Outbox trigger contract. Stack: **Spring Boot 3 + JPA + PostgreSQL** + **React/TypeScript** (pages đã có — migrate `/api/v1/bookings*`).

## Technical Context

**Language/Version**: Java 17+, TypeScript 5.x, React 18  
**Primary Dependencies**: Spring Boot 3.x, Spring Security, Spring Data JPA, `@Scheduled`, Flyway; Vite, Axios, React Router  
**Storage**: PostgreSQL 15+ — `bookings`, `booking_inventory_locks`, `payments`, `payment_receipts`, `outbox_events`, stubs `room_inspections`, `housekeeping_tasks`  
**Testing**: JUnit 5 + Mockito; `@SpringBootTest` concurrent booking IT; Testcontainers PostgreSQL for EXCLUDE constraint; Vitest for booking form validation  
**Target Platform**: Web application  
**Project Type**: `frontend/` + `backend/`  
**Performance Goals**: Create booking p95 < 1s; SC-001 checkout < 5 min user flow; zero overbooking under concurrent test  
**Constraints**: `@Transactional` on create/cancel/modify; property-level RBAC; envelope `{ success, message, data }`; hold timeout configurable  
**Scale/Scope**: ~15 REST endpoints; 7 user stories; SCR-16–20, 34–35 (+ SCR-37 payment verify side-effect)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Layered architecture (Controller → Service → Repository) | PASS | AGENTS.md |
| DTO + Bean Validation | PASS | CreateBookingRequest, date/guest validation |
| Security-first (RBAC, self-scope, property isolation) | PASS | Customer own booking; Manager @PropertyAccess |
| No secrets in code | PASS | VNPay keys in env |
| `@Transactional` for booking/payment | PASS | create, cancel, modify, confirm deposit |
| Test coverage ≥80% | PASS | State machine + concurrent lock IT |
| Standard API envelope + pagination | PASS | api-spec §1 |
| Audit log for booking actions | PASS | ActivityLog BOOKING_* |

**Post-design re-check**: PASS — inventory EXCLUDE constraint + Outbox decouple contract; FR-10/12/23 stubs documented in data-model.

## Project Structure

### Documentation (this feature)

```text
specs/004-booking-inventory/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/booking-api.yaml
├── spec.md
└── tasks.md              # /speckit-tasks (next)
```

### Source Code (repository root)

```text
backend/src/main/java/com/homestay/
├── controllers/
│   ├── BookingController.java              # POST /bookings, GET /bookings/me/*
│   └── ManagerBookingController.java       # /manager/bookings/*
├── dtos/booking/
│   ├── CreateBookingRequest.java
│   ├── CreateBookingResponse.java
│   ├── BookingSummaryResponse.java
│   ├── BookingDetailResponse.java
│   ├── CancelBookingRequest.java
│   ├── CancellationPreviewResponse.java
│   ├── ModifyBookingRequest.java
│   └── UploadReceiptRequest.java
├── entities/
│   ├── Booking.java
│   ├── BookingInventoryLock.java
│   ├── Payment.java
│   ├── PaymentReceipt.java
│   └── OutboxEvent.java
├── enums/BookingStatus.java, PaymentMethod.java, PaymentType.java
├── repositories/BookingRepository.java, BookingInventoryLockRepository.java
├── services/
│   ├── BookingService.java                 # create, get, list
│   ├── BookingStateService.java            # transitions
│   ├── BookingPricingService.java          # snapshot 40/60
│   ├── InventoryLockService.java           # gist lock insert/release
│   ├── CancellationPolicyService.java      # refund tiers
│   ├── BookingModificationService.java     # FR-015
│   ├── DepositConfirmationService.java     # VNPay + bank verify hook
│   └── OutboxPublisher.java
├── jobs/
│   ├── BookingHoldTimeoutJob.java
│   └── BookingNoShowJob.java
├── security/PropertyAccessValidator.java
└── configs/SecurityConfig.java             # CUSTOMER/MANAGER routes

backend/src/test/java/com/homestay/
├── unit/BookingStateServiceTest.java
├── unit/CancellationPolicyServiceTest.java
├── integration/BookingControllerIT.java
└── integration/ConcurrentBookingIT.java    # zero overbooking

frontend/src/
├── api/bookingApi.ts           # migrate → /api/v1/bookings/*
├── api/paymentApi.ts           # migrate → /api/v1/payments/*
├── pages/customer/
│   ├── BookingFormPage.tsx     # SCR-16 — wire real API
│   ├── BookingListPage.tsx     # SCR-17
│   ├── BookingDetailPage.tsx   # SCR-18
│   ├── BookingCancellationPage.tsx  # SCR-19
│   └── PaymentPages.tsx        # SCR-20 receipt upload
└── pages/manager/
    ├── BookingMgmtListPage.tsx # SCR-34
    └── BookingMgmtDetailPage.tsx # SCR-35 check-in/out
```

**Structure Decision**: Backend booking module is primary work; frontend pages exist but many use mock/TODO and legacy `/api/bookings` paths.

## Implementation Phases

| Phase | Scope | Traceability |
|-------|-------|--------------|
| **A** | Flyway: bookings, inventory_locks, payments, outbox, gist extension | data-model.md |
| **B** | Entities + BookingPricingService + InventoryLockService | US-1, FR-002–003 |
| **C** | POST /bookings, hold_expires_at, deposit Payment row | US-1, FR-001, FR-007 |
| **D** | VNPay deposit URL + callback hook → CONFIRMED + Outbox | US-1, FR-005–006 |
| **E** | Bank transfer receipt + manager verify → CONFIRMED | US-5, FR-017 |
| **F** | GET /bookings/me, /bookings/me/{id} customer scope | US-2, FR-009 |
| **G** | GET /manager/bookings, check-in, check-out + inspection gate stub | US-3, FR-011–014 |
| **H** | Cancel preview + customer cancel + refund tiers | US-4, FR-010 |
| **I** | Manager cancel (100%) + modify Confirmed | US-6, FR-015–016 |
| **J** | Scheduled jobs: hold timeout, no-show | US-7, FR-007–008 |
| **K** | Frontend path migration + wire BookingFormPage | all US |
| **L** | Tests + quickstart validation | SC-001–SC-007 |

## Frontend Gap Analysis

| Item | Hiện tại | Target |
|------|----------|--------|
| Create booking | `POST /api/bookings` (mock in BookingFormPage) | `POST /api/v1/bookings` + paymentMethod |
| My bookings | `GET /api/bookings` | `GET /api/v1/bookings/me` |
| Detail | `GET /api/bookings/{id}` | `GET /api/v1/bookings/me/{id}` |
| Cancel | `PATCH /api/bookings/{id}/cancel` | Same under `/api/v1` + preview endpoint |
| Manager list | `GET /api/bookings` (manager) | `GET /api/v1/manager/bookings?propertyId=` |
| Check-in/out | `/api/bookings/{id}/check-in` | `/api/v1/manager/bookings/{id}/check-in` |
| VNPay URL | `/api/payments/vnpay/create-url` | `/api/v1/payments/vnpay/create-url` |
| Verify payment | `POST /api/manager/payments/{id}/verify` | `PATCH /api/v1/manager/payments/{id}/verify` |
| Receipt upload | Not wired | `POST /api/v1/bookings/{id}/receipts` |
| Modify booking | No UI/API | `PATCH /api/v1/manager/bookings/{id}` (new) |

## Risks

| Risk | Mitigation |
|------|------------|
| Backend chưa scaffold | Follow FR-01/03 package layout; seed room + customer |
| FR-10 contract worker missing | Outbox event + no-op processor until FR-10 |
| FR-23 inspection UI missing | Minimal PASSED stub + manual seed for checkout test |
| api-spec vs spec hold timeout | 30 min per research.md #2 |
| Duplicate bookingApi + bookingsApi | Consolidate in implementation phase K |

## Generated Artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/booking-api.yaml](./contracts/booking-api.yaml)
- [quickstart.md](./quickstart.md)

## Next Step

Run **`/speckit-tasks`** to generate dependency-ordered `tasks.md`.
