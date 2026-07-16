# Tasks: FR-12 Payment Management & Reconciliation

**Input**: Design documents from `specs/012-payment-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/payment-api.yaml, quickstart.md

**Phụ thuộc**: FR-11 (`invoices` V026, `InvoiceStatusSyncService`, V027 `invoice_id`); FR-04 (`DepositConfirmationService`, booking lifecycle); FR-01 (JWT); FR-06 (property scope); FR-10 (contract Outbox via deposit confirm); FR-15 (notifications). **Ranh giới**: FR-11 Invoice; FR-12 Payment/VNPay/verify/reconciliation; FR-23 damage trigger — US6 P2.

**Tests**: Không có phase test riêng per-story. Unit + integration trong Phase Polish per plan Phase K.

**Organization**: Tasks grouped by user story (US1–US6) for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking deps)
- **[Story]**: US1–US6 maps to spec.md user stories

## Path Conventions

- **Backend**: `backend/src/main/java/com/homestay/`
- **Backend tests**: `backend/src/test/java/com/homestay/`
- **Frontend**: `frontend/src/`
- **Migrations**: `backend/src/main/resources/db/migration/`
- **Contract**: `specs/012-payment-management/contracts/payment-api.yaml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Payments schema extensions, VNPay env, receipt upload dir — after FR-11 invoices

