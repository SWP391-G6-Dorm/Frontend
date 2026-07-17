# Tasks: FR-04 Booking & Inventory Management

**Input**: Design documents from `specs/004-booking-inventory/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/booking-api.yaml, quickstart.md

**Phụ thuộc**: FR-01 (auth JWT, SecurityConfig); FR-03 (PricingService, room availability); seed Room/Property (FR-06/08 hoặc FR-03 seed). **Ranh giới**: Contract PDF worker (FR-10), VNPay reconciliation cron (FR-12), inspection dispute UI (FR-23), housekeeping execution (FR-21).

**Tests**: Không có phase test riêng per-story (spec không yêu cầu TDD). Unit + integration tests trong Phase Polish per plan Phase L.

**Organization**: Tasks grouped by user story (US1–US7) for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking deps)
- **[Story]**: US1–US7 maps to spec.md user stories

## Path Conventions

- **Backend**: `backend/src/main/java/com/homestay/`
- **Backend tests**: `backend/src/test/java/com/homestay/`
- **Frontend**: `frontend/src/`
- **Migrations**: `backend/src/main/resources/db/migration/`
- **Contract**: `specs/004-booking-inventory/contracts/booking-api.yaml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migrations, env config, verify scaffold

- [ ] T001 Verify backend Spring Boot scaffold exists (or complete FR-01 setup) per `specs/001-user-auth/plan.md`
- [ ] T002 [P] Confirm Vite proxy `/api/v1` → backend in `frontend/vite.config.ts`
- [ ] T003 [P] Add `BOOKING_HOLD_TIMEOUT_MINUTES` (default 30) to `backend/src/main/resources/application.yml` and document in `specs/004-booking-inventory/quickstart.md`
- [ ] T004 Create Flyway `backend/src/main/resources/db/migration/V020__enable_btree_gist.sql` — `CREATE EXTENSION IF NOT EXISTS btree_gist`
- [ ] T005 Create Flyway `backend/src/main/resources/db/migration/V021__bookings_and_inventory_locks.sql` — `bookings`, `booking_inventory_locks` with `EXCLUDE USING gist` per `data-model.md`
- [ ] T006 [P] Create Flyway `backend/src/main/resources/db/migration/V022__payments_and_receipts.sql` — `payments`, `payment_receipts` tables per `data-model.md`
- [ ] T007 [P] Create Flyway `backend/src/main/resources/db/migration/V023__outbox_and_booking_stubs.sql` — `outbox_events`, `room_inspections`, `housekeeping_tasks` stub columns per `data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Entities, enums, core services, security, DTOs — MUST complete before user story phases

**⚠️ CRITICAL**: No user story work until this phase complete

- [ ] T008 [P] Create `BookingStatus.java` enum in `backend/src/main/java/com/homestay/enums/BookingStatus.java` per data-model.md
- [ ] T009 [P] Create `PaymentMethod.java`, `PaymentType.java`, `PaymentStatus.java` enums in `backend/src/main/java/com/homestay/enums/`
- [ ] T010 [P] Create `Booking.java` entity in `backend/src/main/java/com/homestay/entities/Booking.java` with `@Version rowVersion`
- [ ] T011 [P] Create `BookingInventoryLock.java` entity in `backend/src/main/java/com/homestay/entities/BookingInventoryLock.java`
- [ ] T012 [P] Create `Payment.java` entity in `backend/src/main/java/com/homestay/entities/Payment.java`
- [ ] T013 [P] Create `PaymentReceipt.java` entity in `backend/src/main/java/com/homestay/entities/PaymentReceipt.java`
- [ ] T014 [P] Create `OutboxEvent.java` entity in `backend/src/main/java/com/homestay/entities/OutboxEvent.java`
- [ ] T015 [P] Create `RoomInspection.java` stub entity in `backend/src/main/java/com/homestay/entities/RoomInspection.java`
- [ ] T016 [P] Create `HousekeepingTask.java` stub entity in `backend/src/main/java/com/homestay/entities/HousekeepingTask.java`
- [ ] T017 [P] Create JPA repositories in `backend/src/main/java/com/homestay/repositories/` — `BookingRepository`, `BookingInventoryLockRepository`, `PaymentRepository`, `PaymentReceiptRepository`, `OutboxEventRepository`, `RoomInspectionRepository`, `HousekeepingTaskRepository`
- [ ] T018 Create `BookingPricingService.java` in `backend/src/main/java/com/homestay/services/BookingPricingService.java` — snapshot 40/60 using FR-03 `PricingService`
- [ ] T019 Create `InventoryLockService.java` in `backend/src/main/java/com/homestay/services/InventoryLockService.java` — insert/release daterange lock in same transaction per research.md #1
- [ ] T020 Create `BookingStateService.java` in `backend/src/main/java/com/homestay/services/BookingStateService.java` — legal transition enforcement per data-model.md state table
- [ ] T021 Create `OutboxPublisher.java` in `backend/src/main/java/com/homestay/services/OutboxPublisher.java` — publish `CONTRACT_GENERATE_REQUESTED` on CONFIRMED
- [ ] T022 [P] Create booking DTOs in `backend/src/main/java/com/homestay/dtos/booking/` — `CreateBookingRequest`, `CreateBookingResponse`, `BookingSummaryResponse`, `BookingDetailResponse`, `CancelBookingRequest`, `CancellationPreviewResponse`, `ModifyBookingRequest`, `UploadReceiptRequest` per contracts/booking-api.yaml
- [ ] T023 Create `PropertyAccessValidator.java` in `backend/src/main/java/com/homestay/security/PropertyAccessValidator.java` — manager property assignment check
- [ ] T024 Register CUSTOMER `/api/v1/bookings/**` and MANAGER `/api/v1/manager/bookings/**` routes in `backend/src/main/java/com/homestay/configs/SecurityConfig.java` per research.md #13
- [ ] T025 [P] Consolidate and migrate `frontend/src/api/bookingApi.ts` paths from `/api/bookings` to `/api/v1/bookings` and `/api/v1/bookings/me`
- [ ] T026 [P] Migrate `frontend/src/api/paymentApi.ts` paths to `/api/v1/payments` and `/api/v1/manager/payments`
- [ ] T027 [P] Deprecate duplicate `frontend/src/api/bookingsApi.ts` — merge into `bookingApi.ts` and update imports across customer pages

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Customer đặt phòng và thanh toán cọc (Priority: P1) 🎯 MVP

**Goal**: SCR-16 — create booking Pending Deposit, inventory lock, 40/60 snapshot, VNPay deposit redirect

**Independent Test**: Customer POST `/api/v1/bookings` → PENDING_DEPOSIT + holdExpiresAt; second concurrent booking same room/dates → 409; VNPay URL returned when paymentMethod=VNPAY

### Implementation

- [ ] T028 [US1] Implement `BookingService.create()` in `backend/src/main/java/com/homestay/services/BookingService.java` — validate dates, capacity, room bookable, `@Transactional`
- [ ] T029 [US1] Call `InventoryLockService.acquire()` and set `holdExpiresAt` in `BookingService.create()` per research.md #2
- [ ] T030 [US1] Create DEPOSIT Payment row (PENDING) in `BookingService.create()` when booking created
- [ ] T031 [US1] Create `BookingController.java` in `backend/src/main/java/com/homestay/controllers/BookingController.java` with `POST /api/v1/bookings` per contracts/booking-api.yaml
- [ ] T032 [US1] Implement `DepositConfirmationService.java` in `backend/src/main/java/com/homestay/services/DepositConfirmationService.java` — transition PENDING_DEPOSIT → CONFIRMED, publish Outbox
- [ ] T033 [US1] Create `PaymentController.java` with `POST /api/v1/payments/vnpay/create-url` in `backend/src/main/java/com/homestay/controllers/PaymentController.java`
- [ ] T034 [US1] Implement VNPay URL generation in `backend/src/main/java/com/homestay/services/VNPayService.java` with unique `OrderRef` idempotency per research.md #5
- [ ] T035 [US1] Add VNPay IPN/callback handler in `backend/src/main/java/com/homestay/controllers/VNPayCallbackController.java` → `DepositConfirmationService.confirmDeposit()` on success
- [ ] T036 [P] [US1] Log `BOOKING_CREATED` to ActivityLog in `BookingService.create()` per plan Constitution Check
- [ ] T037 [US1] Wire `frontend/src/pages/customer/BookingFormPage.tsx` — remove ROOM_MOCK, call `bookingApi.createBooking()` with roomId from route + query params
- [ ] T038 [US1] Add paymentMethod selector (VNPAY / BANK_TRANSFER) and deposit summary (40%) in `frontend/src/pages/customer/BookingFormPage.tsx`
- [ ] T039 [US1] On VNPAY success response redirect to `paymentUrl` in `frontend/src/pages/customer/BookingFormPage.tsx`; on BANK_TRANSFER navigate to receipt upload route

**Checkpoint**: US1 MVP — customer can create booking and start VNPay deposit

---

## Phase 4: User Story 2 — Customer xem và theo dõi booking (Priority: P1)

**Goal**: SCR-17/18 — list and detail own bookings with status tabs and actions

**Independent Test**: `GET /api/v1/bookings/me` returns only own bookings; `GET /api/v1/bookings/me/{id}` returns paidAmount, remainingAmount, actions; 403 for other customer's id

### Implementation

- [ ] T040 [US2] Add `BookingService.listForCustomer()` with pagination and status filter in `backend/src/main/java/com/homestay/services/BookingService.java`
- [ ] T041 [US2] Add `BookingService.getDetailForCustomer()` with self-scope check in `backend/src/main/java/com/homestay/services/BookingService.java`
- [ ] T042 [US2] Build `actions[]` (PAY_DEPOSIT, UPLOAD_RECEIPT, PAY_REMAINING, CANCEL) based on status in `BookingDetailResponse` mapper
- [ ] T043 [US2] Add `GET /api/v1/bookings/me` in `backend/src/main/java/com/homestay/controllers/BookingController.java`
- [ ] T044 [US2] Add `GET /api/v1/bookings/me/{id}` in `backend/src/main/java/com/homestay/controllers/BookingController.java`
- [ ] T045 [P] [US2] Wire status tabs (All, Upcoming, Completed, Cancelled) in `frontend/src/pages/customer/BookingListPage.tsx` using `GET /bookings/me`
- [ ] T046 [P] [US2] Wire price breakdown and action buttons in `frontend/src/pages/customer/BookingDetailPage.tsx`
- [ ] T047 [US2] Show upcoming stay card on `frontend/src/pages/customer/CustomerDashboardPage.tsx` from first CONFIRMED upcoming booking

**Checkpoint**: US2 testable — customer booking list and detail SCR-17/18

---

## Phase 5: User Story 3 — Manager check-in và check-out (Priority: P1)

**Goal**: SCR-34/35 — manager list/detail, check-in, check-out with inspection gate + housekeeping stub

**Independent Test**: Manager GET `/manager/bookings?propertyId=` scoped to assignment; check-in Confirmed → CHECKED_IN; check-out blocked until inspection PASSED; success → CHECKED_OUT + HousekeepingTask

### Implementation

- [ ] T048 [US3] Add `BookingService.listForManager()` with propertyId + status filter in `backend/src/main/java/com/homestay/services/BookingService.java`
- [ ] T049 [US3] Add `BookingService.getDetailForManager()` with `PropertyAccessValidator` in `backend/src/main/java/com/homestay/services/BookingService.java`
- [ ] T050 [US3] Create `ManagerBookingController.java` in `backend/src/main/java/com/homestay/controllers/ManagerBookingController.java` with `GET /api/v1/manager/bookings` and `GET /api/v1/manager/bookings/{id}`
- [ ] T051 [US3] Implement check-in transition CONFIRMED → CHECKED_IN with optional remaining balance gate in `BookingStateService.java`
- [ ] T052 [US3] Add `PATCH /api/v1/manager/bookings/{id}/check-in` in `ManagerBookingController.java`
- [ ] T053 [US3] Create `RoomInspectionService.java` stub in `backend/src/main/java/com/homestay/services/RoomInspectionService.java` — `isPassed(bookingId)` for checkout gate
- [ ] T054 [US3] Create `HousekeepingTaskService.java` stub in `backend/src/main/java/com/homestay/services/HousekeepingTaskService.java` — create PENDING task on checkout
- [ ] T055 [US3] Implement check-out CHECKED_IN → CHECKED_OUT — release inventory lock, room → PENDING_CLEANING in `BookingStateService.java`
- [ ] T056 [US3] Add `PATCH /api/v1/manager/bookings/{id}/check-out` returning 409 INSPECTION_REQUIRED when not passed in `ManagerBookingController.java`
- [ ] T057 [P] [US3] Wire search/filter table in `frontend/src/pages/manager/BookingMgmtListPage.tsx`
- [ ] T058 [US3] Wire check-in/check-out buttons and status reload in `frontend/src/pages/manager/BookingMgmtDetailPage.tsx`

**Checkpoint**: US3 testable — manager operational flow SCR-34/35

---

## Phase 6: User Story 4 — Customer hủy booking theo chính sách hoàn tiền (Priority: P2)

**Goal**: SCR-19 — cancellation preview with refund tiers, customer cancel before check-in

**Independent Test**: Preview shows 100%/50%/0% by days until check-in; PATCH cancel → CANCELLED + inventory released; 409 after CHECKED_IN

### Implementation

- [ ] T059 [US4] Create `CancellationPolicyService.java` in `backend/src/main/java/com/homestay/services/CancellationPolicyService.java` — tiers ≥7d/3-7d/<3d per research.md #7
- [ ] T060 [US4] Add `GET /api/v1/bookings/{id}/cancel/preview` in `backend/src/main/java/com/homestay/controllers/BookingController.java`
- [ ] T061 [US4] Implement customer cancel in `BookingService.cancelByCustomer()` — apply refund tier, release lock, ActivityLog in `backend/src/main/java/com/homestay/services/BookingService.java`
- [ ] T062 [US4] Add `PATCH /api/v1/bookings/{id}/cancel` in `backend/src/main/java/com/homestay/controllers/BookingController.java`
- [ ] T063 [US4] Wire refund preview display and confirm cancel in `frontend/src/pages/customer/BookingCancellationPage.tsx`
- [ ] T064 [P] [US4] Create REFUND payment record stub on cancel in `CancellationPolicyService.java` (full processing deferred to FR-12)

**Checkpoint**: US4 testable — SCR-19 cancellation flow

---

## Phase 7: User Story 5 — Cọc chuyển khoản và xác minh Manager (Priority: P2)

**Goal**: SCR-20/37 — upload receipt, manager verify → CONFIRMED + contract outbox

**Independent Test**: Create with BANK_TRANSFER → upload receipt → manager APPROVED → CONFIRMED; REJECTED stays Pending Deposit

### Implementation

- [ ] T065 [US5] Add `POST /api/v1/bookings/{id}/receipts` in `backend/src/main/java/com/homestay/controllers/BookingController.java` — save PaymentReceipt, notify manager stub
- [ ] T066 [US5] Implement receipt upload validation (booking PENDING_DEPOSIT, own booking) in `BookingService.uploadReceipt()`
- [ ] T067 [US5] Add `PATCH /api/v1/manager/payments/{id}/verify` in `backend/src/main/java/com/homestay/controllers/ManagerPaymentController.java` per contracts/booking-api.yaml
- [ ] T068 [US5] On APPROVED deposit payment call `DepositConfirmationService.confirmDeposit()` in `ManagerPaymentController.java` or `DepositConfirmationService.java`
- [ ] T069 [US5] Wire receipt upload form in `frontend/src/pages/customer/PaymentPages.tsx` (SCR-20)
- [ ] T070 [US5] Wire approve/reject in `frontend/src/pages/manager/PaymentMgmtVerificationPage.tsx` using PATCH verify endpoint

**Checkpoint**: US5 testable — bank transfer deposit path end-to-end

---

## Phase 8: User Story 6 — Manager sửa booking Confirmed (Priority: P2)

**Goal**: Modify dates/room on Confirmed booking; manager-initiated cancel with 100% refund

**Independent Test**: PATCH manager booking with new dates → priceDelta returned; conflict room → 409; manager cancel → 100% refund regardless of days

### Implementation

- [ ] T071 [US6] Create `BookingModificationService.java` in `backend/src/main/java/com/homestay/services/BookingModificationService.java` — recalculate snapshot, swap inventory lock per research.md #9
- [ ] T072 [US6] Add `PATCH /api/v1/manager/bookings/{id}` in `ManagerBookingController.java` — CONFIRMED only, optimistic lock on rowVersion
- [ ] T073 [US6] Implement `BookingService.cancelByManager()` — 100% deposit refund, release lock in `backend/src/main/java/com/homestay/services/BookingService.java`
- [ ] T074 [US6] Add `PATCH /api/v1/manager/bookings/{id}/cancel` in `ManagerBookingController.java`
- [ ] T075 [US6] Add modify booking form (dates/room) and manager cancel action in `frontend/src/pages/manager/BookingMgmtDetailPage.tsx`

**Checkpoint**: US6 testable — modify and manager cancel

---

## Phase 9: User Story 7 — Vòng đời tự động: giữ chỗ quá hạn và no-show (Priority: P3)

**Goal**: Scheduled jobs cancel unpaid holds and mark no-show after 24h past check-in

**Independent Test**: PENDING_DEPOSIT past holdExpiresAt → CANCELLED + lock released; CONFIRMED 24h past check-in without check-in → NO_SHOW

### Implementation

- [ ] T076 [US7] Enable `@EnableScheduling` in `backend/src/main/java/com/homestay/HomestayApplication.java` (or config class)
- [ ] T077 [US7] Create `BookingHoldTimeoutJob.java` in `backend/src/main/java/com/homestay/jobs/BookingHoldTimeoutJob.java` — run every 1 min, cancel expired PENDING_DEPOSIT per research.md #2
- [ ] T078 [US7] Create `BookingNoShowJob.java` in `backend/src/main/java/com/homestay/jobs/BookingNoShowJob.java` — run every 15 min, CONFIRMED → NO_SHOW after 24h per research.md #11
- [ ] T079 [US7] Read `BOOKING_HOLD_TIMEOUT_MINUTES` from `SystemSetting` or env in `BookingHoldTimeoutJob.java`
- [ ] T080 [US7] Ensure idempotent job processing — skip if status already changed in both job classes

**Checkpoint**: US7 testable — jobs via integration test or manual clock override

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Tests, audit, quickstart validation, remaining payment stub

- [ ] T081 [P] Unit test `BookingStateServiceTest.java` in `backend/src/test/java/com/homestay/unit/BookingStateServiceTest.java` — all legal/illegal transitions
- [ ] T082 [P] Unit test `CancellationPolicyServiceTest.java` in `backend/src/test/java/com/homestay/unit/CancellationPolicyServiceTest.java` — tier boundaries 7d and 3d
- [ ] T083 Integration test `ConcurrentBookingIT.java` in `backend/src/test/java/com/homestay/integration/ConcurrentBookingIT.java` — parallel POST same room → one 201 one 409
- [ ] T084 Integration test `BookingControllerIT.java` in `backend/src/test/java/com/homestay/integration/BookingControllerIT.java` — create → list → detail smoke
- [ ] T085 [P] Add ActivityLog entries for BOOKING_CONFIRMED, BOOKING_CANCELLED, BOOKING_CHECKED_IN, BOOKING_CHECKED_OUT, BOOKING_NO_SHOW, BOOKING_MODIFIED across services
- [ ] T086 Wire remaining balance VNPay pay action on `frontend/src/pages/customer/RemainingPaymentPage.tsx` via `paymentApi.createVnpayUrl` type REMAINING_BALANCE
- [ ] T087 Run all curl smoke tests in `specs/004-booking-inventory/quickstart.md` and fix gaps
- [ ] T088 [P] Update `frontend/src/App.tsx` routes if booking/receipt paths missing for SCR-16/20

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Stories (Phase 3–9)**: Depend on Foundational
  - **US1 (P1)**: First MVP — no other story required
  - **US2 (P1)**: Needs bookings (from US1 or seed)
  - **US3 (P1)**: Needs CONFIRMED bookings (US1/US5 or seed)
  - **US4 (P2)**: Needs Confirmed/Pending bookings
  - **US5 (P2)**: Extends US1 create path (BANK_TRANSFER); can parallel US4 after US1
  - **US6 (P2)**: Needs Confirmed bookings
  - **US7 (P3)**: Can implement after US1 (needs PENDING_DEPOSIT + CONFIRMED states)
- **Polish (Phase 10)**: After desired user stories complete

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| US1 | Foundational | POST booking + VNPay URL |
| US2 | US1 or seed | GET /bookings/me scoped |
| US3 | US1/US5 Confirmed booking | Manager check-in/out |
| US4 | Confirmed booking | Cancel preview + PATCH cancel |
| US5 | US1 BANK_TRANSFER path | Receipt + verify → Confirmed |
| US6 | Confirmed booking | Modify + manager cancel |
| US7 | US1 create + Confirmed | Scheduled job outcomes |

### Parallel Opportunities

- Phase 1: T002, T003, T006, T007 parallel after T004/T005
- Phase 2: T008–T016 entities/repos parallel; T025–T027 frontend migration parallel
- US1: T036 parallel with controller work
- US2: T045, T046 parallel
- US3: T057 parallel with backend checkout
- US4: T064 parallel with frontend
- Polish: T081, T082, T085, T088 parallel

---

## Parallel Example: User Story 1

```bash
# After T028–T031 (BookingService + POST endpoint), parallel:
Task T033: PaymentController vnpay create-url
Task T036: ActivityLog BOOKING_CREATED
Task T037: BookingFormPage.tsx wire API (frontend dev)
```

---

## Parallel Example: Foundational Phase

```bash
# All entities in parallel:
T010 Booking.java | T011 BookingInventoryLock.java | T012 Payment.java
T013 PaymentReceipt.java | T014 OutboxEvent.java | T015 RoomInspection.java | T016 HousekeepingTask.java
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migrations)
2. Complete Phase 2: Foundational (entities + core services)
3. Complete Phase 3: User Story 1 (create booking + VNPay)
4. **STOP and VALIDATE**: quickstart POST /bookings + concurrent test
5. Demo booking checkout SCR-16

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → MVP deposit flow
3. US2 → customer visibility (SCR-17/18)
4. US3 → manager operations (SCR-34/35)
5. US4 + US5 → cancel + bank transfer
6. US6 → modify booking
7. US7 → automation jobs
8. Polish → tests + quickstart

### Parallel Team Strategy

| Developer | Focus |
|-----------|--------|
| A | Phase 2 + US1 backend (inventory, VNPay) |
| B | US2 + US4 frontend (customer pages) |
| C | US3 + US5 manager flows |
| D | US6 + US7 + Polish tests |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same batch
- FR-10 contract worker: US1/US5 only write OutboxEvent — no PDF generation in FR-04
- FR-23 inspection: US3 uses stub — seed `room_inspections.status=PASSED` for checkout manual test
- FR-21 housekeeping: US3 creates task with PENDING only — employee UI out of scope
- Commit after each phase checkpoint; validate with `specs/004-booking-inventory/quickstart.md`
