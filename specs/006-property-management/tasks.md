# Tasks: FR-06 Property Management

**Input**: Design documents from `specs/006-property-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/property-api.yaml, quickstart.md

**Phụ thuộc**: FR-01 (Admin/Manager JWT, RBAC, `GET /admin/users?role=MANAGER` SCR-50). **Enables**: FR-03 (ACTIVE filter), FR-07/08 (Property hierarchy), FR-04/05 (`PropertyAccessValidator`). **Ranh giới**: FR-07 Structure; FR-08 Room CRUD; EmployeePropertyAssignment.

**Tests**: Không có phase test riêng per-story. Unit + integration trong Phase Polish per plan Phase L.

**Organization**: Tasks grouped by user story (US1–US5) for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking deps)
- **[Story]**: US1–US5 maps to spec.md user stories

## Path Conventions

- **Backend**: `backend/src/main/java/com/homestay/`
- **Backend tests**: `backend/src/test/java/com/homestay/`
- **Frontend**: `frontend/src/`
- **Migrations**: `backend/src/main/resources/db/migration/`
- **Contract**: `specs/006-property-management/contracts/property-api.yaml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migrations and dev prerequisites — MUST run before V010 FR-03 seed

- [ ] T001 Verify backend Spring Boot scaffold (or FR-01 setup) per `specs/001-user-auth/plan.md`
- [ ] T002 [P] Confirm Vite proxy `/api/v1` → backend in `frontend/vite.config.ts`
- [ ] T003 Create Flyway `backend/src/main/resources/db/migration/V005__properties.sql` per `specs/006-property-management/data-model.md`
- [ ] T004 Create Flyway `backend/src/main/resources/db/migration/V006__manager_property_assignments.sql` — partial unique index `uq_mpa_one_active_per_property` per `data-model.md`
- [ ] T005 [P] Create optional dev seed `backend/src/main/resources/db/migration/V007__property_management_seed.sql` — 2 INACTIVE properties + 1 ACTIVE with assignment for quickstart

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Entities, enums, DTOs, security routes — MUST complete before user story phases

**⚠️ CRITICAL**: No user story work until this phase complete

- [ ] T006 [P] Create `PropertyStatus.java` enum in `backend/src/main/java/com/homestay/enums/PropertyStatus.java`
- [ ] T007 [P] Create `AssignmentStatus.java` enum in `backend/src/main/java/com/homestay/enums/AssignmentStatus.java`
- [ ] T008 [P] Create `Property.java` entity in `backend/src/main/java/com/homestay/entities/Property.java`
- [ ] T009 [P] Create `ManagerPropertyAssignment.java` entity in `backend/src/main/java/com/homestay/entities/ManagerPropertyAssignment.java`
- [ ] T010 [P] Create `PropertyRepository.java` in `backend/src/main/java/com/homestay/repositories/PropertyRepository.java`
- [ ] T011 [P] Create `ManagerPropertyAssignmentRepository.java` in `backend/src/main/java/com/homestay/repositories/ManagerPropertyAssignmentRepository.java`
- [ ] T012 [P] Create property DTOs in `backend/src/main/java/com/homestay/dtos/property/` — `CreatePropertyRequest`, `UpdatePropertyRequest`, `PropertySummaryResponse`, `PropertyDetailResponse`, `AssignManagerRequest`, `ManagerAssignmentResponse`, `PropertyPageResponse` per `contracts/property-api.yaml`
- [ ] T013 Accept `location` alias → `address` in `CreatePropertyRequest.java` and `UpdatePropertyRequest.java` per research.md #7
- [ ] T014 Register `/api/v1/admin/properties/**` (ADMIN) and `/api/v1/manager/properties/**` (MANAGER) in `backend/src/main/java/com/homestay/configs/SecurityConfig.java`
- [ ] T015 Create or extend `PropertyAccessValidator.java` in `backend/src/main/java/com/homestay/security/PropertyAccessValidator.java` — `assertManagerAssigned(userId, propertyId)`
- [ ] T016 [P] Create `adminPropertyApi.ts` in `frontend/src/api/adminPropertyApi.ts` — typed client skeleton for admin endpoints
- [ ] T017 [P] Create `AdminLayout.tsx` in `frontend/src/layouts/AdminLayout.tsx` — nav shell for SCR-46–49

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Admin tạo và quản lý Property (Priority: P1) 🎯 MVP

**Goal**: Admin create/edit property; default INACTIVE; status ACTIVE/INACTIVE on update (SCR-47, SCR-48)

