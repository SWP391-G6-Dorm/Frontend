# Tasks: FR-10 Contract Management

**Input**: Design documents from `specs/010-contract-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/contract-api.yaml, quickstart.md

**Phụ thuộc**: FR-04 (`outbox_events` V023, CONFIRMED + `CONTRACT_GENERATE_REQUESTED`); FR-12 deposit success; FR-01 email; FR-06 manager property scope; FR-08 room snapshot.

**Tests**: Không có phase test riêng per-story. Unit + integration trong Phase Polish per plan Phase K.

**Organization**: Tasks grouped by user story (US1–US4) for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking deps)
- **[Story]**: US1–US4 maps to spec.md user stories

## Path Conventions

- **Backend**: `backend/src/main/java/com/homestay/`
- **Backend tests**: `backend/src/test/java/com/homestay/`
- **Frontend**: `frontend/src/`
- **Migrations**: `backend/src/main/resources/db/migration/`
- **Contract**: `specs/010-contract-management/contracts/contract-api.yaml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Flyway `contracts` after FR-04 outbox; PDF + mail config

- [ ] T001 Verify FR-04 `outbox_events` migration applied (`V023__outbox_and_booking_stubs.sql` or equivalent) per `specs/004-booking-inventory/quickstart.md`
- [ ] T002 [P] Confirm Vite proxy `/api/v1` → backend in `frontend/vite.config.ts`
- [ ] T003 Create Flyway `backend/src/main/resources/db/migration/V024__contracts.sql` — `contracts` table + `UNIQUE (booking_id)` per `data-model.md`
- [ ] T004 [P] Add OpenPDF (or PDFBox) dependency in `backend/pom.xml` per `research.md`
- [ ] T005 [P] Add `app.upload.contracts-dir` (env `APP_CONTRACTS_DIR`) and Spring Mail settings in `backend/src/main/resources/application.yml`
- [ ] T006 [P] Create optional Flyway `backend/src/main/resources/db/migration/V025__contract_addendums.sql` for US4 P2 (skip if deferring addendum)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contract entity, DTOs, service skeletons, security — MUST complete before user story phases

**⚠️ CRITICAL**: No user story work until this phase complete

- [ ] T007 [P] Create `ContractStatus.java` enum in `backend/src/main/java/com/homestay/enums/ContractStatus.java` — ACTIVE, COMPLETED, CANCELLED
- [ ] T008 [P] Create `Contract.java` entity in `backend/src/main/java/com/homestay/entities/Contract.java` per `data-model.md`
- [ ] T009 [P] Create `ContractRepository.java` in `backend/src/main/java/com/homestay/repositories/ContractRepository.java` — `existsByBookingId`, `findByCustomerId`, `findByPropertyIdIn`
- [ ] T010 [P] Create contract DTOs in `backend/src/main/java/com/homestay/dtos/contract/` — `ContractSummaryResponse`, `ContractDetailResponse`, `ContractPageResponse`, `ResendContractRequest`, `ContractAddendumResponse` per `contracts/contract-api.yaml`
- [ ] T011 Create `ContractService.java` skeleton in `backend/src/main/java/com/homestay/services/ContractService.java`
- [ ] T012 Create `ContractPdfService.java` skeleton in `backend/src/main/java/com/homestay/services/ContractPdfService.java`
- [ ] T013 Create `ContractEmailService.java` skeleton in `backend/src/main/java/com/homestay/services/ContractEmailService.java`
- [ ] T014 Create `ContractOutboxWorker.java` skeleton in `backend/src/main/java/com/homestay/services/ContractOutboxWorker.java` — inject OutboxEventRepository from FR-04
- [ ] T015 Register `/api/v1/contracts/me/**` (CUSTOMER) and `/api/v1/manager/contracts/**` (MANAGER) in `backend/src/main/java/com/homestay/configs/SecurityConfig.java`
- [ ] T016 [P] Align TypeScript types in `frontend/src/api/contractApi.ts` with `contracts/contract-api.yaml` (prepare v1 path migration)

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Tự động tạo và gửi hợp đồng khi đặt cọc (Priority: P1) 🎯 MVP