- [ ] T001 Verify FR-11 `invoices` table + `InvoiceStatusSyncService` available per `specs/011-billing-management/quickstart.md` (blocker)
- [ ] T002 Verify or create Flyway `backend/src/main/resources/db/migration/V027__payments_invoice_id.sql` — `invoice_id` FK on `payments` per `data-model.md`
- [ ] T003 Create Flyway `backend/src/main/resources/db/migration/V028__payments_fr12_extensions.sql` — `property_id`, `reconciliation_status`, `reminder_sent_at`, gateway columns + indexes per `data-model.md`
- [ ] T004 [P] Add VNPay env placeholders (`VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, URLs) in `backend/src/main/resources/application.yml` per `quickstart.md`
- [ ] T005 [P] Add `app.upload.receipts-dir` (env `APP_RECEIPTS_DIR`) and confirm Vite proxy `/api/v1` in `frontend/vite.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Payment entities, DTOs, VNPay config, service skeletons — MUST complete before user story phases

**⚠️ CRITICAL**: No user story work until this phase complete

- [ ] T006 [P] Create `PaymentType.java` in `backend/src/main/java/com/homestay/enums/PaymentType.java` — DEPOSIT, REMAINING_BALANCE, DAMAGE_FEE, REFUND
- [ ] T007 [P] Create `PaymentMethod.java` in `backend/src/main/java/com/homestay/enums/PaymentMethod.java` — VNPAY, BANK_TRANSFER, CASH
- [ ] T008 [P] Create `PaymentStatus.java` in `backend/src/main/java/com/homestay/enums/PaymentStatus.java` — PENDING, PAID, FAILED, REFUNDED
- [ ] T009 [P] Create `ReconciliationStatus.java` in `backend/src/main/java/com/homestay/enums/ReconciliationStatus.java` — NONE, DISCREPANCY, RESOLVED
- [ ] T010 [P] Create `Payment.java` entity in `backend/src/main/java/com/homestay/entities/Payment.java` per `data-model.md`
- [ ] T011 [P] Create `PaymentReceipt.java` entity in `backend/src/main/java/com/homestay/entities/PaymentReceipt.java` per `data-model.md`
- [ ] T012 [P] Create `PaymentRepository.java` in `backend/src/main/java/com/homestay/repositories/PaymentRepository.java` — `findByOrderRef`, `findByInvoiceIdAndStatus`, `findByCustomerId`, `findByPropertyIdAndStatus`
- [ ] T013 [P] Create `PaymentReceiptRepository.java` in `backend/src/main/java/com/homestay/repositories/PaymentReceiptRepository.java`
- [ ] T014 [P] Create payment DTOs in `backend/src/main/java/com/homestay/dtos/payment/` — `PaymentSummaryResponse`, `PaymentDetailResponse`, `PaymentPageResponse`, `VerifyPaymentRequest`, `CreateVNPayUrlResponse`, `UploadReceiptRequest` per `contracts/payment-api.yaml`
- [ ] T015 Create `VNPayConfig.java` in `backend/src/main/java/com/homestay/configs/VNPayConfig.java` binding env properties
- [ ] T016 Create `PaymentService.java` skeleton in `backend/src/main/java/com/homestay/services/PaymentService.java`
- [ ] T017 Create `VNPayService.java` skeleton in `backend/src/main/java/com/homestay/services/VNPayService.java`
- [ ] T018 Create `PaymentConfirmationService.java` skeleton in `backend/src/main/java/com/homestay/services/PaymentConfirmationService.java`
- [ ] T019 Create `PaymentVerificationService.java` skeleton in `backend/src/main/java/com/homestay/services/PaymentVerificationService.java`
- [ ] T020 Register payment routes + permitAll `/api/v1/payments/vnpay/ipn` and `/return` in `backend/src/main/java/com/homestay/configs/SecurityConfig.java`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Customer thanh toán đặt cọc (VNPay / chuyển khoản) (Priority: P1) 🎯 MVP

**Goal**: Deposit pay via VNPay IPN or bank transfer + receipt; confirmPaid → invoice Paid + booking Confirmed + contract Outbox

**Independent Test**: VNPay deposit success → Payment Paid, booking Confirmed; bank transfer → Pending + receipt awaiting Manager

### Implementation

- [ ] T021 [US1] Implement `createPaymentAttempt(invoiceId, method)` — validate invoice DEPOSIT UNPAID, amount match, one Pending per invoice in `PaymentService.java`
- [ ] T022 [US1] Generate unique `orderRef` and persist Payment PENDING in `PaymentService.java`
- [ ] T023 [US1] Call `InvoiceStatusSyncService.markPendingPayment(invoiceId)` on payment create in `PaymentService.java`
- [ ] T024 [US1] Implement HMAC-SHA512 `buildPaymentUrl(Payment)` in `VNPayService.java`
- [ ] T025 [US1] Implement `verifyIpnSignature(Map params)` in `VNPayService.java`
- [ ] T026 [US1] Implement `confirmPaid(Payment)` idempotent — Paid, invoice sync, deposit → `DepositConfirmationService.confirmDeposit()` in `PaymentConfirmationService.java`
- [ ] T027 [US1] Implement `markFailed(Payment, note)` — Failed + invoice revert in `PaymentConfirmationService.java`
- [ ] T028 [US1] Create `PaymentVNPayController.java` with `POST /api/v1/payments/vnpay/create-url?bookingId&type=DEPOSIT` in `backend/src/main/java/com/homestay/controllers/PaymentVNPayController.java`
- [ ] T029 [US1] Add `POST /api/v1/payments/vnpay/ipn` handler calling confirmPaid/markFailed in `PaymentVNPayController.java`
- [ ] T030 [US1] Add `GET /api/v1/payments/vnpay/return` redirect to frontend result page in `PaymentVNPayController.java`
- [ ] T031 [US1] Implement `PaymentReceiptService.upload(bookingId, customerId, request)` creating Payment BANK_TRANSFER + receipt in `backend/src/main/java/com/homestay/services/PaymentReceiptService.java`
- [ ] T032 [US1] Create `CustomerReceiptController.java` with `POST /api/v1/bookings/{id}/receipts` (SCR-20) in `backend/src/main/java/com/homestay/controllers/CustomerReceiptController.java`
- [ ] T033 [US1] Log `PAYMENT_CREATED` and `PAYMENT_PAID` to ActivityLog in `PaymentConfirmationService.java`
- [ ] T034 [P] [US1] Migrate `createVnpayUrl` to `POST /api/v1/payments/vnpay/create-url` in `frontend/src/api/paymentApi.ts`
- [ ] T035 [US1] Wire `DepositPaymentPage` VNPay redirect + bank transfer receipt flow in `frontend/src/pages/customer/PaymentPages.tsx`

**Checkpoint**: US1 MVP — deposit VNPay + bank transfer initiation testable

---

## Phase 4: User Story 2 — Customer thanh toán phần còn lại (Priority: P1)

**Goal**: Remaining balance pay when booking Confirmed; no duplicate deposit confirm side-effects

**Independent Test**: Confirmed booking → pay remaining → Payment Paid + remaining invoice Paid; reject if not Confirmed

### Implementation

- [ ] T036 [US2] Add booking status gate — only **Confirmed** for REMAINING_BALANCE in `PaymentService.createPaymentAttempt()` in `PaymentService.java`
- [ ] T037 [US2] Extend `POST /api/v1/payments/vnpay/create-url?type=REMAINING_BALANCE` validation in `PaymentVNPayController.java`
- [ ] T038 [US2] Ensure `confirmPaid` for REMAINING skips `DepositConfirmationService` — only updates invoice + `paid_amount` in `PaymentConfirmationService.java`
- [ ] T039 [US2] Extend `PaymentReceiptService` for remaining bank transfer invoice type in `PaymentReceiptService.java`
- [ ] T040 [P] [US2] Wire `RemainingPaymentPage` to v1 create-url in `frontend/src/pages/customer/PaymentPages.tsx`
- [ ] T041 [US2] Update `VNPayResultPage` to handle remaining payment success messaging in `frontend/src/pages/customer/PaymentPages.tsx`

**Checkpoint**: US2 testable — remaining balance pay path end-to-end

---

## Phase 5: User Story 3 — Manager xác minh chuyển khoản (Priority: P1)

**Goal**: SCR-36/37 list + verify; receipt required on Approve; 24h reminder

**Independent Test**: Manager Approve with receipt → Paid + Confirmed (deposit); Reject without receipt blocked; 403 out of scope

### Implementation

- [ ] T042 [US3] Implement `approve(paymentId, managerId, note)` — require PaymentReceipt, call confirmPaid in `PaymentVerificationService.java`
- [ ] T043 [US3] Implement `reject(paymentId, managerId, note)` — Failed + invoice revert in `PaymentVerificationService.java`
- [ ] T044 [US3] Implement `listForManager(propertyId, status, pageable)` with PropertyAccessValidator in `PaymentService.java`
- [ ] T045 [US3] Create `ManagerPaymentController.java` with `GET /api/v1/manager/payments`, `GET /{id}`, `PATCH /{id}/verify` in `backend/src/main/java/com/homestay/controllers/ManagerPaymentController.java`
- [ ] T046 [US3] Log `PAYMENT_VERIFIED` and `PAYMENT_REJECTED` to ActivityLog in `PaymentVerificationService.java`
- [ ] T047 [US3] Create `PaymentReminderJob.java` — Pending BANK_TRANSFER > 24h → notify Manager in `backend/src/main/java/com/homestay/jobs/PaymentReminderJob.java`
- [ ] T048 [US3] Enqueue FR-15 notification on bank transfer pending create in `PaymentReceiptService.java`
- [ ] T049 [P] [US3] Migrate manager APIs to `/api/v1/manager/payments` + PATCH verify `{APPROVED|REJECTED}` in `frontend/src/api/paymentApi.ts`
- [ ] T050 [US3] Wire property filter + status tabs on `frontend/src/pages/manager/PaymentMgmtListPage.tsx`
- [ ] T051 [US3] Wire receipt viewer + approve/reject on `frontend/src/pages/manager/PaymentMgmtVerificationPage.tsx`
- [ ] T052 [US3] Show verify metadata on `frontend/src/pages/manager/PaymentMgmtDetailPage.tsx`

**Checkpoint**: US3 testable — manager verify SCR-36/37 complete

---

## Phase 6: User Story 4 — VNPay reconciliation cron + Admin SCR-52 (Priority: P1)

**Goal**: Cron 15 min query Pending VNPay; Admin discrepancy list + manual sync

**Independent Test**: Pending VNPay → cron updates Paid; amount mismatch → DISCREPANCY on SCR-52; manual sync resolves

### Implementation

- [ ] T053 [US4] Implement `queryTransaction(orderRef)` VNPay querydr API in `VNPayService.java`
- [ ] T054 [US4] Create `PaymentReconciliationJob.java` with `@Scheduled(cron = "0 */15 * * * *")` in `backend/src/main/java/com/homestay/jobs/PaymentReconciliationJob.java`
- [ ] T055 [US4] On amount mismatch set `reconciliation_status = DISCREPANCY` in `PaymentReconciliationJob.java`
- [ ] T056 [US4] Create `AdminReconciliationService.java` — list discrepancies + manual sync in `backend/src/main/java/com/homestay/services/AdminReconciliationService.java`
- [ ] T057 [US4] Create `AdminReconciliationController.java` with `GET /api/v1/admin/payments/reconciliation` and `POST /{id}/sync-vnpay` in `backend/src/main/java/com/homestay/controllers/AdminReconciliationController.java`
- [ ] T058 [US4] Log `PAYMENT_RECONCILED` to ActivityLog in `AdminReconciliationService.java`
- [ ] T059 [US4] Create `frontend/src/pages/admin/PaymentReconciliationPage.tsx` — SCR-52 table + sync drawer
- [ ] T060 [US4] Register admin route `/admin/reconciliation` in `frontend/src/App.tsx` with `ProtectedRoute role="ADMIN"`

**Checkpoint**: US4 testable — reconciliation cron + admin UI

---

## Phase 7: User Story 5 — Payment history Customer & Manager (Priority: P1)

**Goal**: SCR-26 customer history + manager detail with receipt link

**Independent Test**: Customer GET /payments/me own only; detail shows receiptUrl and verify fields

### Implementation

- [ ] T061 [US5] Implement `listForCustomer(customerId, pageable)` in `PaymentService.java`
- [ ] T062 [US5] Implement `getDetailForCustomer(paymentId, customerId)` ownership check in `PaymentService.java`
- [ ] T063 [US5] Create `CustomerPaymentController.java` with `GET /api/v1/payments/me` and `GET /api/v1/payments/me/{id}` in `backend/src/main/java/com/homestay/controllers/CustomerPaymentController.java`
- [ ] T064 [US5] Map `receiptUrl`, `verifiedByName`, `reconciliationStatus` in PaymentDetailResponse mapper in `PaymentService.java`
- [ ] T065 [P] [US5] Add `getMyPayments` and `getMyPaymentDetail` to `frontend/src/api/paymentApi.ts`
- [ ] T066 [US5] Wire `PaymentHistoryPage` to live API in `frontend/src/pages/customer/PaymentHistoryPage.tsx`
- [ ] T067 [US5] Wire duplicate export in `frontend/src/pages/customer/PaymentPages.tsx` PaymentHistory section if still used

**Checkpoint**: US5 testable — payment history SCR-26 live

---

## Phase 8: User Story 6 — Damage Fee Payment (Priority: P2)

**Goal**: Stub listener for FR-23 damage approve → damage invoice pay path

**Independent Test**: When FR-23 fires event, listener creates pay-eligible damage invoice reference (stub ok v1)

### Implementation

- [ ] T068 [US6] Create `DamagePaymentListener.java` stub listening for damage-approved event in `backend/src/main/java/com/homestay/listeners/DamagePaymentListener.java`
- [ ] T069 [US6] Add `createPaymentAttempt` support for DAMAGE_FEE invoice type when booking PENDING_DAMAGE_PAYMENT in `PaymentService.java`
- [ ] T070 [US6] Document FR-23 integration contract in comment block on `DamagePaymentListener.java`

**Checkpoint**: US6 stub ready — full flow when FR-23 ships

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Tests, quickstart validation, security hardening

- [ ] T071 [P] Unit test VNPay signature verify/build in `backend/src/test/java/com/homestay/unit/VNPayServiceTest.java`
- [ ] T072 [P] Unit test confirmPaid idempotency + deposit vs remaining side-effects in `backend/src/test/java/com/homestay/unit/PaymentConfirmationServiceTest.java`
- [ ] T073 [P] Unit test approve-without-receipt rejection in `backend/src/test/java/com/homestay/unit/PaymentVerificationServiceTest.java`
- [ ] T074 Integration test IPN + manager verify RBAC in `backend/src/test/java/com/homestay/integration/PaymentControllerIT.java`
- [ ] T075 [P] Assert no double booking Confirmed on IPN replay in `PaymentControllerIT.java`
- [ ] T076 Run curl smoke tests in `specs/012-payment-management/quickstart.md` and fix gaps
- [ ] T077 [P] Verify all payment routes in `frontend/src/App.tsx` (customer/manager/admin)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: After FR-11 invoices (blocker)
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (P1)**: After Foundational — **blocks US2–US5** (core payment flow)
- **US2 (P1)**: After US1 (shared PaymentService/VNPay)
- **US3 (P1)**: After US1 (bank transfer payments exist)
- **US4 (P1)**: After US1 (VNPay Pending payments exist); parallel with US3/US5
- **US5 (P1)**: After US1 (payment records exist); parallel with US3/US4
- **US6 (P2)**: After US1; depends FR-23 for full test
- **Polish**: After US1–US5 minimum

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| US1 | Foundational + FR-11 | VNPay/bank deposit pay |
| US2 | US1 | Remaining pay on Confirmed booking |
| US3 | US1 | Manager verify bank transfer |
| US4 | US1 | Cron + admin reconciliation |
| US5 | US1 | Customer/manager payment history |
| US6 | US1 + FR-23 | Damage fee pay stub |

### Parallel Opportunities

- Phase 1: T004, T005 parallel
- Phase 2: T006–T014 parallel
- US1 frontend: T034 parallel after T028–T032
- US3 frontend: T049 parallel after T045
- US5: T065 parallel after T063
- Polish: T071–T073, T075, T077 parallel

### Parallel Example: User Story 1

```bash
# After backend endpoints T028–T032:
Task T034: "Migrate paymentApi.ts to /api/v1"
Task T035: "Wire DepositPaymentPage in PaymentPages.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify FR-11 blocker)
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: VNPay sandbox deposit + bank transfer Pending per `quickstart.md`
5. Demo deposit → Confirmed booking path

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Deposit pay MVP (VNPay + bank)
3. US2 → Remaining balance
4. US3 → Manager verify + reminders
5. US4 → Reconciliation cron + Admin SCR-52
6. US5 → Payment history UI
7. US6 → Damage fee stub (P2)
8. Polish → Tests + quickstart

### Parallel Team Strategy

1. Team completes Setup + Foundational (after FR-11 merged)
2. Once Foundational done:
   - Developer A: US1 backend (VNPay + confirmPaid)
   - Developer B: US1 frontend + US5 history
   - Developer C: US3 manager verify
3. US4 after US1 VNPay Pending exists

---

## Notes

- **Blocker**: FR-11 US1 must ship before FR-12 payment create (invoices required)
- `DepositConfirmationService` from FR-04 — wire or stub per `specs/004-booking-inventory/tasks.md` T068
- Never log `VNPAY_HASH_SECRET`; IPN must verify signature before confirmPaid
- Frontend legacy POST verify — migrate to PATCH APPROVED/REJECTED per api-spec
- Stop at any checkpoint to validate story independently
