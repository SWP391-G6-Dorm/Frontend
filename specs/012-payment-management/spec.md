# Feature Specification: FR-12 Payment Management & Reconciliation

**Feature Branch**: `014-payment-management`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "FR-12 Payment Management & Reconciliation — dựa vào docs (Specification_v2.md § FR-12, §5 Payment/PaymentReceipt, §6 RBAC, §7 Error Handling, §8 Acceptance VNPay, api-spec-by-screen SCR-16/20/26/36/37/52, screen.md, screendesign.md, entity-ui-mapping.md §1.8, frontend paymentApi.ts, PaymentPages.tsx, PaymentMgmtListPage.tsx)"

**Phụ thuộc**: FR-04 (booking lifecycle, Pending Deposit→Confirmed on deposit); FR-11 (Invoice billing document + status sync); FR-01 (auth); FR-06 (manager property scope); FR-10 (contract Outbox on deposit paid); FR-15 (notifications for reminders). **Ranh giới**: FR-11 owns Invoice issuance/tracking; FR-12 owns Payment execution, receipts, VNPay, verification, reconciliation; FR-23 owns damage approval trigger — FR-12 creates Damage Fee payment when damage approved.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer thanh toán đặt cọc qua VNPay hoặc chuyển khoản (Priority: P1)

Là **Customer** với booking **Pending Deposit**, tôi muốn thanh toán **40% cọc** qua **VNPay** (tự động xác nhận) hoặc **chuyển khoản** (upload biên lai), để giữ chỗ và chuyển booking sang **Confirmed**.

**Why this priority**: FR-12 core — Deposit Payment; FR-04 gate; without deposit pay the booking flow stops.

**Independent Test**: Customer chọn pay deposit → VNPay success → Payment Paid, Invoice Paid, Booking Confirmed, contract Outbox enqueued; bank transfer → Payment Pending + receipt → awaits Manager.

**Acceptance Scenarios**:

1. **Given** booking Pending Deposit và invoice Deposit UNPAID, **When** Customer chọn VNPay và hoàn tất thanh toán trên cổng, **Then** Payment status **Pending** khi redirect; sau IPN/callback thành công → **Paid**; invoice Deposit → **Paid** (FR-11); booking → **Confirmed**; Outbox contract generate (FR-10).
2. **Given** Customer chọn chuyển khoản, **When** upload biên lai hợp lệ (SCR-20), **Then** tạo Payment **Pending** gắn invoice Deposit + PaymentReceipt; invoice → **Pending Payment**; Manager nhận thông báo xác minh.
3. **Given** VNPay redirect, **When** Customer chưa hoàn tất / hủy giao dịch, **Then** Payment **Failed** hoặc giữ **Pending** theo cổng; invoice revert **Unpaid** nếu không có tiền trừ; booking vẫn Pending Deposit.
4. **Given** Customer A, **When** cố thanh toán booking của Customer B, **Then** từ chối.
5. **Given** Payment đã **Paid** cho deposit, **When** Customer cố pay deposit lại, **Then** từ chối (invoice đã Paid).

---

### User Story 2 - Customer thanh toán phần còn lại (Remaining Balance) (Priority: P1)

Là **Customer** với booking **Confirmed**, tôi muốn thanh toán **60% còn lại** trước hoặc tại check-in qua VNPay hoặc chuyển khoản để hoàn tất nghĩa vụ tài chính trước khi nhận phòng.

**Why this priority**: FR-12 "Remaining Balance Payment"; FR-04 CHECKIN_DENIED_UNPAID gate.

**Independent Test**: Confirmed booking → pay remaining → Payment Paid + remaining invoice Paid; check-in allowed when fully paid.

**Acceptance Scenarios**:

1. **Given** booking **Confirmed** và invoice Remaining UNPAID, **When** Customer thanh toán VNPay thành công, **Then** Payment type Remaining **Paid**; invoice Remaining → **Paid**; `paid_amount` booking cập nhật đủ.
2. **Given** Customer chọn chuyển khoản phần còn lại, **When** upload receipt, **Then** Payment Pending + receipt; chờ Manager verify (US3).
3. **Given** booking chưa Confirmed (deposit chưa Paid), **When** Customer cố pay remaining, **Then** từ chối.
4. **Given** remaining invoice đã Paid, **When** Customer cố pay lại, **Then** từ chối.