**Goal**: Outbox worker processes `CONTRACT_GENERATE_REQUESTED` → immutable PDF + email; idempotent per booking

**Independent Test**: Deposit CONFIRMED → within 5 min contract row with pdfUrl ACTIVE + sentAt; email in MailHog; replay does not duplicate

### Implementation

- [ ] T017 [US1] Create HTML template `backend/src/main/resources/templates/contract/accommodation-contract.html` — Vietnamese snapshot fields per spec Assumptions
- [ ] T018 [US1] Implement `generatePdf(Booking, User, Room, Property)` saving to `APP_CONTRACTS_DIR` in `ContractPdfService.java`
- [ ] T019 [US1] Build snapshot fields (customerName, roomNumber, propertyName, amounts, dates) on Contract insert in `ContractPdfService.java`
- [ ] T020 [US1] Implement `handleContractGenerateRequested(bookingId)` with idempotent `existsByBookingId` check in `ContractOutboxWorker.java`
- [ ] T021 [US1] Insert Contract row + enqueue `CONTRACT_EMAIL_SEND` outbox after PDF success in `ContractOutboxWorker.java`
- [ ] T022 [US1] Implement `sendContractEmail(contractId)` with PDF attachment in `ContractEmailService.java`
- [ ] T023 [US1] Implement `handleContractEmailSend(contractId)` updating `sentAt` in `ContractOutboxWorker.java`
- [ ] T024 [US1] Add `@Scheduled(fixedDelay = 15000)` poll PENDING outbox events in `ContractOutboxWorker.java` — process CONTRACT_* types only
- [ ] T025 [US1] Implement retry policy max 5 attempts then FAILED in `ContractOutboxWorker.java`
- [ ] T026 [US1] Log `CONTRACT_GENERATED` to ActivityLog in `ContractOutboxWorker.java` after contract create
- [ ] T027 [US1] Log `CONTRACT_EMAIL_SENT` to ActivityLog in `ContractEmailService.java` after successful send
- [ ] T028 [US1] Verify FR-04 `OutboxPublisher` emits `CONTRACT_GENERATE_REQUESTED` (not duplicate event name) — align in FR-04 or FR-10 worker handler

**Checkpoint**: US1 MVP — auto contract generation + email pipeline

---

## Phase 4: User Story 2 — Customer xem, tải và in hợp đồng (Priority: P1)

**Goal**: SCR-21 — customer list, detail, PDF download/print; own contracts only

**Independent Test**: Customer `/customer/contracts` → list; drawer PDF; download; other customer → 403

### Implementation

- [ ] T029 [US2] Implement `listForCustomer(customerId, filters, pageable)` in `ContractService.java`
- [ ] T030 [US2] Implement `getDetailForCustomer(contractId, customerId)` ownership check in `ContractService.java`
- [ ] T031 [US2] Implement `getPdfBytes(contractId, requester)` streaming immutable file in `ContractService.java`
- [ ] T032 [US2] Implement `getByBookingId(bookingId, customerId)` in `ContractService.java`
- [ ] T033 [US2] Create `CustomerContractController.java` with `GET /api/v1/contracts/me`, `/{id}`, `/{id}/pdf`, `/booking/{bookingId}` in `backend/src/main/java/com/homestay/controllers/CustomerContractController.java`
- [ ] T034 [P] [US2] Migrate `getMyContracts` → `GET /api/v1/contracts/me` in `frontend/src/api/contractApi.ts`
- [ ] T035 [P] [US2] Migrate detail/download/booking paths to `/api/v1/contracts/**` in `frontend/src/api/contractApi.ts`
- [ ] T036 [US2] Wire list + filters on `frontend/src/pages/customer/ContractListPage.tsx`
- [ ] T037 [US2] Create `ContractPdfDrawer.tsx` in `frontend/src/components/contract/ContractPdfDrawer.tsx` — iframe PDF viewer
- [ ] T038 [US2] Wire row click to open drawer on `ContractListPage.tsx`
- [ ] T039 [US2] Add Download button calling `downloadContractPdf` on `ContractPdfDrawer.tsx`
- [ ] T040 [US2] Add Print button invoking browser print on iframe in `ContractPdfDrawer.tsx`
- [ ] T041 [US2] Verify `ProtectedRoute role="CUSTOMER"` for `/customer/contracts` routes in `frontend/src/App.tsx`

