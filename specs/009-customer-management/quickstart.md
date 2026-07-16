# Quickstart: FR-09 Customer Management

**Feature**: `specs/009-customer-management` | **Plan**: [plan.md](./plan.md)

**Prerequisite**: FR-01 users + auth; FR-04 bookings (optional for empty history).

## Prerequisites

- Java 17+, Maven 3.9+
- Node 18+
- PostgreSQL 15+
- Admin JWT + at least one CUSTOMER user with bookings (seed)

## Environment

Vite proxy: `/api/v1` → `http://localhost:8080`

## Run

```bash
cd backend && ./mvnw spring-boot:run
cd frontend && npm install && npm run dev
```

## Screen → Route → API

| Screen | Route | API |
|--------|-------|-----|
| SCR-51 Customer Directory | `/admin/customers` | `GET /admin/users?role=CUSTOMER` |
| Drawer profile | (row click) | `GET /admin/users/{id}` |
| Drawer bookings | (row click) | `GET /admin/users/{id}/bookings` |
| Suspend / Activate | (drawer action) | `PATCH /admin/users/{id}/status` |

## curl smoke tests

Replace tokens and IDs.

```bash
BASE=http://localhost:8080/api/v1
ADMIN_TOKEN="<admin-jwt>"
CUSTOMER_ID="<customer-uuid>"

# SCR-51 — list customers
curl -s "$BASE/admin/users?role=CUSTOMER&page=0&size=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Search by email fragment
curl -s "$BASE/admin/users?role=CUSTOMER&search=example.com" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Filter Active only
curl -s "$BASE/admin/users?role=CUSTOMER&status=ACTIVE" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Customer detail
curl -s "$BASE/admin/users/$CUSTOMER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Booking history
curl -s "$BASE/admin/users/$CUSTOMER_ID/bookings?page=0&size=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Suspend customer
curl -s -X PATCH "$BASE/admin/users/$CUSTOMER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"SUSPENDED"}' | jq

# Verify suspended login blocked (FR-01)
curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"Password1"}' | jq

# Reactivate
curl -s -X PATCH "$BASE/admin/users/$CUSTOMER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACTIVE"}' | jq

# INACTIVE customer — expect 409 on status change
INACTIVE_ID="<inactive-customer-uuid>"
curl -s -X PATCH "$BASE/admin/users/$INACTIVE_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"SUSPENDED"}' | jq

# Manager denied
MGR_TOKEN="<manager-jwt>"
curl -s "$BASE/admin/users?role=CUSTOMER" \
  -H "Authorization: Bearer $MGR_TOKEN" | jq
```

## Validation checklist

- [ ] List returns only `role=CUSTOMER` users
- [ ] totalBookings and totalSpend aggregates present on list rows
- [ ] Search matches fullName or email
- [ ] Suspend → Customer login returns suspended message (FR-01)
- [ ] Activate restores login
- [ ] INACTIVE customer status PATCH returns **409**
- [ ] Non-admin roles receive **403**
- [ ] Booking history scoped to selected customer only
- [ ] Status change writes ActivityLog `USER_STATUS_CHANGED`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 403 on all admin calls | Verify ADMIN role JWT |
| Empty booking history | Seed FR-04 bookings or expected for new customers |
| Aggregates all zero | Normal if no bookings |
| Legacy `/api/admin/users` | Migrate frontend to `/api/v1/admin/users` |
| Cannot suspend INACTIVE | By design — user must verify email first (FR-01) |
