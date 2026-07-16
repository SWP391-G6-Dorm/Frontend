# Tasks: FR-17 Administration

**Input**: Design documents from `specs/017-administration/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/administration-api.yaml, quickstart.md

**Phụ thuộc**: FR-01 (JWT RBAC Customer/Admin); FR-02 (Customer display name in complaint); FR-09 (Customer Directory SCR-51 — nav link only, không implement); FR-14 (Review moderation APIs — Content Moderation tab); FR-15 (optional Outbox tab P2). **Ranh giới**: FR-17 owns Complaint + SystemSetting + ActivityLog read; FR-18 Promotion out of scope.

**Tests**: Không có phase test riêng per-story. Unit + integration trong Phase Polish per plan Phase J.

**Organization**: Tasks grouped by user story (US1–US6) for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking deps)
- **[Story]**: US1–US6 maps to spec.md user stories

## Path Conventions

- **Backend**: `backend/src/main/java/com/homestay/`
- **Backend tests**: `backend/src/test/java/com/homestay/`
- **Frontend**: `frontend/src/`
- **Migrations**: `backend/src/main/resources/db/migration/`
- **Contract**: `specs/017-administration/contracts/administration-api.yaml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migration, auth blocker check, dev proxy

- [ ] T001 Verify FR-01 JWT auth with **CUSTOMER** and **ADMIN** roles per `specs/001-user-auth/quickstart.md` (blocker)
- [ ] T002 Create Flyway `backend/src/main/resources/db/migration/V033__administration_fr17.sql` — tables `complaints`, `system_settings`, `activity_logs`, indexes, seed default settings per `data-model.md`
- [ ] T003 [P] Confirm Vite proxy `/api/v1` → backend in `frontend/vite.config.ts`
- [ ] T004 [P] Add dev seed SQL comments in V033 — sample Customer + Admin users referenced for complaint smoke tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Entities, repositories, shared ActivityLog writer, DTOs, security — MUST complete before user story phases

**⚠️ CRITICAL**: No user story work until this phase complete

- [ ] T005 [P] Create `ComplaintStatus.java` enum in `backend/src/main/java/com/homestay/enums/ComplaintStatus.java` — OPEN, INVESTIGATING, RESOLVED, CLOSED
- [ ] T006 [P] Create `Complaint.java` entity in `backend/src/main/java/com/homestay/entities/Complaint.java` per `data-model.md`
- [ ] T007 [P] Create `SystemSetting.java` entity in `backend/src/main/java/com/homestay/entities/SystemSetting.java`
- [ ] T008 [P] Create `ActivityLog.java` entity in `backend/src/main/java/com/homestay/entities/ActivityLog.java`
- [ ] T009 [P] Create `ComplaintRepository.java` in `backend/src/main/java/com/homestay/repositories/ComplaintRepository.java` — findByUserId, findByStatus, search specs
- [ ] T010 [P] Create `SystemSettingRepository.java` in `backend/src/main/java/com/homestay/repositories/SystemSettingRepository.java` — findByKey
- [ ] T011 [P] Create `ActivityLogRepository.java` in `backend/src/main/java/com/homestay/repositories/ActivityLogRepository.java` — date/action/user filters
- [ ] T012 Create `ActivityLogService.java` in `backend/src/main/java/com/homestay/services/ActivityLogService.java` — shared `log(userId, action, entityType, entityId, details, ip)` append-only writer
- [ ] T013 Create `ComplaintStatusValidator.java` in `backend/src/main/java/com/homestay/services/ComplaintStatusValidator.java` — linear transition rules + RESOLVED requires notes
- [ ] T014 [P] Create administration DTOs in `backend/src/main/java/com/homestay/dtos/administration/` — `CreateComplaintRequest`, `ComplaintSummaryResponse`, `ComplaintDetailResponse`, `UpdateComplaintStatusRequest`, `SystemSettingsResponse`, `UpdateSystemSettingsRequest`, `ActivityLogResponse` per `contracts/administration-api.yaml`
- [ ] T015 Register `POST/GET /api/v1/complaints/**` for ROLE_CUSTOMER and `GET/PATCH /api/v1/admin/complaints/**`, `GET/PUT /api/v1/admin/settings`, `GET /api/v1/admin/activity-logs` for ROLE_ADMIN in `backend/src/main/java/com/homestay/configs/SecurityConfig.java`
- [ ] T016 [P] Create `ComplaintService.java` skeleton in `backend/src/main/java/com/homestay/services/ComplaintService.java`
- [ ] T017 [P] Create `SystemSettingService.java` skeleton in `backend/src/main/java/com/homestay/services/SystemSettingService.java`
- [ ] T018 [P] Create `ActivityLogQueryService.java` skeleton in `backend/src/main/java/com/homestay/services/ActivityLogQueryService.java`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Customer gửi và theo dõi khiếu nại (Priority: P1) 🎯 MVP