**Checkpoint**: US2 testable — Customer SCR-21 complete

---

## Phase 5: User Story 3 — Manager xem hợp đồng và gửi lại email (Priority: P1)

**Goal**: SCR-38 — manager list scoped by property; detail; resend via Outbox without PDF regenerate

**Independent Test**: Manager list filtered by property; resend updates sentAt; out-of-scope → 403

### Implementation

- [ ] T042 [US3] Implement `listForManager(managerId, propertyId, filters, pageable)` with PropertyAccessValidator in `ContractService.java`
- [ ] T043 [US3] Implement `getDetailForManager(contractId, managerId)` property scope check in `ContractService.java`
- [ ] T044 [US3] Implement `requestResend(contractId, managerId, emailOverride)` enqueueing `CONTRACT_RESEND` in `ContractService.java`
- [ ] T045 [US3] Implement `handleContractResend(contractId, email)` — same pdfUrl attachment in `ContractOutboxWorker.java`
- [ ] T046 [US3] Create `ManagerContractController.java` with `GET /api/v1/manager/contracts`, `/{id}`, `/{id}/pdf`, `POST /{id}/resend` in `backend/src/main/java/com/homestay/controllers/ManagerContractController.java`
- [ ] T047 [US3] Log `CONTRACT_RESENT` to ActivityLog in `ContractEmailService.java` on resend success
- [ ] T048 [P] [US3] Migrate manager list to `GET /api/v1/manager/contracts?propertyId=` in `frontend/src/api/contractApi.ts`
- [ ] T049 [US3] Migrate `frontend/src/pages/manager/ContractMgmtListPage.tsx` — property filter via FR-06 properties API
- [ ] T050 [US3] Migrate `frontend/src/pages/manager/ContractMgmtDetailPage.tsx` to v1 detail + PDF download
- [ ] T051 [US3] Migrate `frontend/src/pages/manager/ResendContractPage.tsx` to `POST /api/v1/manager/contracts/{id}/resend`
- [ ] T052 [US3] Reuse `ContractPdfDrawer.tsx` on manager detail with resend action link

**Checkpoint**: US3 testable — Manager SCR-38 complete

---

## Phase 6: User Story 4 — Contract Addendum khi Damage Fee (Priority: P2)

**Goal**: Separate addendum PDF linked to parent; original pdfUrl unchanged

**Independent Test**: Damage approve (when FR-23 ready) → addendum row; parent contract unchanged

### Implementation

- [ ] T053 [US4] Create `ContractAddendum.java` entity in `backend/src/main/java/com/homestay/entities/ContractAddendum.java` per `data-model.md`
- [ ] T054 [US4] Create `ContractAddendumRepository.java` in `backend/src/main/java/com/homestay/repositories/ContractAddendumRepository.java`
- [ ] T055 [US4] Implement `generateAddendum(parentContractId, damageFeeAmount)` separate PDF in `ContractPdfService.java`
- [ ] T056 [US4] Add handler stub for `CONTRACT_ADDENDUM_REQUESTED` outbox event in `ContractOutboxWorker.java` (wire to FR-23 when available)
- [ ] T057 [US4] Include `addendums[]` in `ContractDetailResponse` mapping in `ContractService.java`
- [ ] T058 [US4] Display addendum list read-only on `ContractPdfDrawer.tsx` and `ContractMgmtDetailPage.tsx`

