# Research: FR-04 Booking & Inventory Management

**Date**: 2026-06-27  
**Spec**: [spec.md](./spec.md) | **Docs**: `docs/Specification_v2.md` § FR-04, `docs/api-spec-by-screen.md` SCR-15–20/34–37, `docs/entity-ui-mapping.md`, frontend `bookingApi.ts`, `paymentApi.ts`

## 1. Inventory Locking (Zero Overbooking)

**Decision**: PostgreSQL `btree_gist` + `EXCLUDE USING gist` on table `booking_inventory_locks` with columns `(room_id, stay_range daterange)` where overlapping ranges for same room are forbidden. One lock row inserted in same transaction as booking create; deleted (or marked released) when booking reaches terminal state (`CANCELLED`, `NO_SHOW`, `CHECKED_OUT`).

**Rationale**: Specification_v2 FR-04 mandates database-level atomic exclusion; prevents race when two customers book same room/dates concurrently.

**Alternatives considered**: Application-level SELECT FOR UPDATE only — rejected (race under load). Optimistic check in service without DB constraint — rejected (SC-002 zero overbooking).

## 2. Hold Timeout Duration

**Decision**: Default **30 minutes** via `SystemSetting` key `BOOKING_HOLD_TIMEOUT_MINUTES` (fallback env `BOOKING_HOLD_TIMEOUT_MINUTES=30`). Scheduled job runs every **1 minute**, cancels `PENDING_DEPOSIT` where `hold_expires_at < now()` and no deposit payment `PAID`.

**Rationale**: spec Assumptions + Specification_v2 FR-04; supersedes api-spec-by-screen note "15-minute VNPay cron" (that cron is **reconciliation** interval in FR-12, not hold timeout).

**Alternatives considered**: 15-minute hold — rejected for this feature (spec primary source).

## 3. Pricing Snapshot

**Decision**: On `POST /bookings`, `BookingPricingService.calculate(roomId, checkIn, checkOut)` reuses FR-03 `PricingService` logic, persists `total_amount`, `deposit_amount = round(total * 0.40)`, `remaining_amount = total - deposit`, `price_per_night_snapshot` (optional JSON breakdown). Never recalculated on read; modify booking recalculates new snapshot.

**Rationale**: FR-003 spec; Manager price changes after booking must not affect existing booking.

**Alternatives considered**: Live price on detail view — rejected.

## 4. Booking State Machine

**Decision**: Enum `BookingStatus`: `PENDING_DEPOSIT`, `CONFIRMED`, `CHECKED_IN`, `PENDING_INSPECTION`, `PENDING_DAMAGE_PAYMENT`, `CHECKED_OUT`, `CANCELLED`, `NO_SHOW`. Transitions enforced in `BookingStateService` (illegal transition → 409).

```text
(null) → PENDING_DEPOSIT [create]
PENDING_DEPOSIT → CONFIRMED [deposit confirmed]
PENDING_DEPOSIT → CANCELLED [timeout | customer cancel | manager cancel]
CONFIRMED → CHECKED_IN [manager check-in]
CONFIRMED → CANCELLED [customer/manager cancel]
CONFIRMED → NO_SHOW [cron 24h after check-in datetime]
CHECKED_IN → PENDING_INSPECTION [manager initiates checkout / auto on checkout request]
PENDING_INSPECTION → CHECKED_IN [inspection rework - rare]
PENDING_INSPECTION → PENDING_DAMAGE_PAYMENT [damage approved, unpaid]
PENDING_INSPECTION → CHECKED_OUT [inspection passed, payments complete]
PENDING_DAMAGE_PAYMENT → CHECKED_OUT [damage paid]
CHECKED_OUT → terminal
NO_SHOW → terminal (release inventory)
```

**Rationale**: Specification_v2 §5 Booking values + entity-ui-mapping §2.1.

**Alternatives considered**: Skip `PENDING_INSPECTION` enum — rejected (explicit in spec entity).

## 5. Deposit Confirmation Paths

**Decision**: Two paths to `CONFIRMED`:
1. **VNPay**: `POST /payments/vnpay/create-url?bookingId&type=DEPOSIT` → redirect; IPN/callback marks Payment `PAID` → booking `CONFIRMED` (idempotent via `OrderRef`).
2. **Bank transfer**: booking stays `PENDING_DEPOSIT` with Payment `PENDING`; `POST /bookings/{id}/receipts` uploads receipt; Manager `PATCH /manager/payments/{id}/verify` `{ status: APPROVED }` → `CONFIRMED`.

**Rationale**: FR-04 + SCR-16/20/37; paymentApi.ts already has VNPay create-url pattern.

**Alternatives considered**: Single combined endpoint — rejected (different UX flows).

## 6. Contract Generation Trigger (Outbox)