---

### User Story 3 - Manager xác minh chuyển khoản với biên lai bắt buộc (Priority: P1)

Là **Manager**, tôi muốn xem danh sách Payment chờ xác minh, xem ảnh biên lai, **Approve/Reject** với ghi chú — **bắt buộc có PaymentReceipt** khi Approve — để xác nhận tiền đã về đúng booking.

**Why this priority**: FR-12 "Xác nhận chuyển khoản"; RBAC Segregation of Duties; SCR-36, SCR-37.

**Independent Test**: Manager mở pending bank transfer → zoom receipt → Approve → Payment Paid, deposit triggers Confirmed + contract; Reject → Failed + customer notified.

**Acceptance Scenarios**:

1. **Given** Manager được gán property P, **When** mở Payment Management (SCR-36) filter Pending, **Then** chỉ payments booking thuộc P hiển thị.
2. **Given** Payment Pending method Bank Transfer **có** PaymentReceipt, **When** Manager Approve (SCR-37), **Then** Payment → **Paid**; ghi `verifiedBy`, `verifiedAt`, `verificationNote`; invoice → Paid; deposit approve → booking **Confirmed** + contract Outbox.
3. **Given** Payment Pending **không có** PaymentReceipt, **When** Manager cố Approve, **Then** từ chối với thông báo bắt buộc upload biên lai.
4. **Given** Manager Reject, **When** xác nhận với lý do, **Then** Payment → **Failed**; invoice revert Unpaid; Customer được thông báo (FR-15).
5. **Given** Payment Pending quá **24 giờ** chưa duyệt, **When** hệ thống chạy reminder job, **Then** Manager được nhắc (notification) ít nhất một lần per payment until resolved.

---

### User Story 4 - VNPay timeout và đối soát tự động / thủ công (Priority: P1)

Là **hệ thống** (và **Admin**), tôi muốn cron đối soát **15 phút** các Payment VNPay **Pending** (mất IPN/rớt mạng) và Admin xử lý lệch trên SCR-52 để không mất giao dịch khách đã trả tiền.

**Why this priority**: FR-12 explicit VNPay Reconciliation; §8 Acceptance "VNPay Integration"; tránh khách bị trừ tiền hệ thống chưa ghi nhận.

**Independent Test**: Seed Pending VNPay payment → cron query OrderRef → updates Paid if VNPay success; discrepancy → Admin SCR-52 list + manual sync drawer.

**Acceptance Scenarios**:

1. **Given** Payment VNPay status **Pending** với `orderRef`, **When** cron reconciliation chạy (mỗi 15 phút), **Then** hệ thống truy vấn VNPay API và cập nhật **Paid** hoặc **Failed** khớp cổng.
2. **Given** IPN callback hợp lệ (signature verified), **When** nhận IPN, **Then** cập nhật Payment **Paid** idempotent theo `orderRef`; ghi `ipnReceivedAt`; không double-confirm booking.
3. **Given** số tiền VNPay ≠ amount DB, **When** reconciliation phát hiện, **Then** đánh dấu **DISCREPANCY** (assumption: flag on payment or reconciliation record); Admin thấy trên SCR-52.
4. **Given** Admin mở SCR-52, **When** chọn giao dịch lệch và **Sync from VNPay**, **Then** cập nhật trạng thái theo cổng; ghi audit; side-effects deposit Paid nếu applicable.
5. **Given** cùng IPN/cron replay, **When** Payment đã Paid, **Then** không duplicate side-effects (idempotent).

---

### User Story 5 - Customer và Manager xem lịch sử thanh toán chi tiết (Priority: P1)

Là **Customer** và **Manager**, tôi muốn xem lịch sử payment với loại, số tiền, phương thức, trạng thái, người xác minh và thời gian để tra cứu minh bạch.

**Why this priority**: FR-12 "Xem lịch sử thanh toán chi tiết kèm trạng thái"; SCR-26, SCR-36.