**Independent Test**: Admin POST property → INACTIVE; PUT update name/address; PUT status INACTIVE; curl or Create/Edit pages; Manager POST → 403

### Implementation

- [ ] T018 [US1] Implement `createProperty(CreatePropertyRequest, adminId)` default status INACTIVE in `backend/src/main/java/com/homestay/services/PropertyService.java`
- [ ] T019 [US1] Implement `updateProperty(id, UpdatePropertyRequest)` field updates in `PropertyService.java`
- [ ] T020 [US1] Implement `updatePropertyStatus(id, status)` — allow INACTIVE always; defer ACTIVE gate to US4 in `PropertyService.java`
- [ ] T021 [US1] Create `AdminPropertyController.java` with `POST /api/v1/admin/properties` in `backend/src/main/java/com/homestay/controllers/AdminPropertyController.java`
- [ ] T022 [US1] Add `PUT /api/v1/admin/properties/{id}` in `AdminPropertyController.java`
- [ ] T023 [US1] Add `GET /api/v1/admin/properties/{id}` returning `PropertyDetailResponse` in `AdminPropertyController.java`
- [ ] T024 [P] [US1] Implement `create`, `update`, `getById` in `frontend/src/api/adminPropertyApi.ts`
- [ ] T025 [US1] Create `CreatePropertyPage.tsx` in `frontend/src/pages/admin/CreatePropertyPage.tsx` — SCR-47 form (name, address, description)
- [ ] T026 [US1] Create `EditPropertyPage.tsx` in `frontend/src/pages/admin/EditPropertyPage.tsx` — SCR-48 form + status toggle
- [ ] T027 [P] [US1] Refactor `PropertyForm` in `frontend/src/pages/manager/_propertyShared.tsx` for reuse by admin pages (export shared fields component)
- [ ] T028 [US1] Register routes `/admin/properties/new` and `/admin/properties/:id/edit` with `ProtectedRoute role="ADMIN"` in `frontend/src/App.tsx`
- [ ] T029 [US1] Log `PROPERTY_CREATED`, `PROPERTY_UPDATED`, `PROPERTY_STATUS_CHANGED` via ActivityLog in `PropertyService.java`

**Checkpoint**: US1 MVP — Admin can create and edit properties via API + admin pages

---

## Phase 4: User Story 2 — Admin gán Manager cho Property (Priority: P1)

**Goal**: Assign/reassign Manager; one ACTIVE assignment per property; history preserved (SCR-49, SCR-50)

**Independent Test**: PATCH assign → Manager sees property; reassign → old INACTIVE + new ACTIVE; invalid managerId → 409; GET assignments history

### Implementation

- [ ] T030 [US2] Create `ManagerAssignmentService.java` in `backend/src/main/java/com/homestay/services/ManagerAssignmentService.java` — `assignManager(propertyId, managerId, assignedBy)` transactional swap
- [ ] T031 [US2] Validate target user `role=MANAGER` and `status=ACTIVE` in `ManagerAssignmentService.java` — reject 409 per FR-012
- [ ] T032 [US2] Deactivate existing ACTIVE assignment before insert new ACTIVE in `ManagerAssignmentService.java`
- [ ] T033 [US2] Add `PATCH /api/v1/admin/properties/{id}/manager` in `AdminPropertyController.java`
- [ ] T034 [US2] Add `GET /api/v1/admin/properties/{id}/assignments` paginated history in `AdminPropertyController.java`
- [ ] T035 [P] [US2] Add `assignManager`, `getAssignmentHistory` in `frontend/src/api/adminPropertyApi.ts`
- [ ] T036 [US2] Create `AssignManagerPage.tsx` in `frontend/src/pages/admin/AssignManagerPage.tsx` — SCR-49 manager picker + save
- [ ] T037 [US2] Fetch manager directory `GET /api/v1/admin/users?role=MANAGER&status=ACTIVE` in `AssignManagerPage.tsx` (SCR-50)
- [ ] T038 [US2] Register route `/admin/properties/:id/manager` with ADMIN guard in `frontend/src/App.tsx`
- [ ] T039 [US2] Log `MANAGER_ASSIGNED`, `MANAGER_ASSIGNMENT_ENDED` in `ManagerAssignmentService.java`
- [ ] T040 [P] [US2] Add link "Assign Manager" from `frontend/src/pages/admin/EditPropertyPage.tsx` to assign route

**Checkpoint**: US2 testable — manager assignment with history

---

## Phase 5: User Story 3 — Manager xem Property được gán (Priority: P1)

**Goal**: Manager read-only list/detail scoped to ACTIVE assignments only