**Decision**: On transition to `CONFIRMED`, insert `OutboxEvent` `{ eventType: CONTRACT_GENERATE_REQUESTED, payload: { bookingId } }` in same transaction. FR-10 worker processes PDF + email. FR-04 implements outbox write + stub processor interface only if FR-10 not ready.

**Rationale**: Specification_v2 Outbox pattern; decouples booking from PDF generation failure.

**Alternatives considered**: Synchronous PDF in request thread — rejected (latency, failure coupling).

## 7. Cancellation Refund Tiers

**Decision**: `CancellationPolicyService.preview(booking)` returns `{ daysUntilCheckIn, refundPercent, refundAmount }`. Tiers: `days >= 7 → 100%`, `3 <= days < 7 → 50%`, `days < 3 → 0%` of **deposit paid** (not total). Customer `PATCH /bookings/{id}/cancel` applies; creates refund Payment record `REFUNDED` stub (full refund processing FR-12).

**Rationale**: spec FR-010; SCR-19 shows refund amount before confirm.

**Alternatives considered**: Refund on total amount — rejected (spec says cọc).

## 8. Manager Cancel vs Customer Cancel

**Decision**: Separate endpoint `PATCH /manager/bookings/{id}/cancel` with body `{ reason, forceRefundPercent: 100 }` — always **100% deposit refund** regardless of days. Records `cancelled_by` = manager userId, `cancel_reason`. Customer cancel uses existing `PATCH /bookings/{id}/cancel`.

**Rationale**: FR-016; api-spec lacks manager cancel — extend contract.

**Alternatives considered**: Same endpoint with role flag — rejected (unclear audit trail).

## 9. Modify Confirmed Booking

**Decision**: `PATCH /manager/bookings/{id}` body `{ checkIn?, checkOut?, roomId? }` — only when `status = CONFIRMED`. Re-validate inventory, recalculate snapshot, compute `priceDelta`; if delta > 0 create pending payment line; release old lock + insert new lock in one transaction. `@Version rowVersion` optimistic lock.

**Rationale**: FR-015; no api-spec endpoint — add to contract.

**Alternatives considered**: Cancel + rebook — rejected (poor UX, loses contract link).

## 10. Check-in / Check-out Gates

**Decision**:
- **Check-in**: `CONFIRMED` only; optional gate `remaining_amount` must be 0 if property setting `REQUIRE_REMAINING_BEFORE_CHECKIN=true` (default false — pay at check-in allowed).
- **Check-out**: Requires `RoomInspection.status = PASSED` for booking (FR-23 stub: table + minimal pass/fail); block if `damage_fee_amount > 0` and damage payment not `PAID`. On success: `CHECKED_OUT`, room → `PENDING_CLEANING`, insert `HousekeepingTask` (FR-21 stub).

**Rationale**: FR-012, FR-013, FR-014.

**Alternatives considered**: Manager override inspection — rejected (spec).

## 11. No-show Scheduled Job

**Decision**: Cron every **15 minutes**: `CONFIRMED` where `check_in_date + 24 hours < now()` and not yet `CHECKED_IN` → `NO_SHOW`; deposit non-refundable; release inventory lock.

**Rationale**: FR-008; entity-ui-mapping.

**Alternatives considered**: Immediate at check-in midnight — rejected (spec says 24h from check-in time).

## 12. API Path Standardization

**Decision**: All booking endpoints under `/api/v1/bookings` (customer) and `/api/v1/manager/bookings` (manager). Migrate frontend from `/api/bookings` to `/api/v1/bookings/me` for list/detail self-scope.

**Rationale**: api-spec-by-screen.md; AGENTS.md REST standards.

**Alternatives considered**: Keep `/api/bookings` — rejected (inconsistent with FR-02/03).

## 13. Security & RBAC

**Decision**: `@PreAuthorize` — Customer: own booking only (`customerId == auth.userId`). Manager: `@PropertyAccess` on booking.room.propertyId. Deposit/create: `ROLE_CUSTOMER`. Scheduled jobs: system internal.

**Rationale**: AGENTS.md property-level isolation.

**Alternatives considered**: Shared booking list endpoint — rejected.

## 14. Optimistic Concurrency

**Decision**: `bookings.row_version` (JPA `@Version`) on modify/cancel/check-in/out to prevent lost updates.

**Rationale**: Specification_v2 Booking.RowVersion.

**Alternatives considered**: Last-write-wins — rejected for financial entity.

## 15. Frontend Integration

**Decision**: Wire `BookingFormPage.tsx` (currently mock) to `POST /api/v1/bookings` with `paymentMethod`; align `bookingApi.ts` + `bookingsApi.ts` into single module; manager pages use `/api/v1/manager/bookings/*`; cancellation page calls preview + cancel; receipt upload SCR-20.

**Rationale**: Frontend pages exist but API paths outdated; BookingFormPage TODO.

**Alternatives considered**: New pages from scratch — rejected (reuse existing SCR-16–20, 34–35).
