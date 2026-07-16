# Tasks: FR-09 Customer Management

**Input**: Design documents from `specs/009-customer-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/customer-api.yaml, quickstart.md

**Phụ thuộc**: FR-01 (`users`, SUSPENDED login block); FR-04 (`bookings` read + aggregates). **Ranh giới**: FR-17 Complaints; FR-02 self-profile; Manager Customer List (figma SCR-55/56).

**Tests**: Không có phase test riêng per-story. Unit + integration trong Phase Polish per plan Phase I.

**Organization**: Tasks grouped by user story (US1–US3) for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking deps)
- **[Story]**: US1–US3 maps to spec.md user stories

## Path Conventions

- **Backend**: `backend/src/main/java/com/homestay/`
- **Backend tests**: `backend/src/test/java/com/homestay/`
- **Frontend**: `frontend/src/`
- **Migrations**: `backend/src/main/resources/db/migration/`
- **Contract**: `specs/009-customer-management/contracts/customer-api.yaml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify FR-01/FR-04 prerequisites; optional list indexes

- [ ] T001 Verify backend Spring Boot scaffold and FR-01 `users` migration applied per `specs/001-user-auth/quickstart.md`
- [ ] T002 [P] Confirm Vite proxy `/api/v1` → backend in `frontend/vite.config.ts`
- [ ] T003 [P] Create optional Flyway `backend/src/main/resources/db/migration/V012__users_customer_list_indexes.sql` — `(role, status)` on users + `(customer_id)` on bookings if missing per `data-model.md`
- [ ] T004 Verify FR-01 `AuthService` rejects login when `users.status=SUSPENDED` in `backend/src/main/java/com/homestay/services/AuthService.java` (no FR-09 change if already implemented)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DTOs, repository extensions, service skeleton, security, API client — MUST complete before user story phases

**⚠️ CRITICAL**: No user story work until this phase complete

- [ ] T005 [P] Create admin customer DTOs in `backend/src/main/java/com/homestay/dtos/admin/` — `CustomerSummaryResponse`, `CustomerDetailResponse`, `CustomerBookingSummaryResponse`, `UpdateCustomerStatusRequest`, `CustomerPageResponse` per `contracts/customer-api.yaml`
- [ ] T006 [P] Extend `UserRepository.java` in `backend/src/main/java/com/homestay/repositories/UserRepository.java` — JPA spec/query `findCustomersWithFilters(role=CUSTOMER, status, search, pageable)`
- [ ] T007 [P] Extend `BookingRepository.java` in `backend/src/main/java/com/homestay/repositories/BookingRepository.java` — `countByCustomerId`, `sumTotalAmountByCustomerIdAndStatusIn`, `findByCustomerIdOrderByCreatedAtDesc`
- [ ] T008 Create `AdminCustomerService.java` skeleton in `backend/src/main/java/com/homestay/services/AdminCustomerService.java` — inject UserRepository, BookingRepository
- [ ] T009 Register `/api/v1/admin/users/**` ADMIN-only in `backend/src/main/java/com/homestay/configs/SecurityConfig.java`
- [ ] T010 [P] Create `frontend/src/api/adminCustomerApi.ts` with types aligned to `contracts/customer-api.yaml`
- [ ] T011 [P] Map legacy `name` ↔ `fullName` in `adminCustomerApi.ts` for compat with `frontend/src/api/adminApi.ts`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Admin xem và lọc danh sách Customer (Priority: P1) 🎯 MVP

**Goal**: SCR-51 — paginated customer list with search, status filter, Total Bookings / Total Spend aggregates

**Independent Test**: Admin opens `/admin/customers` → only CUSTOMER role rows; filters and search work; pagination; non-admin → 403

### Implementation