**Independent Test**: Manager GET list → only assigned; GET unassigned id → 403; no create/edit/delete in UI

### Implementation

- [ ] T041 [US3] Create `PropertyStatsService.java` in `backend/src/main/java/com/homestay/services/PropertyStatsService.java` — stub zeros + empty `floors[]` until FR-07/08
- [ ] T042 [US3] Create `ManagerPropertyController.java` with `GET /api/v1/manager/properties` scoped by `managerId` + ACTIVE assignment in `backend/src/main/java/com/homestay/controllers/ManagerPropertyController.java`
- [ ] T043 [US3] Add `GET /api/v1/manager/properties/{id}/detail` with `PropertyAccessValidator` in `ManagerPropertyController.java`
- [ ] T044 [US3] Migrate `propertyApi.getAll` to `GET /api/v1/manager/properties` in `frontend/src/api/propertyApi.ts`
- [ ] T045 [US3] Migrate `propertyApi.getDetail` to `GET /api/v1/manager/properties/{id}/detail` in `frontend/src/api/propertyApi.ts`
- [ ] T046 [US3] Refactor `frontend/src/pages/manager/PropertyListPage.tsx` — remove delete, remove "Add Property" button, read-only list
- [ ] T047 [US3] Refactor `frontend/src/pages/manager/PropertyDetailPage.tsx` — remove edit link; read-only detail + stats
- [ ] T048 [US3] Remove routes `/manager/properties/add` and `/manager/properties/:id/edit` from `frontend/src/App.tsx`
- [ ] T049 [US3] Remove `propertyApi.create`, `propertyApi.update`, `propertyApi.delete` usages from manager pages; keep methods deprecated or delete from `propertyApi.ts`
- [ ] T050 [P] [US3] Remove "Thêm Property" quick action from `frontend/src/pages/manager/ManagerDashboardPage.tsx`
- [ ] T051 [P] [US3] Update empty-state link in `frontend/src/pages/manager/AddRoomPage.tsx` — remove `/manager/properties/add` reference

**Checkpoint**: US3 testable — manager scoped read-only property views

---

## Phase 6: User Story 4 — Ràng buộc Property phải có Manager ACTIVE (Priority: P2)

**Goal**: Cannot ACTIVE without assignment; cannot unassign while ACTIVE without replacement

**Independent Test**: PUT status ACTIVE without manager → 409; assign then ACTIVE → 200; audit query 100% ACTIVE have manager

### Implementation

- [ ] T052 [US4] Enforce `existsActiveAssignment(propertyId)` before `status=ACTIVE` in `PropertyService.updatePropertyStatus()` — throw 409 in `PropertyService.java`
- [ ] T053 [US4] Reject deactivating last ACTIVE assignment when property status ACTIVE in `ManagerAssignmentService.java`
- [ ] T054 [US4] Allow INACTIVE property without manager assignment (no-op validation) in `PropertyService.java`
- [ ] T055 [US4] Surface 409 "Assign a manager before activating" on `frontend/src/pages/admin/EditPropertyPage.tsx` status toggle
- [ ] T056 [P] [US4] Add post-assign CTA "Activate property" on `frontend/src/pages/admin/AssignManagerPage.tsx`
- [ ] T057 [US4] Create unit test `PropertyActivationServiceTest.java` in `backend/src/test/java/com/homestay/unit/PropertyActivationServiceTest.java` — ACTIVE without manager fails

**Checkpoint**: US4 testable — business constraint enforced

---

## Phase 7: User Story 5 — Admin tra cứu danh sách Property (Priority: P2)

**Goal**: SCR-46 paginated admin table with search, status filter, manager column, row actions

**Independent Test**: GET list with search "Đà Nẵng"; filter INACTIVE; columns Name, Address, Manager, Status; links to Edit and Assign

### Implementation

- [ ] T058 [US5] Add `findForAdmin(search, status, pageable)` with ILIKE on name/address in `PropertyRepository.java`
- [ ] T059 [US5] Implement `listForAdmin` with `currentManager` join in `PropertyService.java`
- [ ] T060 [US5] Add `GET /api/v1/admin/properties` with `page`, `size`, `search`, `status` in `AdminPropertyController.java`
- [ ] T061 [P] [US5] Implement `getAll(params)` in `frontend/src/api/adminPropertyApi.ts`
- [ ] T062 [US5] Create `PropertyManagementPage.tsx` in `frontend/src/pages/admin/PropertyManagementPage.tsx` — SCR-46 DataTable
- [ ] T063 [US5] Add search debounce + status filter on `PropertyManagementPage.tsx`
- [ ] T064 [US5] Add row actions Edit + Assign Manager + Create button on `PropertyManagementPage.tsx`
- [ ] T065 [US5] Register route `/admin/properties` index with ADMIN guard in `frontend/src/App.tsx`