**Independent Test**: Customer `/payments/me` lists own payments; Manager scoped list; detail shows receipt link and verify metadata.

**Acceptance Scenarios**:

1. **Given** Customer có payments, **When** mở Payment History (SCR-26), **Then** danh sách type, amount, method, status, createdAt, paidAt — chỉ của mình.
2. **Given** Manager, **When** xem payment detail, **Then** hiển thị booking, customer, receipt image link, verifiedBy/verifiedAt nếu có.
3. **Given** Payment có PaymentReceipt, **When** Customer/Manager xem detail, **Then** có thể xem ảnh biên lai read-only.

---

### User Story 6 - Thanh toán phí bồi thường hư hại (Damage Fee Payment) (Priority: P2)

Là **hệ thống**, khi Manager/Admin phê duyệt **Damage Report**, tôi muốn tự động tạo payment obligation (invoice + payment path) cho **Damage Fee** để Customer thanh toán trước checkout hoàn tất.

**Why this priority**: FR-12 explicit Damage Fee Payment; §10 "tự động tạo khi Manager phê duyệt"; phụ thuộc FR-23 damage flow.

**Independent Test**: Damage approved → Damage Fee invoice (FR-11/FR-12) + Customer can pay via VNPay/transfer; booking → Pending Damage Payment until paid.

**Acceptance Scenarios**:

1. **Given** damage fee được phê duyệt (FR-23), **When** approval hoàn tất, **Then** tạo invoice Damage Fee + cho phép Customer initiate payment.
2. **Given** Customer thanh toán damage fee thành công, **When** confirmed, **Then** Payment Paid; booking có thể tiếp tục checkout flow (FR-04).
3. **Given** FR-23 chưa triển khai, **When** v1 ship, **Then** US6 deferred — stub interface only (assumption P2).

---

### Edge Cases

- VNPay URL creation / signature verification failure → user-friendly error; Payment không Paid; log for admin.
- Multiple concurrent VNPay attempts same invoice → one active Pending per invoice; new attempt cancels prior Pending or rejects (assumption: one Pending payment per invoice).
- Refund on booking cancel → Payment **Refunded** stub; full refund processing may align FR-04 cancel policy (assumption: record Refunded status, payout manual v1).
- **Cash** at reception: Manager records payment with mandatory receipt upload per Segregation of Duties (assumption v1).
- Employee — no Payment access (RBAC `-`).
- Admin read global payments + SCR-52 reconciliation; Manager verify only assigned property.
- Bank info display on receipt upload page from System Settings (Admin FR-17) — read-only for Customer.
- Payment amount MUST match linked invoice amount — reject mismatch on create.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Customer MUST có thể **thanh toán Deposit** (40%) qua **VNPay** hoặc **Bank Transfer** (+ upload receipt) khi booking **Pending Deposit** và invoice Deposit UNPAID.
- **FR-002**: Customer MUST có thể **thanh toán Remaining Balance** (60%) qua VNPay hoặc Bank Transfer khi booking **Confirmed** và invoice Remaining UNPAID.
- **FR-003**: Mỗi Payment MUST liên kết **invoiceId** (FR-11) và amount MUST khớp invoice amount tại thời điểm tạo.
- **FR-004**: VNPay flow MUST tạo Payment **Pending** với unique **orderRef** idempotency key trước redirect; verify callback/IPN signature trước khi **Paid**.
- **FR-005**: Deposit Payment **Paid** MUST trigger booking **Pending Deposit → Confirmed** (FR-04) và invoice sync **Paid** (FR-11) và contract Outbox (FR-10).
- **FR-006**: Remaining Payment **Paid** MUST sync invoice Remaining **Paid** và cập nhật booking paid balance; MUST NOT auto-confirm booking (already Confirmed).
- **FR-007**: Bank Transfer MUST tạo Payment **Pending**; Customer MUST upload **PaymentReceipt** (SCR-20) before or with submission.
- **FR-008**: Manager MUST **Approve/Reject** Pending bank transfers (SCR-37) scoped by **Property**; **Approve MUST require** attached PaymentReceipt.
- **FR-009**: Manager Approve MUST set `verifiedBy`, `verifiedAt`, `verificationNote`; Reject MUST set Failed + note.
- **FR-010**: Hệ thống MUST chạy **reconciliation cron mỗi 15 phút** query VNPay API by **orderRef** for all VNPay **Pending** payments (timeout/missed IPN).
- **FR-011**: **Admin** MUST xem danh sách giao dịch lệch/timeout (SCR-52) và thực hiện **manual sync** từ VNPay.
- **FR-012**: Customer MUST xem **payment history** chi tiết (SCR-26); Manager MUST xem danh sách/chi tiết payments (SCR-36) scoped by property.
- **FR-013**: Pending bank transfer **> 24h** MUST trigger **reminder notification** to assigned Manager (FR-15) until resolved.
- **FR-014**: Damage Fee Payment MUST auto-create when damage approved (FR-23) — **P2** if damage flow unavailable.
- **FR-015**: Hệ thống MUST ghi **ActivityLog** (PAYMENT_CREATED, PAYMENT_PAID, PAYMENT_FAILED, PAYMENT_VERIFIED, PAYMENT_REJECTED, PAYMENT_RECONCILED).
- **FR-016**: FR-12 MUST **không** tạo Invoice billing documents — thuộc FR-11; FR-12 consumes existing invoices.