- [ ] T012 [US1] Implement `listCustomers(status, search, pageable)` hard-filtering `role=CUSTOMER` in `AdminCustomerService.java`
- [ ] T013 [US1] Compute `totalBookings` and `totalSpend` per customer using BookingRepository aggregates in `AdminCustomerService.java` per `data-model.md`
- [ ] T014 [US1] Create `AdminCustomerController.java` with `GET /api/v1/admin/users?role=CUSTOMER` in `backend/src/main/java/com/homestay/controllers/AdminCustomerController.java`
- [ ] T015 [US1] Apply `@PreAuthorize("hasRole('ADMIN')")` on list endpoint in `AdminCustomerController.java`
- [ ] T016 [US1] Map paginated `CustomerPageResponse` envelope per api-spec §1 in `AdminCustomerController.java`
- [ ] T017 [P] [US1] Implement `fetchCustomers(params)` in `frontend/src/api/adminCustomerApi.ts` calling `GET /api/v1/admin/users?role=CUSTOMER`
- [ ] T018 [P] [US1] Create `AdminLayout.tsx` in `frontend/src/layouts/AdminLayout.tsx` with sidebar shell (mirror `ManagerLayout.tsx` pattern)
- [ ] T019 [US1] Create `CustomerDirectoryPage.tsx` in `frontend/src/pages/admin/CustomerDirectoryPage.tsx` — SCR-51 table columns Name, Email, Total Bookings, Total Spend, Status
- [ ] T020 [US1] Wire search input (fullName/email) and status filter dropdown on `CustomerDirectoryPage.tsx`
- [ ] T021 [US1] Implement pagination controls on `CustomerDirectoryPage.tsx`
- [ ] T022 [P] [US1] Display status badges (INACTIVE, ACTIVE, SUSPENDED) on `CustomerDirectoryPage.tsx`
- [ ] T023 [US1] Add empty-state when no customers match filters on `CustomerDirectoryPage.tsx`
- [ ] T024 [US1] Register route `/admin/customers` with `ProtectedRoute role="ADMIN"` in `frontend/src/App.tsx`

**Checkpoint**: US1 MVP — Admin Customer Directory list SCR-51

---

## Phase 4: User Story 2 — Admin cập nhật trạng thái tài khoản (Priority: P1)

**Goal**: Active ↔ Suspended with confirmation; INACTIVE rejected; audit log; FR-01 login block

**Independent Test**: Suspend active customer → login fails; activate → login works; INACTIVE PATCH → 409; non-customer → 403

### Implementation

- [ ] T025 [US2] Implement `updateCustomerStatus(userId, status, adminId)` in `AdminCustomerService.java` — allow only ACTIVE↔SUSPENDED
- [ ] T026 [US2] Reject status change when current status is INACTIVE with 409 in `AdminCustomerService.java`
- [ ] T027 [US2] Reject when target `role != CUSTOMER` with 403/404 in `AdminCustomerService.java`
- [ ] T028 [US2] Add `PATCH /api/v1/admin/users/{id}/status` in `AdminCustomerController.java`
- [ ] T029 [US2] Validate `UpdateCustomerStatusRequest` body (ACTIVE|SUSPENDED only) in `AdminCustomerController.java`
- [ ] T030 [US2] Log `USER_STATUS_CHANGED` to ActivityLog in `AdminCustomerService.java`
- [ ] T031 [US2] Add `updateCustomerStatus(id, status)` in `frontend/src/api/adminCustomerApi.ts`
- [ ] T032 [US2] Add Suspend/Activate actions with ConfirmationDialog on `CustomerDirectoryPage.tsx` row kebab menu
- [ ] T033 [US2] Disable Suspend/Activate when customer status is INACTIVE on `CustomerDirectoryPage.tsx`
- [ ] T034 [US2] Refresh list row after successful status change on `CustomerDirectoryPage.tsx`

**Checkpoint**: US2 testable — suspend/activate flow

---

## Phase 5: User Story 3 — Admin xem hồ sơ và lịch sử đặt phòng (Priority: P1)

**Goal**: SCR-51 Drawer — read-only profile + paginated booking history

**Independent Test**: Click row → drawer shows profile + bookings newest first; empty bookings state; no cross-customer data leak

### Implementation

- [ ] T035 [US3] Implement `getCustomerDetail(userId)` verifying role=CUSTOMER in `AdminCustomerService.java`
- [ ] T036 [US3] Implement `getCustomerBookings(userId, pageable)` with roomNumber/propertyName joins in `AdminCustomerService.java`
- [ ] T037 [US3] Add `GET /api/v1/admin/users/{id}` in `AdminCustomerController.java`
- [ ] T038 [US3] Add `GET /api/v1/admin/users/{id}/bookings` in `AdminCustomerController.java`
- [ ] T039 [P] [US3] Add `fetchCustomerById` and `fetchCustomerBookings` in `frontend/src/api/adminCustomerApi.ts`
- [ ] T040 [US3] Create `CustomerDetailDrawer.tsx` in `frontend/src/components/admin/CustomerDetailDrawer.tsx` — profile card read-only
- [ ] T041 [US3] Display fullName, email, phone, avatar, status, createdAt in drawer on `CustomerDetailDrawer.tsx`
- [ ] T042 [US3] Render booking history table (id, dates, room, property, totalAmount, status) on `CustomerDetailDrawer.tsx`
- [ ] T043 [US3] Add booking history empty-state on `CustomerDetailDrawer.tsx`
- [ ] T044 [US3] Wire row click on `CustomerDirectoryPage.tsx` to open `CustomerDetailDrawer.tsx`
- [ ] T045 [US3] Add Suspend/Activate actions inside drawer (reuse US2 API) with INACTIVE disabled on `CustomerDetailDrawer.tsx`
- [ ] T046 [P] [US3] Optional read-only `outstandingDebt` indicator on `CustomerDetailDrawer.tsx` when field exists on user entity

