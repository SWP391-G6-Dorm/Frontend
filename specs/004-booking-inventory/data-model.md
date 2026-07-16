# Data Model: FR-04 Booking & Inventory Management

**Date**: 2026-06-27  
**Spec**: [spec.md](./spec.md) | **Base**: `docs/Specification_v2.md` §5 Booking, Payment, PaymentReceipt, OutboxEvent, HousekeepingTask, RoomInspection

## Scope

FR-04 **owns** Booking lifecycle, inventory locks, booking-triggered outbox events, and integration stubs for Contract (FR-10), Payment reconciliation (FR-12), Inspection (FR-23), Housekeeping (FR-21).

## ERD

```text
Customer 1──* Booking *──1 Room *──1 Property
Booking 1──* Payment 1──* PaymentReceipt
Booking 1──1 BookingInventoryLock
Booking 1──0..1 RoomInspection
Booking 1──0..* OutboxEvent (via bookingId in payload)
Room 1──* HousekeepingTask (created on checkout)
```

## Tables

### bookings

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| customer_id | UUID | FK users, NOT NULL | |
| room_id | UUID | FK rooms, NOT NULL | |
| check_in_date | DATE | NOT NULL | |
| check_out_date | DATE | NOT NULL, > check_in | |
| guest_count | INT | NOT NULL, > 0 | |
| special_requests | TEXT | nullable | |
| total_amount | DECIMAL(15,2) | NOT NULL | Snapshot |
| deposit_amount | DECIMAL(15,2) | NOT NULL | 40% at create |
| remaining_amount | DECIMAL(15,2) | NOT NULL | 60% at create |
| damage_fee_amount | DECIMAL(15,2) | DEFAULT 0 | From FR-23 |
| paid_amount | DECIMAL(15,2) | DEFAULT 0 | Denormalized cache |
| status | VARCHAR(32) | NOT NULL | Enum below |
| payment_method | VARCHAR(16) | NOT NULL | VNPAY, BANK_TRANSFER |
| hold_expires_at | TIMESTAMPTZ | nullable | Set on PENDING_DEPOSIT |
| cancelled_by | UUID | FK users, nullable | |
| cancel_reason | TEXT | nullable | |
| cancelled_at | TIMESTAMPTZ | nullable | |
| row_version | INT | NOT NULL DEFAULT 0 | Optimistic lock |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**: `(customer_id, status)`, `(room_id, check_in_date, check_out_date)`, `(status, hold_expires_at)` for timeout job, `(status, check_in_date)` for no-show job.

#### BookingStatus enum

| Value | Inventory locked? | Terminal? |
|-------|-------------------|-----------|
| PENDING_DEPOSIT | Yes | No |
| CONFIRMED | Yes | No |
| CHECKED_IN | Yes | No |
| PENDING_INSPECTION | Yes | No |
| PENDING_DAMAGE_PAYMENT | Yes | No |
| CHECKED_OUT | No (released) | Yes |
| CANCELLED | No (released) | Yes |
| NO_SHOW | No (released) | Yes |

**Blocking statuses for FR-03 availability** (overlap queries): all except `CANCELLED`, `CHECKED_OUT`, `NO_SHOW`.

### booking_inventory_locks

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK bookings UNIQUE, ON DELETE CASCADE |
| room_id | UUID | FK rooms NOT NULL |
| stay_range | daterange | NOT NULL `[check_in, check_out)` |

**Constraint** (requires `btree_gist`):

```sql
EXCLUDE USING gist (room_id WITH =, stay_range WITH &&)
```

Half-open range: check-in inclusive, check-out exclusive (standard hotel nights).

### payments (FR-04 creates deposit rows; FR-12 extends)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| booking_id | UUID | FK |
| customer_id | UUID | FK |
| type | ENUM | DEPOSIT, REMAINING_BALANCE, DAMAGE_FEE, REFUND |
| amount | DECIMAL(15,2) | |
| method | ENUM | VNPAY, BANK_TRANSFER, CASH |
| status | ENUM | PENDING, PAID, FAILED, REFUNDED |
| order_ref | VARCHAR(64) | UNIQUE idempotency |
| gateway_transaction_id | VARCHAR | VNPay |
| verified_by | UUID | Manager for bank transfer |
| verified_at | TIMESTAMPTZ | |
| verification_note | TEXT | |
| paid_at | TIMESTAMPTZ | |
| created_at, updated_at | TIMESTAMPTZ | |

### payment_receipts

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| payment_id | UUID | FK payments |
| file_url | VARCHAR(512) | |
| file_name | VARCHAR | |
| file_size | BIGINT | |
| created_at | TIMESTAMPTZ | |