**Goal**: Customer create complaint + view own list/detail with OPEN status

**Independent Test**: Customer POST complaint → appears in My Complaints OPEN; cannot view another customer's complaint

### Implementation

- [ ] T019 [US1] Implement `createComplaint(customerId, subject, description)` — validate lengths, status OPEN in `ComplaintService.java`
- [ ] T020 [US1] Implement `listMyComplaints(customerId, pageable)` and `getMyComplaintDetail(customerId, id)` with owner scope in `ComplaintService.java`
- [ ] T021 [US1] Log `COMPLAINT_CREATED` via `ActivityLogService` in `ComplaintService.createComplaint()`
- [ ] T022 [US1] Create `ComplaintController.java` with `POST /api/v1/complaints` and `GET /api/v1/complaints`, `GET /api/v1/complaints/{id}` in `backend/src/main/java/com/homestay/controllers/ComplaintController.java`
- [ ] T023 [P] [US1] Migrate `submitComplaint`, `getMyComplaints`, `getComplaintDetail` to `/api/v1/complaints` in `frontend/src/api/complaintsApi.ts`
- [ ] T024 [US1] Wire live API on `frontend/src/pages/customer/CustomerComplaintPages.tsx` — list, create form, validation errors
- [ ] T025 [US1] Verify customer complaint routes `/customer/complaints` and `/customer/complaints/create` in `frontend/src/App.tsx`

**Checkpoint**: US1 MVP — Customer complaint flow testable via `quickstart.md` smoke test

---

## Phase 4: User Story 2 — Admin quản lý và giải quyết khiếu nại (Priority: P1)

**Goal**: SCR-54 Admin complaint list, detail, status workflow OPEN → INVESTIGATING → RESOLVED → CLOSED

**Independent Test**: Admin full workflow; Customer sees updated status; Manager/Customer get 403 on admin APIs

### Implementation

- [ ] T026 [US2] Implement `listAllComplaints(status, search, pageable)` with customer name join in `ComplaintService.java`
- [ ] T027 [US2] Implement `getAdminComplaintDetail(id)` with customer `{ id, fullName, email }` in `ComplaintService.java`
- [ ] T028 [US2] Implement `updateComplaintStatus(adminId, id, status, resolutionNotes)` — validator, set `resolvedAt` on RESOLVED in `ComplaintService.java`
- [ ] T029 [US2] Log `COMPLAINT_STATUS_CHANGED` via `ActivityLogService` in `ComplaintService.updateComplaintStatus()`
- [ ] T030 [US2] Create `AdminComplaintController.java` with `GET /api/v1/admin/complaints`, `GET /api/v1/admin/complaints/{id}`, `PATCH /api/v1/admin/complaints/{id}/status` in `backend/src/main/java/com/homestay/controllers/AdminComplaintController.java`
- [ ] T031 [US2] Add deprecated legacy `PATCH /api/v1/admin/complaints/{id}/resolve` mapping `{ resolution }` → RESOLVED in `AdminComplaintController.java`
- [ ] T032 [P] [US2] Add `getAdminComplaints`, `getAdminComplaintDetail`, `updateComplaintStatus` to `frontend/src/api/complaintsApi.ts`
- [ ] T033 [US2] Move `ComplaintListPage.tsx` from `frontend/src/pages/manager/` to `frontend/src/pages/admin/ComplaintListPage.tsx` — SCR-54 table + status filter
- [ ] T034 [US2] Move `ComplaintDetailPage.tsx` to `frontend/src/pages/admin/ComplaintDetailPage.tsx` — drawer/detail + status actions + resolutionNotes form
- [ ] T035 [US2] Switch complaint pages to **AdminLayout** and wire live admin API on `ComplaintListPage.tsx` and `ComplaintDetailPage.tsx`
- [ ] T036 [US2] Register `/admin/complaints` and `/admin/complaints/:id` routes; remove `/manager/complaints` routes in `frontend/src/App.tsx`
- [ ] T037 [US2] Update barrel exports in `frontend/src/pages/manager/AdminPages.tsx` — re-export from `pages/admin/` or remove complaint exports

**Checkpoint**: US2 testable — SCR-54 Admin complaint management end-to-end

---

## Phase 5: User Story 3 — Admin cấu hình System Settings (Priority: P1)

**Goal**: SCR-56 System Settings tab — deposit %, system name, support email, bank info

**Independent Test**: Admin PUT settings → reload shows persisted values; invalid deposit % rejected; SETTINGS_UPDATED in activity log

### Implementation