### Key Entities

- **Payment**: id, invoiceId, bookingId, customerId, type (Deposit | Remaining Balance | Damage Fee), amount, method (VNPay | Bank Transfer | Cash), status (Pending | Paid | Failed | Refunded), orderRef, gatewayTransactionId, gatewayResponseCode, ipnReceivedAt, verifiedBy, verifiedAt, verificationNote, paidAt, createdAt, updatedAt.
- **PaymentReceipt**: id, paymentId, fileUrl, fileName, fileSize, createdAt — required for Manager Approve bank transfer.
- **Invoice** (read/link): FR-11 owns; FR-12 updates via sync service on payment lifecycle.
- **ReconciliationRecord** (optional display): paymentId, vnpayAmount, dbAmount, discrepancyFlag, lastSyncedAt — for SCR-52 (assumption: derived from Payment + VNPay query or lightweight audit row).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100%** VNPay IPN hợp lệ cập nhật Payment → **Paid** trong **dưới 30 giây** từ khi nhận callback.
- **SC-002**: **100%** VNPay Pending quá 15 phút không IPN được reconciliation cron xử lý trong lần chạy tiếp theo.
- **SC-003**: **100%** deposit bank transfer Approved chuyển booking **Confirmed** trong **dưới 10 giây** sau Manager Approve.
- **SC-004**: **0%** Manager Approve bank transfer **không có** PaymentReceipt (enforcement test).
- **SC-005**: Customer hoàn tất VNPay deposit flow (redirect + return) trong **dưới 5 phút** excluding bank-side time.
- **SC-006**: **100%** payment history requests trả đúng scope — Customer chỉ own; Manager chỉ assigned property.
- **SC-007**: **0** duplicate booking Confirmed từ replay IPN/cron (idempotency test).
- **SC-008**: **100%** Pending bank transfers > 24h nhận ít nhất **1** Manager reminder notification.

## Assumptions

- VNPay sandbox/production credentials từ env — không hardcode secrets.
- **orderRef** unique globally; format opaque UUID or booking-invoice suffix.
- One **active Pending** payment per invoice at a time — new pay attempt rejects if Pending exists (assumption v1).
- FR-11 invoices MUST exist before Customer can pay (FR-11 US1 prerequisite).
- Contract Outbox on deposit Paid delegated to FR-10 — FR-12 triggers via FR-04 confirmDeposit side-effect.
- Cash payments v1: Manager-initiated with receipt — rare path; same verify rules as bank transfer.
- Refund payout to customer bank — manual/off-system v1; system records **Refunded** status only.
- Damage Fee US6 **P2** — implement stub event listener; full flow when FR-23 ready.
- SCR-26 Payment History shows **Payment** records (transactions); FR-11 invoice list may complement — FR-12 owns payment history API `GET /payments/me`.
- Admin SCR-52 discrepancy drawer calls same VNPay query as cron with manual override audit.
