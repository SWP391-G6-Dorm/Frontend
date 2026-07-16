# Data Model: FR-09 Customer Management

**Date**: 2026-06-27  
**Spec**: [spec.md](./spec.md) | **Base**: `docs/Specification_v2.md` §5 User, Booking

## Scope

FR-09 **does not own** new entities. Operates on **User** (FR-01) where `role=CUSTOMER`; reads **Booking** (FR-04) for history and aggregates.

## ERD

```text
User (role=CUSTOMER) 1──* Booking
Admin ──writes──> User.status (ACTIVE | SUSPENDED)
Admin ──reads───> Booking (by customer_id)
```

## Entity: User (Customer scope — FR-01 owned)

| Attribute | Type | FR-09 usage |
|-----------|------|-------------|
| id | UUID | PK |
| fullName | String | List, detail, search |
| email | String | List, detail, search |
| phone | String | Detail read-only |
| avatarUrl | String | Detail read-only |
| role | Enum | MUST be CUSTOMER for all FR-09 ops |
| status | Enum | INACTIVE \| ACTIVE \| SUSPENDED — FR-09 writes ACTIVE/SUSPENDED only |
| createdAt | DateTime | Detail "Registered" |
| updatedAt | DateTime | Audit |

### Status transitions (FR-09)

```text
ACTIVE    ──Admin Suspend──> SUSPENDED
SUSPENDED ──Admin Activate─> ACTIVE
INACTIVE  ──(no FR-09 write)──> managed by FR-01 OTP verify → ACTIVE
```

**Validation**:

- PATCH status rejected if `role != CUSTOMER` → 403/404
- PATCH status rejected if current status is `INACTIVE` → 409
- Only `ACTIVE` and `SUSPENDED` valid in request body

## View: CustomerSummary (list row)

| Field | Source | Notes |
|-------|--------|-------|
| id | users.id | |
| fullName | users.full_name | |
| email | users.email | |
| phone | users.phone | optional in list |
| status | users.status | Badge |
| avatarUrl | users.avatar_url | optional |
| totalBookings | aggregate | COUNT bookings by customer_id |
| totalSpend | aggregate | SUM total_amount confirmed+ statuses |
| createdAt | users.created_at | |

## View: CustomerDetail (drawer)

Extends CustomerSummary with:

| Field | Source |
|-------|--------|
| outstandingDebt | users flag if exists (read-only, optional v2) |

Nested paginated `bookings[]` from separate endpoint or embedded first page.

## Entity: Booking (read-only — FR-04 owned)

Used in `GET .../bookings` and aggregates.

| Field in response | Booking column |
|-------------------|----------------|
| id | id |
| checkInDate | check_in_date |
| checkOutDate | check_out_date |
| totalAmount | total_amount |
| status | status |
| roomNumber | join rooms.room_number |
| propertyName | join properties.name |

**Sort**: `bookings.created_at DESC`

## Aggregate SQL (reference)

```sql
-- totalBookings
SELECT COUNT(*) FROM bookings WHERE customer_id = :userId;

-- totalSpend
SELECT COALESCE(SUM(total_amount), 0)
FROM bookings
WHERE customer_id = :userId
  AND status IN (
    'CONFIRMED', 'CHECKED_IN', 'PENDING_INSPECTION',
    'PENDING_DAMAGE_PAYMENT', 'CHECKED_OUT'
  );
```

## Optional Flyway

```text
V012__users_customer_list_indexes.sql
  CREATE INDEX idx_users_role_status ON users (role, status);
  CREATE INDEX idx_bookings_customer_id ON bookings (customer_id);
```

**Note**: `idx_bookings_customer_id` may already exist in FR-04 V020+ — skip if duplicate.

## ActivityLog Events

| Event | When |
|-------|------|
| USER_STATUS_CHANGED | PATCH status success |

Payload: `{ userId, previousStatus, newStatus, adminId }`

## Integration Points

| Feature | Integration |
|---------|-------------|
| FR-01 | User entity; AuthService blocks SUSPENDED login |
| FR-04 | BookingRepository queries by customer_id |
| FR-06 | Shares `/admin/users` base path pattern with SCR-50 MANAGER list |
| FR-17 | Complaints separate — not FR-09 |
| FR-02 | Customer self-edits profile — Admin read-only in FR-09 |

## Security

| Endpoint | ADMIN | Others |
|----------|-------|--------|
| GET /admin/users?role=CUSTOMER | ✓ | Denied |
| GET /admin/users/{id} | ✓ (CUSTOMER only) | Denied |
| PATCH /admin/users/{id}/status | ✓ | Denied |
| GET /admin/users/{id}/bookings | ✓ | Denied |