- [ ] T038 [US3] Implement `getSettings()` — aggregate keys into `SystemSettingsResponse` in `SystemSettingService.java`
- [ ] T039 [US3] Implement `updateSettings(adminId, request)` — partial upsert, deposit 10–50%, email validation in `SystemSettingService.java`
- [ ] T040 [US3] Add public `getDepositPercentage()` accessor for FR-04/12 consumers in `SystemSettingService.java`
- [ ] T041 [US3] Log `SETTINGS_UPDATED` via `ActivityLogService` in `SystemSettingService.updateSettings()`
- [ ] T042 [US3] Create `AdminSettingsController.java` with `GET /api/v1/admin/settings` and `PUT /api/v1/admin/settings` in `backend/src/main/java/com/homestay/controllers/AdminSettingsController.java`
- [ ] T043 [P] [US3] Create `settingsApi.ts` with `getSettings` and `updateSettings` in `frontend/src/api/settingsApi.ts`
- [ ] T044 [US3] Create `SystemSettingsTab.tsx` form — deposit %, system name, support email, bank fields in `frontend/src/pages/admin/SystemSettingsTab.tsx`
- [ ] T045 [US3] Wire save/load + validation feedback on `SystemSettingsTab.tsx` via `settingsApi.ts`

**Checkpoint**: US3 testable — System Settings GET/PUT per `quickstart.md`

---

## Phase 6: User Story 4 — Admin xem Activity Logs (Priority: P1)

**Goal**: SCR-56 Activity Logs tab — paginated read-only audit with date/action filters

**Independent Test**: Admin opens logs → newest first; date filter narrows results; no edit/delete actions

### Implementation

- [ ] T046 [US4] Implement `listActivityLogs(from, to, action, userId, search, pageable)` with user join in `ActivityLogQueryService.java`
- [ ] T047 [US4] Create `AdminActivityLogController.java` with `GET /api/v1/admin/activity-logs` in `backend/src/main/java/com/homestay/controllers/AdminActivityLogController.java`
- [ ] T048 [P] [US4] Create `activityLogApi.ts` with `getActivityLogs` in `frontend/src/api/activityLogApi.ts`
- [ ] T049 [US4] Create `ActivityLogsTab.tsx` — paginated table, date range, action filter in `frontend/src/pages/admin/ActivityLogsTab.tsx`
- [ ] T050 [US4] Add empty state and read-only guard (no delete/edit UI) on `ActivityLogsTab.tsx`

**Checkpoint**: US4 testable — Activity Logs tab with live API

---

## Phase 7: User Story 5 — Admin kiểm duyệt đánh giá toàn hệ thống (Priority: P1)

**Goal**: SCR-56 Content Moderation tab — wire FR-14 admin review Hide/Show (no duplicate backend)

**Independent Test**: Admin tab lists all reviews; Hide Published → Hidden; Show restores Published (requires FR-14 backend)

### Implementation

- [ ] T051 [US5] Create `ContentModerationTab.tsx` wired to `GET/PATCH /api/v1/admin/reviews/**` via `frontend/src/api/reviewApi.ts` in `frontend/src/pages/admin/ContentModerationTab.tsx`
- [ ] T052 [US5] Add All/Published/Hidden filter + Hide/Show confirmation dialog on `ContentModerationTab.tsx`
- [ ] T053 [US5] Add FR-14 dependency empty/stub state when admin reviews API unavailable on `ContentModerationTab.tsx`

**Checkpoint**: US5 testable — Content Moderation tab (blocked until FR-14 backend live)

---

## Phase 8: User Story 6 — Admin hub System Administration (Priority: P2)

**Goal**: SCR-56 unified `/admin/system` with tabs; optional Outbox link (FR-15 P2)

**Independent Test**: Admin switches tabs without full reload; non-Admin denied; each tab loads correct content

### Implementation

- [ ] T054 [US6] Create `SystemAdministrationPage.tsx` with tabs Activity Logs, System Settings, Content Moderation in `frontend/src/pages/admin/SystemAdministrationPage.tsx`
- [ ] T055 [US6] Mount `ActivityLogsTab`, `SystemSettingsTab`, `ContentModerationTab` as tab panels in `SystemAdministrationPage.tsx`
- [ ] T056 [US6] Create or extend `AdminLayout.tsx` with admin sidebar nav in `frontend/src/layouts/AdminLayout.tsx`
- [ ] T057 [US6] Register `/admin/system` route with Admin role guard in `frontend/src/App.tsx`
- [ ] T058 [US6] Add **System Administration** and **Complaints** nav links in `AdminLayout.tsx`
- [ ] T059 [P] [US6] Add optional **Outbox Monitor** tab or link to FR-15 FAILED events UI in `SystemAdministrationPage.tsx` (P2 — skip if FR-15 not ready)
- [ ] T060 [P] [US6] Add nav link to FR-09 Customer Directory `/admin/customers` in `AdminLayout.tsx` (no FR-09 implementation in FR-17)