**Checkpoint**: US4 testable when FR-23 damage flow exists

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Booking status sync, tests, quickstart validation

- [ ] T059 Implement `syncStatusFromBooking(bookingId, bookingStatus)` — CHECKED_OUT→COMPLETED, CANCELLED/NO_SHOW→CANCELLED in `ContractService.java`
- [ ] T060 Hook booking status listener or call sync from FR-04 booking service integration point in `ContractService.java`
- [ ] T061 [P] Unit test `ContractServiceTest.java` in `backend/src/test/java/com/homestay/unit/ContractServiceTest.java` — idempotency + ownership + status sync
- [ ] T062 [P] Unit test `ContractOutboxWorkerTest.java` in `backend/src/test/java/com/homestay/unit/ContractOutboxWorkerTest.java` — generate + email handlers mocked
- [ ] T063 Integration test `ContractControllerIT.java` in `backend/src/test/java/com/homestay/integration/ContractControllerIT.java` — customer/manager RBAC + PDF download + resend queue
- [ ] T064 [P] Assert resend does not change `pdf_url` column in `ContractControllerIT.java`
- [ ] T065 Run curl smoke tests in `specs/010-contract-management/quickstart.md` and fix gaps
- [ ] T066 [P] Deprecate legacy `/api/contracts/**` paths in `frontend/src/api/contractApi.ts` comments if dual-run during migration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: After FR-04 V023 outbox + bookings
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (P1)**: After Foundational — **blocks US2/US3** (need contracts to list)
- **US2 (P1)**: After US1 (contract records exist) or parallel backend with seeded contract
- **US3 (P1)**: After US1; parallel with US2 backend
- **US4 (P2)**: After US1 + FR-23 damage approve hook
- **Polish**: After US1–US3 minimum

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| US1 | Foundational + FR-04 outbox | Deposit CONFIRMED → contract + email |
| US2 | US1 (or seed) | Customer SCR-21 list/PDF |
| US3 | US1 (or seed) | Manager SCR-38 list/resend |
| US4 | US1 + FR-23 | Addendum without mutating parent PDF |

### Parallel Opportunities

- Phase 1: T002, T004, T005, T006 parallel
- Phase 2: T007–T010, T016 parallel
- US2: T034, T035 parallel after T033
- US3: T048 parallel with T049
- Polish: T061, T062, T064, T066 parallel

---

## Parallel Example: Foundational Phase

```bash
T007 ContractStatus.java | T008 Contract.java | T009 ContractRepository.java
T010 DTOs package | T016 contractApi.ts types
```

---

## Parallel Example: User Story 2

```bash
# After T033 controller:
T034 contractApi getMyContracts migration
T035 contractApi detail/download migration
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2
2. Phase 3 (US1) — Outbox PDF + email pipeline
3. **STOP and VALIDATE**: quickstart deposit → contract row + MailHog
4. Add US2 Customer UI next

### Incremental Delivery

1. Setup + Foundational
2. US1 → auto generation MVP
3. US2 → Customer SCR-21
4. US3 → Manager SCR-38 + resend
5. US4 → Addendum when FR-23 ready
6. Polish → status sync + tests

### Suggested MVP Scope

**T001–T028** (Setup + Foundational + US1) — Auto contract generation on deposit.

### Full Feature Scope

**T001–T066** — Complete FR-10 including Customer/Manager UI, addendum P2, and integration tests.

---

## Notes

- FR-04 owns `CONTRACT_GENERATE_REQUESTED` write — FR-10 owns worker only
- Do not regenerate PDF on manager resend — same `pdf_url`
- UNIQUE `booking_id` enforces one contract per booking
- MailHog recommended for dev email verification
- Commit after each phase checkpoint
