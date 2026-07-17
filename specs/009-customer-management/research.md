# Research: FR-09 Customer Management

**Date**: 2026-06-27  
**Spec**: [spec.md](./spec.md) | **Docs**: `docs/Specification_v2.md` FR-09, `docs/api-spec-by-screen.md` SCR-51, frontend `adminApi.ts`

## 1. Table Ownership

**Decision**: FR-09 **does not** create new tables. Reads/writes `users` (FR-01); reads `bookings` (FR-04) for history and aggregates.

**Rationale**: User entity owned by FR-01; Booking owned by FR-04. FR-09 is Admin operational layer.

**Alternatives considered**: Separate `customers` table — rejected (duplicate User).

## 2. Admin API Surface

**Decision**:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/admin/users?role=CUSTOMER` | SCR-51 list + filters |
| GET | `/api/v1/admin/users/{id}` | Customer profile detail |
| PATCH | `/api/v1/admin/users/{id}/status` | Active ↔ Suspended |
| GET | `/api/v1/admin/users/{id}/bookings` | Paginated booking history |

**Rationale**: Extends existing SCR-50 `/admin/users` pattern (FR-06 consumes `role=MANAGER`); api-spec SCR-51 documents GET only — PATCH/detail/bookings added per spec FR-003/005/006.

**Alternatives considered**: Single mega detail with embedded bookings — rejected for pagination on large histories.

## 3. Status Transition Rules

**Decision**: Admin may set `ACTIVE` or `SUSPENDED` only when target user `role=CUSTOMER` and current status is `ACTIVE` or `SUSPENDED`. Reject status change when `INACTIVE` (pre-OTP) with 409.

**Rationale**: spec Assumptions + Edge Cases; INACTIVE managed by FR-01 OTP flow.

**Alternatives considered**: Admin activate INACTIVE directly — rejected (bypasses email verification).

## 4. Login Block Integration

**Decision**: FR-09 updates `users.status`; FR-01 `AuthService` already rejects login/refresh when `SUSPENDED`. No token revocation on suspend v1.

**Rationale**: spec Edge Case — existing sessions expire naturally; new login blocked.

**Alternatives considered**: Revoke all refresh tokens on suspend — deferred v2.

## 5. Total Bookings & Total Spend Aggregates

**Decision**:

- `totalBookings` = `COUNT(*)` bookings WHERE `customer_id = user.id`
- `totalSpend` = `SUM(total_amount)` WHERE `customer_id = user.id` AND `status IN ('CONFIRMED','CHECKED_IN','PENDING_INSPECTION','PENDING_DAMAGE_PAYMENT','CHECKED_OUT')`

**Rationale**: spec Assumption — spend counts confirmed-and-beyond lifecycle; excludes PENDING_DEPOSIT/CANCELLED/NO_SHOW.

**Alternatives considered**: SUM paid_amount from payments table — deferred to FR-12; booking total_amount snapshot sufficient v1.

## 6. Search & Filter

**Decision**: Query params `search` (ILIKE full_name OR email), `status` (INACTIVE|ACTIVE|SUSPENDED), `page`, `size`, `sort=createdAt,desc`. Hard-filter `role=CUSTOMER`.

**Rationale**: spec FR-001; align api-spec pagination §1.

**Alternatives considered**: Full-text search engine — YAGNI v1.

## 7. Booking History Response

**Decision**: Return booking id, checkInDate, checkOutDate, roomNumber (join rooms), propertyName (join properties), totalAmount, status — sorted `createdAt DESC`.

**Rationale**: spec FR-006 + SCR-51 drawer columns.

**Alternatives considered**: Full booking detail — out of scope; link to future admin booking view.

## 8. Controller Split vs Extend

**Decision**: `AdminCustomerController` under `/api/v1/admin/users` for CUSTOMER operations; existing manager directory (SCR-50) can share `AdminUserController` or same service with role param.

**Rationale**: Clear SCR-51 ownership; avoids breaking FR-06 manager picker.

**Alternatives considered**: Monolithic AdminUserController — acceptable if team prefers one file; plan uses dedicated controller for traceability.

## 9. Frontend UX

**Decision**: Single page `CustomerDirectoryPage` with row click → `CustomerDetailDrawer` (profile + booking table); suspend/activate actions in drawer and row kebab with ConfirmationDialog.

**Rationale**: screendesign.md SCR-51 Drawer pattern.

**Alternatives considered**: Dedicated detail route — rejected per spec Assumptions.

## 10. Legacy adminApi Migration

**Decision**: New `adminCustomerApi.ts` (or refactor `adminApi.ts`) to `/api/v1/admin/users`; map `name` → `fullName`; remove generic `updateUser` role change from customer flows.

**Rationale**: plan Frontend Gap; prevent accidental role mutation.

**Alternatives considered**: Keep legacy paths — rejected (api-spec v1 standard).

## 11. Optional Migration

**Decision**: Optional `V012__users_role_status_index.sql` — index `(role, status)` and GIN/trgm on `(full_name, email)` if list slow.

**Rationale**: performance for SC-001 search; not blocking MVP.

**Alternatives considered**: No index — acceptable for dev seed scale.

## 12. Outstanding Debt Display

**Decision**: If `users.outstanding_debt` column added by damage flow later, include read-only boolean in `CustomerDetailResponse`; FR-09 does not write it.

**Rationale**: spec Edge Case + Assumptions.

**Alternatives considered**: Omit until column exists — default false/null.

## 13. Audit Events

**Decision**: ActivityLog event `USER_STATUS_CHANGED` with payload `{ userId, oldStatus, newStatus, changedBy }`.

**Rationale**: spec FR-009; align FR-08 ROOM_* pattern.

**Alternatives considered**: Separate audit table only — insufficient for admin dashboard.

## 14. RBAC

**Decision**: All endpoints `@PreAuthorize("hasRole('ADMIN')")`; return 403 for MANAGER/EMPLOYEE/CUSTOMER.

**Rationale**: spec FR-007; Specification_v2 §4 Admin global scope.

**Alternatives considered**: Manager read-only customer list — out of scope (figma SCR-55/56 separate feature).
