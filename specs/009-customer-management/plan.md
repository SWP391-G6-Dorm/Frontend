# Implementation Plan: FR-09 Customer Management

**Branch**: `011-customer-management` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-customer-management/spec.md`

**Nguồn docs**: `docs/Specification_v2.md` (FR-09, §5 User, §10 Administration), `docs/api-spec-by-screen.md` (SCR-51), `docs/screen.md`, `docs/screendesign.md`, `docs/entity-ui-mapping.md` § Admin SCR-51, frontend `adminApi.ts` (legacy)

**Phụ thuộc**: FR-01 (`users` table, SUSPENDED login block); FR-04 (`bookings` read for history + aggregates). **Ranh giới**: FR-17 (Complaints SCR-54, system settings); FR-02 (Customer self-profile); Manager Customer List (figma SCR-55/56); Outstanding Debt marking (damage flow).

## Summary

Triển khai **FR-09 Customer Management**: Admin Customer Directory (SCR-51) — paginated list với search/status filter + aggregates (Total Bookings, Total Spend); PATCH status Active/Suspended; read-only profile + booking history drawer. **Không** tạo bảng mới — mở rộng `users` (FR-01) và đọc `bookings` (FR-04). Stack: **Spring Boot 3 + JPA** + **React/TypeScript** — tạo trang Admin mới; migrate `adminApi.ts` → `/api/v1/admin/users`.

## Technical Context

**Language/Version**: Java 17+, TypeScript 5.x, React 18  
**Primary Dependencies**: Spring Boot 3.x, Spring Security, Spring Data JPA; Vite, Axios, React Router  
**Storage**: PostgreSQL — read/write `users.status` (FR-01); read `bookings` + aggregate queries (FR-04)  
**Testing**: JUnit 5 + Mockito; `AdminCustomerServiceTest` status rules + aggregates; `AdminCustomerControllerIT` RBAC + suspend flow  
**Target Platform**: Web application  
**Project Type**: `frontend/` + `backend/`  
**Performance Goals**: Customer list p95 < 500ms for ≤5k customers; detail + ≤50 bookings p95 < 2s  
**Constraints**: ADMIN role only; chỉ user `role=CUSTOMER`; status toggle chỉ ACTIVE↔SUSPENDED; INACTIVE read-only; audit log USER_STATUS_CHANGED  
**Scale/Scope**: ~4 REST endpoints; 3 user stories; SCR-51

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Layered architecture | PASS | AdminCustomerController → AdminCustomerService → UserRepository, BookingRepository |
| DTO + Bean Validation | PASS | UpdateCustomerStatusRequest, CustomerSummaryResponse |
| Security-first (RBAC) | PASS | `@PreAuthorize("hasRole('ADMIN')")` on all endpoints |
| No secrets in code | PASS | N/A |
| Test coverage ≥80% | PASS | Status transition + RBAC IT |
| Standard API envelope | PASS | api-spec §1 |
| Audit log | PASS | USER_STATUS_CHANGED on PATCH status |

**Post-design re-check**: PASS — FR-01 AuthService already rejects SUSPENDED login; FR-09 only updates `users.status`.

## Project Structure

### Documentation (this feature)

```text
specs/009-customer-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/customer-api.yaml
├── spec.md
└── tasks.md              # /speckit-tasks (next)
```

### Source Code (repository root)

```text
backend/src/main/java/com/homestay/
├── controllers/
│   └── AdminCustomerController.java     # SCR-51 /admin/users?role=CUSTOMER, detail, status, bookings
├── dtos/admin/
│   ├── CustomerSummaryResponse.java
│   ├── CustomerDetailResponse.java
│   ├── CustomerBookingSummaryResponse.java
│   ├── UpdateCustomerStatusRequest.java
│   └── CustomerPageResponse.java
├── services/
│   └── AdminCustomerService.java        # list, detail, updateStatus, bookingHistory, aggregates
├── repositories/
│   ├── UserRepository.java              # extend: findCustomersWithFilters (FR-01 base)
│   └── BookingRepository.java         # extend: findByCustomerId, aggregate queries (FR-04 base)
└── configs/SecurityConfig.java          # /api/v1/admin/users/** ADMIN only

backend/src/test/java/com/homestay/
├── unit/AdminCustomerServiceTest.java
└── integration/AdminCustomerControllerIT.java

frontend/src/
├── api/adminCustomerApi.ts              # or extend adminApi.ts → /api/v1/admin/users
├── pages/admin/
│   └── CustomerDirectoryPage.tsx        # SCR-51 table + filters
├── components/admin/
│   └── CustomerDetailDrawer.tsx         # profile + booking history
├── layouts/
│   └── AdminLayout.tsx                  # create if missing
└── App.tsx                              # route /admin/customers
```

**Structure Decision**: FR-09 **does not own** schema migrations — consumes FR-01 `users` and FR-04 `bookings`. Optional index migration only. Frontend has legacy `adminApi.ts` but **no** admin pages/layout — primary UI work is new SCR-51.

## Implementation Phases

| Phase | Scope | Traceability |
|-------|-------|--------------|
| **A** | Optional Flyway index `(role, status)` on users | data-model.md |
| **B** | AdminCustomerService + DTOs + repository queries | Foundational |
| **C** | List/filter/search + aggregates | US-1, FR-001–002 |
| **D** | PATCH status Active/Suspended + audit | US-2, FR-003–004, FR-009 |
| **E** | Detail profile + booking history | US-3, FR-005–006 |
| **F** | AdminCustomerController + SecurityConfig | SCR-51 |
| **G** | Frontend AdminLayout + CustomerDirectoryPage + Drawer | US-1–3 |
| **H** | Migrate adminApi paths; verify FR-01 suspended login | SC-002 |
| **I** | Tests + quickstart | SC-001–SC-006 |

## Frontend Gap Analysis

| Item | Hiện tại | Target |
|------|----------|--------|
| Customer list | không có trang Admin | `CustomerDirectoryPage.tsx` SCR-51 |
| API | `GET /api/admin/users` legacy | `GET /api/v1/admin/users?role=CUSTOMER` |
| Status update | `PUT /api/admin/users/{id}` role+status | `PATCH /api/v1/admin/users/{id}/status` |
| Detail | `GET /api/admin/users/{id}` | `GET /api/v1/admin/users/{id}` + bookings sub-resource |
| Layout | không có AdminLayout | `AdminLayout.tsx` + nav link Customers |
| SCR numbering | frontend SCR-51 = Contract | Route `/admin/customers` maps SCR-51 Customer Directory per screen.md |

## Risks

| Risk | Mitigation |
|------|------------|
| FR-04 bookings table missing | Aggregates return 0; booking history empty; IT uses seed |
| FR-01 users table missing | Blocker — implement FR-01 first |
| Aggregate query slow at scale | Index `(customer_id)` on bookings; pagination on list |
| Legacy adminApi PUT changes role | FR-09 PATCH status only — do not expose role change for customers |

## Generated Artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/customer-api.yaml](./contracts/customer-api.yaml)
- [quickstart.md](./quickstart.md)

## Next Step

Run **`/speckit-tasks`** to generate dependency-ordered `tasks.md`.
