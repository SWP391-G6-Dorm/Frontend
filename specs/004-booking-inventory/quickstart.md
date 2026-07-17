# Quickstart: FR-04 Booking & Inventory Management

**Feature**: `specs/004-booking-inventory` | **Plan**: [plan.md](./plan.md)

**Prerequisite**: FR-01 auth (Customer + Manager JWT); FR-03 room available; seed at least 1 ACTIVE room with known UUID; PostgreSQL with `btree_gist` extension.

## Prerequisites

- Java 17+, Maven 3.9+
- Node 18+
- PostgreSQL 15+
- VNPay sandbox credentials (optional — use mock callback for local dev)

## Environment

```bash
# backend application.yml / env
BOOKING_HOLD_TIMEOUT_MINUTES=30
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_RETURN_URL=http://localhost:5173/customer/payments/callback
```

```bash
# frontend/.env
VITE_API_URL=
```

Vite proxy: `/api/v1` → `http://localhost:8080`

## Run

```bash
cd backend && ./mvnw spring-boot:run
cd frontend && npm install && npm run dev
```

## Screen → Route → API

| Screen | Route | API |
|--------|-------|-----|
| SCR-16 Booking Checkout | `/customer/bookings/new/:roomId` | `POST /bookings` |
| SCR-17 My Bookings | `/customer/bookings` | `GET /bookings/me` |
| SCR-18 Booking Detail | `/customer/bookings/:id` | `GET /bookings/me/{id}` |
| SCR-19 Cancel | `/customer/bookings/:id/cancel` | `GET .../cancel/preview`, `PATCH .../cancel` |
| SCR-20 Receipt Upload | `/customer/bookings/:id/receipt` | `POST /bookings/{id}/receipts` |
| SCR-34 Manager List | `/manager/bookings` | `GET /manager/bookings?propertyId=` |
| SCR-35 Manager Detail | `/manager/bookings/:id` | `GET /manager/bookings/{id}`, PATCH check-in/out |
| SCR-37 Payment Verify | `/manager/payments/:id/verify` | `PATCH /manager/payments/{id}/verify` |

## curl smoke tests

Replace `TOKEN`, `ROOM_ID`, `PROPERTY_ID`, `BOOKING_ID` after seed.

```bash
BASE=http://localhost:8080/api/v1
TOKEN="<customer-jwt>"
MGR_TOKEN="<manager-jwt>"

# Create booking (SCR-16)
curl -s -X POST "$BASE/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"roomId\":\"$ROOM_ID\",\"checkIn\":\"2026-08-01\",\"checkOut\":\"2026-08-03\",\"guestCount\":2,\"paymentMethod\":\"BANK_TRANSFER\"}" | jq

# List my bookings (SCR-17)
curl -s "$BASE/bookings/me?page=0&size=10" \
  -H "Authorization: Bearer $TOKEN" | jq

# Booking detail (SCR-18)
curl -s "$BASE/bookings/me/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Cancellation preview (SCR-19)
curl -s "$BASE/bookings/$BOOKING_ID/cancel/preview" \
  -H "Authorization: Bearer $TOKEN" | jq

# Upload receipt (SCR-20)
curl -s -X POST "$BASE/bookings/$BOOKING_ID/receipts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"attachments":[{"url":"https://storage.example/receipt.jpg","type":"IMAGE"}]}' | jq

# Manager list (SCR-34)
curl -s "$BASE/manager/bookings?propertyId=$PROPERTY_ID&status=CONFIRMED" \
  -H "Authorization: Bearer $MGR_TOKEN" | jq

# Check-in (SCR-35)
curl -s -X PATCH "$BASE/manager/bookings/$BOOKING_ID/check-in" \
  -H "Authorization: Bearer $MGR_TOKEN" | jq

# Check-out (requires inspection PASSED stub)
curl -s -X PATCH "$BASE/manager/bookings/$BOOKING_ID/check-out" \
  -H "Authorization: Bearer $MGR_TOKEN" | jq

# VNPay deposit URL
curl -s -X POST "$BASE/payments/vnpay/create-url?bookingId=$BOOKING_ID&type=DEPOSIT" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Concurrent overbooking test

Run integration test `ConcurrentBookingIT` (two parallel POST /bookings same room/dates → exactly one 201, one 409).

## Validation checklist

- [ ] Booking created with 40/60 split and hold_expires_at
- [ ] Second concurrent booking returns 409
- [ ] Hold timeout job cancels PENDING_DEPOSIT after 30 min
- [ ] Deposit confirm → CONFIRMED + outbox event row
- [ ] Customer cancel shows correct refund tier
- [ ] Manager check-out blocked without inspection PASSED
- [ ] Check-out creates housekeeping task + room PENDING_CLEANING

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `gist exclusion violation` on create | Expected when room already locked — correct behavior |
| 403 on manager booking | Manager not assigned to property |
| Check-out 409 INSPECTION_REQUIRED | Seed `room_inspections.status=PASSED` for booking |
| Frontend 404 on /api/bookings | Migrate to `/api/v1/bookings/me` per plan gap analysis |