**Checkpoint**: US5 testable — full admin property management hub SCR-46

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: FR-03 integration, tests, quickstart validation, cleanup

- [ ] T066 [P] Ensure FR-03 discovery filters `properties.status = ACTIVE` in `backend/src/main/java/com/homestay/services/RoomSearchService.java` (or equivalent FR-03 service)
- [ ] T067 [P] Unit test `ManagerAssignmentServiceTest.java` in `backend/src/test/java/com/homestay/unit/ManagerAssignmentServiceTest.java` — swap + one ACTIVE per property
- [ ] T068 Integration test `AdminPropertyControllerIT.java` in `backend/src/test/java/com/homestay/integration/AdminPropertyControllerIT.java` — create → assign → activate flow
- [ ] T069 Integration test `ManagerPropertyScopeIT.java` in `backend/src/test/java/com/homestay/integration/ManagerPropertyScopeIT.java` — 403 unassigned property
- [ ] T070 Run curl smoke tests in `specs/006-property-management/quickstart.md` and fix gaps
- [ ] T071 [P] Verify all admin/manager property routes and `ProtectedRoute` roles in `frontend/src/App.tsx`
- [ ] T072 [P] Delete or archive unused manager CRUD pages `frontend/src/pages/manager/AddPropertyPage.tsx` and `frontend/src/pages/manager/EditPropertyPage.tsx` if fully replaced by admin pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately — **before FR-03 seed V010**
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (P1)**: After Foundational — Admin create/edit MVP
- **US2 (P1)**: After US1 (property must exist to assign)
- **US3 (P1)**: After US2 (assignments needed for scoped manager read)
- **US4 (P2)**: After US1 + US2 (activation gate spans both services)
- **US5 (P2)**: After US1 backend exists; list UI integrates US2 assign links
- **Polish**: After desired stories

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| US1 | Foundational | POST/PUT admin property + Create/Edit pages |
| US2 | US1 | PATCH assign manager + history |
| US3 | US2 | Manager scoped GET list/detail; no CRUD UI |
| US4 | US1, US2 | ACTIVE without manager → 409 |
| US5 | US1, US2 | Admin list search/filter SCR-46 |

### Parallel Opportunities

- Phase 1: T002, T005 parallel
- Phase 2: T006–T012, T016–T017 parallel
- US1: T024, T027 parallel after T021
- US2: T035, T040 parallel
- US3: T050, T051 parallel
- US4: T056 parallel with T055
- US5: T061 parallel after T060
- Polish: T066, T067, T071, T072 parallel

---

## Parallel Example: Foundational Phase

```bash
T006 PropertyStatus.java | T007 AssignmentStatus.java | T008 Property.java | T009 ManagerPropertyAssignment.java
T010 PropertyRepository.java | T011 ManagerPropertyAssignmentRepository.java | T012 DTOs package
T016 adminPropertyApi.ts | T017 AdminLayout.tsx
```

---

## Parallel Example: User Story 2

```bash
# After T033 PATCH endpoint:
T035 adminPropertyApi assignManager
T040 EditPropertyPage link to Assign Manager
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2
2. Phase 3 (US1) — Admin create/edit property SCR-47/48
3. **STOP and VALIDATE**: quickstart POST property + admin Create page
4. Demo property saved as INACTIVE

### Incremental Delivery

1. Setup + Foundational
2. US1 → Admin CRUD core
3. US2 → Manager assignment SCR-49
4. US3 → Manager read-only refactor
5. US4 → Activation business rules
6. US5 → Admin list hub SCR-46
7. Polish → FR-03 filter + integration tests

### Suggested MVP Scope

**T001–T029** (Setup + Foundational + US1) — Admin can create and edit properties.

### Full Feature Scope

**T001–T072** — Complete FR-06 including SCR-46 admin hub, manager scope, and FR-03 integration.

---

## Notes

- Migration order: V005–V006 **must** precede FR-03 `V010__discovery_seed.sql`
- Manager must **not** retain create/edit/delete — spec FR-010 non-negotiable
- `PropertyAccessValidator` from FR-06 is reused by FR-04/05/07 manager endpoints
- Do not implement hard delete — INACTIVE only per spec Edge Cases
- Commit after each phase checkpoint