### outbox_events (write on CONFIRMED)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| event_type | VARCHAR | e.g. CONTRACT_GENERATE_REQUESTED |
| payload | JSONB | `{ "bookingId": "..." }` |
| status | ENUM | PENDING, PROCESSED, FAILED |
| retry_count | INT | |
| created_at, processed_at | TIMESTAMPTZ | |

### room_inspections (minimal stub for FR-04 checkout gate)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| booking_id | UUID | FK UNIQUE |
| room_id | UUID | FK |
| status | ENUM | PENDING, IN_PROGRESS, PASSED, FAILED |
| note | TEXT | |
| inspected_by | UUID | Employee |
| created_at, updated_at | TIMESTAMPTZ | |

FR-23 expands; FR-04 only checks `PASSED` before checkout.

### housekeeping_tasks (insert on CHECKED_OUT)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| property_id | UUID | FK |
| room_id | UUID | FK |
| booking_id | UUID | FK nullable |
| status | ENUM | PENDING (default on create) |
| created_at | TIMESTAMPTZ | |

FR-21 assigns employee and state transitions.

## State Transition Rules

| From | Event | To | Side effects |
|------|-------|-----|--------------|
| — | createBooking | PENDING_DEPOSIT | Insert lock; hold_expires_at = now + timeout; Payment DEPOSIT PENDING |
| PENDING_DEPOSIT | depositPaid | CONFIRMED | Outbox CONTRACT_GENERATE_REQUESTED |
| PENDING_DEPOSIT | holdTimeout | CANCELLED | Delete lock |
| PENDING_DEPOSIT | customerCancel | CANCELLED | Delete lock |
| CONFIRMED | customerCancel | CANCELLED | Refund tier; delete lock |
| CONFIRMED | managerCancel | CANCELLED | 100% refund; delete lock |
| CONFIRMED | noShowJob | NO_SHOW | Deposit kept; delete lock |
| CONFIRMED | checkIn | CHECKED_IN | Room → OCCUPIED |
| CHECKED_IN | requestCheckout | PENDING_INSPECTION | Create inspection if absent |
| PENDING_INSPECTION | inspectionPassed + paid | CHECKED_OUT | Room PENDING_CLEANING; HousekeepingTask |
| PENDING_INSPECTION | damageApproved unpaid | PENDING_DAMAGE_PAYMENT | |
| PENDING_DAMAGE_PAYMENT | damagePaid | CHECKED_OUT | Same checkout side effects |

## Validation Rules

| Rule | Error |
|------|-------|
| check_out > check_in | 400 field error |
| check_in >= today (Asia/Ho_Chi_Minh) | 400 |
| guest_count <= room.capacity | 400 |
| room.status bookable | 409 ROOM_NOT_AVAILABLE |
| overlapping lock exists | 409 ROOM_NOT_AVAILABLE |
| cancel after CHECKED_IN | 409 CANNOT_CANCEL |
| modify non-CONFIRMED | 409 INVALID_STATUS |
| check-out without inspection PASSED | 409 INSPECTION_REQUIRED |
| check-out with unpaid damage | 409 PAYMENT_REQUIRED |

## DTOs (summary)

### CreateBookingRequest

```json
{
  "roomId": "uuid",
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-03",
  "guestCount": 2,
  "specialRequests": "Late check-in",
  "paymentMethod": "VNPAY"
}
```

### CreateBookingResponse

```json
{
  "bookingId": "uuid",
  "status": "PENDING_DEPOSIT",
  "totalAmount": 1000000,
  "depositAmount": 400000,
  "remainingAmount": 600000,
  "holdExpiresAt": "2026-06-27T12:30:00+07:00",
  "paymentUrl": "https://..."
}
```

`paymentUrl` only when `paymentMethod=VNPAY`; bank transfer omits URL.

### BookingDetail (customer/manager variants)

Customer: includes `paidAmount`, `remainingAmount`, `actions[]` (PAY_DEPOSIT, UPLOAD_RECEIPT, CANCEL, PAY_REMAINING).  
Manager: adds `customerName`, `customerEmail`, `customerPhone`, payment breakdown.

### CancellationPreview

```json
{
  "daysUntilCheckIn": 5,
  "refundPercent": 50,
  "refundAmount": 200000,
  "forfeitAmount": 200000,
  "policyText": "..."
}
```

## Flyway Migration Order

```text
V0xx__enable_btree_gist.sql
V0xx__bookings_table.sql
V0xx__booking_inventory_locks.sql
V0xx__payments_booking_fk.sql (if not in FR-12)
V0xx__outbox_events.sql
V0xx__room_inspections_stub.sql
V0xx__housekeeping_tasks_booking_id.sql
```

## Audit Log Actions (ActivityLog)

- `BOOKING_CREATED`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `BOOKING_CHECKED_IN`, `BOOKING_CHECKED_OUT`, `BOOKING_NO_SHOW`, `BOOKING_MODIFIED`