**Checkpoint**: US6 testable — SCR-56 hub navigation complete

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Tests, quickstart validation, route cleanup, deprecated API removal

- [ ] T061 [P] Unit test complaint status transitions + RESOLVED notes required in `backend/src/test/java/com/homestay/unit/ComplaintStatusValidatorTest.java`
- [ ] T062 [P] Unit test deposit percentage 10–50% and email validation in `backend/src/test/java/com/homestay/unit/SystemSettingServiceTest.java`
- [ ] T063 Integration test customer create + admin workflow OPEN→CLOSED in `backend/src/test/java/com/homestay/integration/AdministrationControllerIT.java`
- [ ] T064 [P] Integration test Customer/Manager 403 on `/admin/settings` and `/admin/complaints` in `AdministrationControllerIT.java`
- [ ] T065 [P] Integration test Customer cannot GET another customer's complaint in `AdministrationControllerIT.java`
- [ ] T066 Run curl smoke tests in `specs/017-administration/quickstart.md` and fix gaps
- [ ] T067 [P] Remove mock `ACTIVITY_LOGS` usage — deprecate or delete `frontend/src/pages/manager/ActivityLogPage.tsx` and `_sharedAdminData` complaint mocks if unused
- [ ] T068 [P] Verify all admin routes in `frontend/src/App.tsx` — `/admin/complaints`, `/admin/system`
- [ ] T069 [P] Remove deprecated `/manager/complaints` nav entries from `frontend/src/layouts/ManagerLayout.tsx` if present

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: After FR-01 auth (blocker)
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (P1)**: After Foundational — **MVP**; creates complaints + ActivityLog entries
- **US2 (P1)**: After US1 (needs complaints to resolve); shares `ComplaintService`
- **US3 (P1)**: After Foundational; independent of US1/US2 (uses ActivityLogService)
- **US4 (P1)**: After Foundational; benefits from US1/US3 log entries for demo data
- **US5 (P1)**: After Foundational frontend; **blocked by FR-14** backend for live data
- **US6 (P2)**: After US3–US5 tab components exist
- **Polish (Phase 9)**: After desired user stories complete

### User Story Dependencies

```text
Foundational → US1 (Customer complaints) → US2 (Admin complaints)
            → US3 (System Settings)
            → US4 (Activity Logs)
            → US5 (Content Moderation tab — FR-14 APIs)
            → US6 (SCR-56 hub — integrates US3–US5 tabs)
```

### Parallel Opportunities

**Phase 1**: T003, T004 [P]  
**Phase 2** (after T012): T005–T011, T014, T016–T018 all [P]  
**US1**: T023 parallel with T019–T022  
**US2**: T032 parallel with T026–T031; T033–T034 parallel after T032  
**US3**: T043 parallel with T038–T042  
**US4**: T048 parallel with T046–T047  
**US5**: T051–T053 sequential (same file)  
**US6**: T059, T060 [P]  
**Polish**: T061, T062, T064, T065, T067, T068, T069 all [P]

### Parallel Example: User Story 2

```bash
T026–T031 ComplaintService admin methods + AdminComplaintController
T032 complaintsApi.ts admin methods (parallel when DTO stable)
T033–T035 Move pages to admin/ + AdminLayout + live API
T036–T037 App.tsx routes + barrel cleanup
```

### Parallel Example: Foundational

```bash
T005–T011 Entities + repositories (all [P])
T014 DTOs [P]
T016–T018 Service skeletons [P]
T012 ActivityLogService → T013 ComplaintStatusValidator → T015 SecurityConfig
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T018)
3. Complete Phase 3: User Story 1 (T019–T025)
4. **STOP and VALIDATE**: Customer POST/GET complaints per `quickstart.md`
5. Demo Customer complaint create + My Complaints list

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Customer complaints (MVP)
3. US2 → Admin SCR-54 complaint resolution
4. US3 → System Settings tab
5. US4 → Activity Logs tab
6. US5 → Content Moderation tab (FR-14)
7. US6 → SCR-56 unified hub + admin nav
8. Polish → Tests + quickstart + route cleanup

### Parallel Team Strategy

With multiple developers after Foundational:

- **Developer A**: US1 → US2 (complaint vertical slice)
- **Developer B**: US3 + US4 (settings + logs)
- **Developer C**: US5 + US6 (moderation tab + hub assembly)

---

## Notes

- FR-09 Customer Directory: link only in `AdminLayout` — implement in `specs/009-customer-management`
- FR-14 admin review APIs: US5 frontend only; backend tasks in `specs/014-review-rating/tasks.md`
- FR-15 Outbox tab: optional P2 in US6 — skip if notification engine not ready
- Deposit % consumer wiring in FR-04/12 is out of FR-17 scope but `getDepositPercentage()` must exist
- Manager `/manager/complaints` routes are **incorrect actor** — remove after US2 migration