**Checkpoint**: US3 testable — profile + booking history drawer

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tests, nav, legacy migration, quickstart validation

- [ ] T047 [P] Unit test `AdminCustomerServiceTest.java` in `backend/src/test/java/com/homestay/unit/AdminCustomerServiceTest.java` — INACTIVE 409 + aggregate logic + non-customer reject
- [ ] T048 Integration test `AdminCustomerControllerIT.java` in `backend/src/test/java/com/homestay/integration/AdminCustomerControllerIT.java` — list RBAC 403 + suspend flow + booking history scope
- [ ] T049 [P] Add Customers nav link to `/admin/customers` in `frontend/src/layouts/AdminLayout.tsx`
- [ ] T050 [P] Mark legacy `frontend/src/api/adminApi.ts` customer methods deprecated; point consumers to `adminCustomerApi.ts`
- [ ] T051 Verify suspended customer login blocked via FR-01 after PATCH status per `specs/009-customer-management/quickstart.md`
- [ ] T052 Run curl smoke tests in `specs/009-customer-management/quickstart.md` and fix gaps
- [ ] T053 [P] Verify only CUSTOMER rows returned — integration assertion in `AdminCustomerControllerIT.java` (SC-006)
- [ ] T054 [P] Ensure Manager/Employee/Customer JWT receive 403 on all `/admin/users?role=CUSTOMER` endpoints in `AdminCustomerControllerIT.java`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: After FR-01 users table; FR-04 bookings optional for aggregates
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (P1)**: After Foundational — list MVP SCR-51
- **US2 (P1)**: After US1 list exists (UI verification); backend PATCH can parallel US1 backend
- **US3 (P1)**: After US1 (row click source); booking joins need FR-04 table
- **Polish**: After US1–US3 minimum

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| US1 | Foundational + FR-01 users | GET list + SCR-51 table/filters |
| US2 | Foundational; UI benefits from US1 | PATCH status + login block |
| US3 | US1 list UI; FR-04 bookings for history | Drawer profile + bookings |

### Parallel Opportunities

- Phase 1: T002, T003 parallel
- Phase 2: T005–T007, T010–T011 parallel
- US1: T017, T018, T022 parallel after T014
- US3: T039, T046 parallel with T040–T042
- Polish: T047, T049, T050, T053, T054 parallel

---

## Parallel Example: Foundational Phase

```bash
T005 DTOs package | T006 UserRepository extension | T007 BookingRepository extension
T010 adminCustomerApi.ts | T011 name/fullName mapping
```

---

## Parallel Example: User Story 1

```bash
# After T014 controller:
T017 adminCustomerApi fetchCustomers
T018 AdminLayout.tsx
T022 status badges
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2
2. Phase 3 (US1) — Customer Directory list SCR-51
3. **STOP and VALIDATE**: quickstart GET list + UI filters
4. Add US2 suspend/activate next

### Incremental Delivery

1. Setup + Foundational
2. US1 → customer list MVP
3. US2 → status management
4. US3 → detail drawer + booking history
5. Polish → tests + quickstart

### Suggested MVP Scope

**T001–T024** (Setup + Foundational + US1) — Admin Customer Directory list SCR-51.

### Full Feature Scope

**T001–T054** — Complete FR-09 including status toggle, drawer, and integration tests.

---

## Notes

- FR-09 does **not** create new tables — uses FR-01 `users` + FR-04 `bookings`
- Do not expose role change via customer PATCH — status only
- Route `/admin/customers` maps SCR-51 Customer Directory (not legacy Contract SCR-51 in frontend)
- INACTIVE customers visible but status actions disabled
- Commit after each phase checkpoint
