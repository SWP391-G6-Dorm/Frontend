# Tasks: FR-08 Room Management

**Input**: Design documents from `specs/008-room-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/room-api.yaml, quickstart.md

**Phụ thuộc**: FR-06 (Property + ManagerPropertyAssignment scope); FR-07 (`floors` V008). **Ranh giới**: FR-05 SCR-33 status PATCH; FR-04 booking lifecycle; FR-03 Guest discovery read.

**Tests**: Không có phase test riêng per-story. Unit + integration trong Phase Polish per plan Phase K.

**Organization**: Tasks grouped by user story (US1–US6) for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking deps)
- **[Story]**: US1–US6 maps to spec.md user stories

## Path Conventions

- **Backend**: `backend/src/main/java/com/homestay/`
- **Backend tests**: `backend/src/test/java/com/homestay/`
- **Frontend**: `frontend/src/`
- **Migrations**: `backend/src/main/resources/db/migration/`
- **Contract**: `specs/008-room-management/contracts/room-api.yaml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Flyway `rooms` + `room_images` — after FR-07 V008

- [ ] T001 Verify backend Spring Boot scaffold and FR-06/FR-07 migrations applied per `specs/007-structure-management/quickstart.md`
- [ ] T002 [P] Confirm Vite proxy `/api/v1` → backend in `frontend/vite.config.ts`
- [ ] T003 Create Flyway `backend/src/main/resources/db/migration/V009__rooms.sql` — `rooms` table + `UNIQUE (property_id, room_number)` + indexes per `data-model.md`
- [ ] T004 Create Flyway `backend/src/main/resources/db/migration/V010__room_images.sql` — `room_images` + partial unique primary index per `data-model.md`
- [ ] T005 [P] Renumber FR-03 discovery seed migration to `V011__discovery_seed.sql` if `V010__discovery_seed.sql` exists in `backend/src/main/resources/db/migration/`
- [ ] T006 [P] Add `app.upload.rooms-dir` (env `APP_UPLOAD_DIR`) in `backend/src/main/resources/application.yml` for local multipart storage per `research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Room/RoomImage entities, DTOs, repositories, security routes — MUST complete before user story phases

**⚠️ CRITICAL**: No user story work until this phase complete

- [ ] T007 [P] Create `RoomOperationalStatus.java` enum in `backend/src/main/java/com/homestay/enums/RoomOperationalStatus.java` — 8 values per `data-model.md`
- [ ] T008 [P] Create `Room.java` entity in `backend/src/main/java/com/homestay/entities/Room.java`
- [ ] T009 [P] Create `RoomImage.java` entity in `backend/src/main/java/com/homestay/entities/RoomImage.java`
- [ ] T010 [P] Create `RoomRepository.java` in `backend/src/main/java/com/homestay/repositories/RoomRepository.java` — include `existsByPropertyIdAndRoomNumber`, `countByPropertyIdAndRoomNumberExcludingId`, JPA spec for filters
- [ ] T011 [P] Create `RoomImageRepository.java` in `backend/src/main/java/com/homestay/repositories/RoomImageRepository.java` — `findByRoomIdOrderBySortOrderAsc`, `clearPrimaryForRoom`
- [ ] T012 [P] Create room DTOs in `backend/src/main/java/com/homestay/dtos/room/` — `CreateRoomRequest`, `UpdateRoomRequest`, `RoomSummaryResponse`, `RoomDetailResponse`, `RoomPageResponse`, `RoomImageResponse`, `ReorderImagesRequest` per `contracts/room-api.yaml`
- [ ] T013 Create `RoomValidationService.java` in `backend/src/main/java/com/homestay/services/RoomValidationService.java` — inject FloorRepository, PropertyAccessValidator
- [ ] T014 Create `RoomService.java` skeleton in `backend/src/main/java/com/homestay/services/RoomService.java` — inject RoomRepository, RoomValidationService, optional BookingRepository
- [ ] T015 Create `RoomImageService.java` skeleton in `backend/src/main/java/com/homestay/services/RoomImageService.java` — inject RoomImageRepository, RoomRepository
- [ ] T016 Register `/api/v1/manager/rooms/**` (MANAGER write) and `/api/v1/employee/rooms` (EMPLOYEE read) in `backend/src/main/java/com/homestay/configs/SecurityConfig.java`
- [ ] T017 [P] Migrate manager CRUD base paths in `frontend/src/api/roomsApi.ts` from `/api/rooms` → `/api/v1/manager/rooms` per `plan.md` Frontend Gap Analysis
- [ ] T018 [P] Add `RoomDetail` and paginated manager list types aligned to `contracts/room-api.yaml` in `frontend/src/api/roomsApi.ts`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Manager xem và lọc danh sách phòng (Priority: P1) 🎯 MVP

**Goal**: SCR-29 — paginated room list with property/floor/status/roomType/search filters; scoped to assigned properties

**Independent Test**: Manager opens `/manager/rooms` → only assigned property rooms; filters work; row actions Edit/Gallery visible; unassigned property → 403 or empty

### Implementation

- [ ] T019 [US1] Implement `listRooms(filters, managerId)` with pagination + property/floor/status/roomType/search in `backend/src/main/java/com/homestay/services/RoomService.java`
- [ ] T020 [US1] Enforce `PropertyAccessValidator.assertManagerAssigned` on list when `propertyId` filter present in `RoomService.java`
- [ ] T021 [US1] Create `ManagerRoomController.java` with `GET /api/v1/manager/rooms` in `backend/src/main/java/com/homestay/controllers/ManagerRoomController.java`
- [ ] T022 [US1] Map `RoomSummaryResponse` with `primaryImageUrl`, `floorNumber`, `propertyName` in `RoomService.java`
- [ ] T023 [P] [US1] Wire `fetchManagerRooms` in `frontend/src/api/roomsApi.ts` to `GET /api/v1/manager/rooms` with query params per `contracts/room-api.yaml`
- [ ] T024 [US1] Migrate property selector on `frontend/src/pages/manager/RoomListPage.tsx` to FR-06 `/api/v1/manager/properties`
- [ ] T025 [US1] Wire floor filter dropdown to migrated `frontend/src/api/floorApi.ts` on `RoomListPage.tsx`
- [ ] T026 [US1] Implement status, roomType, and search filter controls on `RoomListPage.tsx`
- [ ] T027 [P] [US1] Display 8-value status badges on `RoomListPage.tsx` using shared status config (fallback labels if FR-05 utils missing)
- [ ] T028 [US1] Add row actions linking to `/manager/rooms/:id/edit` and `/manager/rooms/:id/gallery` on `RoomListPage.tsx`
- [ ] T029 [US1] Implement pagination controls on `RoomListPage.tsx`
- [ ] T030 [US1] Handle 403 and empty-state when no assigned properties on `RoomListPage.tsx`

**Checkpoint**: US1 MVP — Manager can view and filter room list SCR-29

---

## Phase 4: User Story 2 — Manager tạo phòng mới (Priority: P1)

**Goal**: SCR-30 — create room on assigned property/floor; default status AVAILABLE; reject duplicate room number

**Independent Test**: Add Room form → select floor on assigned property → Create → room appears in SCR-29 with status Available; duplicate number → 409

### Implementation

- [ ] T031 [US2] Implement `createRoom(CreateRoomRequest, managerId)` with default `AVAILABLE` status in `backend/src/main/java/com/homestay/services/RoomService.java`
- [ ] T032 [US2] Validate `floorId` belongs to same `propertyId` in `RoomValidationService.java`
- [ ] T033 [US2] Reject duplicate `(propertyId, roomNumber)` with 409 in `RoomValidationService.java`
- [ ] T034 [US2] Add `POST /api/v1/manager/rooms` in `ManagerRoomController.java`
- [ ] T035 [US2] Apply `@PropertyAccess` on create using `propertyId` from body in `ManagerRoomController.java`
- [ ] T036 [US2] Map api-spec `name` → `roomNumber` in `CreateRoomRequest.java` and controller
- [ ] T037 [US2] Wire `createRoom` API call on `frontend/src/pages/manager/AddRoomPage.tsx`
- [ ] T038 [US2] Scope property/floor selectors to manager-assigned properties on `AddRoomPage.tsx`
- [ ] T039 [US2] Display Bean Validation and 409 duplicate errors on `AddRoomPage.tsx`
- [ ] T040 [US2] Log `ROOM_CREATED` to ActivityLog in `RoomService.java`
- [ ] T041 [US2] Redirect to `/manager/rooms` after successful create on `AddRoomPage.tsx`

**Checkpoint**: US2 testable — Manager can create rooms SCR-30

---

## Phase 5: User Story 3 — Manager chỉnh sửa thông tin phòng (Priority: P1)

**Goal**: SCR-31 — update room metadata; floor change allowed within same property only

**Independent Test**: Edit room → Save → SCR-29 reflects changes; floor from other property → 403/400; Employee PUT → 403

### Implementation

- [ ] T042 [US3] Implement `getRoomById(roomId, managerId)` with property scope check in `RoomService.java`
- [ ] T043 [US3] Implement `updateRoom(roomId, UpdateRoomRequest, managerId)` in `RoomService.java`
- [ ] T044 [US3] Validate floor change stays within same property on update in `RoomValidationService.java`
- [ ] T045 [US3] Reject duplicate room number on update excluding self in `RoomValidationService.java`
- [ ] T046 [US3] Add `GET /api/v1/manager/rooms/{id}` and `PUT /api/v1/manager/rooms/{id}` in `ManagerRoomController.java`
- [ ] T047 [US3] Resolve room → propertyId for access check on GET/PUT in `ManagerRoomController.java`
- [ ] T048 [US3] Wire `fetchRoomById` and `updateRoom` in `frontend/src/api/roomsApi.ts`
- [ ] T049 [US3] Wire edit form on `frontend/src/pages/manager/EditRoomPage.tsx` — price, capacity, description, amenities, floor
- [ ] T050 [P] [US3] Wire read-only detail view on `frontend/src/pages/manager/RoomDetailMgmtPage.tsx` if used by route `/manager/rooms/:id`
- [ ] T051 [US3] Log `ROOM_UPDATED` in `RoomService.java`
- [ ] T052 [US3] Handle 403/404 on `EditRoomPage.tsx`

**Checkpoint**: US3 testable — Manager can edit room SCR-31

---

## Phase 6: User Story 4 — Manager xóa phòng (Priority: P1)

**Goal**: Delete room only when no active booking; cascade room_images

**Independent Test**: DELETE room without booking → 200; room with PENDING_DEPOSIT/CONFIRMED/CHECKED_IN booking → 409

### Implementation

- [ ] T053 [US4] Implement `hasActiveBooking(roomId)` via `BookingRepository.existsByRoomIdAndStatusIn` in `RoomService.java` per `data-model.md`
- [ ] T054 [US4] Implement `deleteRoom(roomId, managerId)` — block when active booking; hard delete room + cascade images in `RoomService.java`
- [ ] T055 [US4] Add `DELETE /api/v1/manager/rooms/{id}` in `ManagerRoomController.java`
- [ ] T056 [US4] Wire delete action + confirm dialog on `frontend/src/pages/manager/RoomListPage.tsx`
- [ ] T057 [US4] Display API 409 "active booking" message on delete in `RoomListPage.tsx`
- [ ] T058 [US4] Log `ROOM_DELETED` in `RoomService.java`
- [ ] T059 [US4] Deny DELETE for EMPLOYEE and CUSTOMER roles in `SecurityConfig.java`

**Checkpoint**: US4 testable — delete guard enforced

---

## Phase 7: User Story 5 — Manager quản lý gallery ảnh phòng (Priority: P1)

**Goal**: SCR-32 — upload, delete, reorder, set primary; one primary per room; validate image type/size

**Independent Test**: Gallery → upload 3 images → set primary → reorder → only one primary; delete primary auto-promotes first remaining

### Implementation

- [ ] T060 [US5] Create `LocalFileStorageService.java` in `backend/src/main/java/com/homestay/services/LocalFileStorageService.java` — save multipart to `APP_UPLOAD_DIR`, return public URL
- [ ] T061 [US5] Implement `addImage(roomId, file|url, managerId)` in `RoomImageService.java`
- [ ] T062 [US5] Implement `setPrimary(roomId, imageId, managerId)` — clear other primaries per partial unique index in `RoomImageService.java`
- [ ] T063 [US5] Implement `reorderImages(roomId, imageIds, managerId)` in `RoomImageService.java`
- [ ] T064 [US5] Implement `deleteImage(roomId, imageId, managerId)` with auto-promote primary when deleted in `RoomImageService.java`
- [ ] T065 [US5] Validate jpeg/png/webp and max 5MB on upload in `RoomImageService.java`
- [ ] T066 [US5] Add gallery endpoints in `ManagerRoomController.java` — `POST/PUT/PATCH/DELETE` per `contracts/room-api.yaml`
- [ ] T067 [P] [US5] Migrate `frontend/src/api/galleryApi.ts` paths to `/api/v1/manager/rooms/{id}/images/**`
- [ ] T068 [US5] Wire upload, delete, reorder, set-primary on `frontend/src/pages/manager/RoomGalleryPage.tsx`
- [ ] T069 [US5] Log `ROOM_IMAGE_ADDED`, `ROOM_IMAGE_REMOVED`, `ROOM_IMAGE_REORDERED`, `ROOM_PRIMARY_IMAGE_SET` in `RoomImageService.java`

**Checkpoint**: US5 testable — gallery CRUD SCR-32

---

## Phase 8: User Story 6 — Employee xem danh sách phòng read-only (Priority: P2)

**Goal**: SCR-65 — Employee read-only room list for assigned property; no write actions

**Independent Test**: Employee opens `/employee/rooms` → list only; POST/PUT/DELETE → 403; no Add/Edit/Gallery buttons

### Implementation

- [ ] T070 [US6] Create `EmployeeRoomController.java` with `GET /api/v1/employee/rooms` in `backend/src/main/java/com/homestay/controllers/EmployeeRoomController.java`
- [ ] T071 [US6] Reuse `RoomService.listRooms` with `PropertyAccessValidator.assertEmployeeAssigned` in `EmployeeRoomController.java`
- [ ] T072 [US6] Ensure EMPLOYEE denied on all `/api/v1/manager/rooms/**` write routes in `SecurityConfig.java`
- [ ] T073 [US6] Add `fetchEmployeeRooms` in `frontend/src/api/roomsApi.ts` calling `GET /api/v1/employee/rooms`
- [ ] T074 [US6] Create `frontend/src/pages/employee/PropertyRoomListPage.tsx` — read-only table SCR-65
- [ ] T075 [US6] Register route `/employee/rooms` with `ProtectedRoute role="EMPLOYEE"` in `frontend/src/App.tsx`
- [ ] T076 [US6] Hide Add/Edit/Delete/Gallery actions when rendering employee list on `PropertyRoomListPage.tsx`
- [ ] T077 [P] [US6] Add employee nav link to `/employee/rooms` in employee layout if present (e.g. `frontend/src/layouts/EmployeeLayout.tsx`)

**Checkpoint**: US6 testable — Employee read-only SCR-65

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Tests, FR-07 tree integration, FR-05 status navigation, quickstart validation

- [ ] T078 [P] Unit test `RoomServiceTest.java` in `backend/src/test/java/com/homestay/unit/RoomServiceTest.java` — duplicate room number + delete guard with mocked BookingRepository
- [ ] T079 [P] Unit test `RoomImageServiceTest.java` in `backend/src/test/java/com/homestay/unit/RoomImageServiceTest.java` — setPrimary uniqueness + reorder + auto-promote on delete
- [ ] T080 Integration test `ManagerRoomControllerIT.java` in `backend/src/test/java/com/homestay/integration/ManagerRoomControllerIT.java` — scope 403 + CRUD + gallery flow
- [ ] T081 [P] Integration test `EmployeeRoomControllerIT.java` in `backend/src/test/java/com/homestay/integration/EmployeeRoomControllerIT.java` — read-only GET + write denied
- [ ] T082 Verify FR-07 structure tree shows room nodes after create via `frontend/src/pages/manager/StructureTreePage.tsx`
- [ ] T083 Ensure status kebab on `RoomListPage.tsx` navigates to `/manager/rooms/:id/status` (FR-05 `RoomStatusPage`) — no PATCH status in FR-08
- [ ] T084 [P] Verify manager room routes in `frontend/src/App.tsx` — `/manager/rooms`, `/add`, `/:id`, `/:id/edit`, `/:id/gallery`, `/:id/status`
- [ ] T085 Run curl smoke tests in `specs/008-room-management/quickstart.md` and fix gaps
- [ ] T086 [P] Optional dev seed `backend/src/main/resources/db/migration/V011_1__room_seed.sql` — sample rooms on FR-07 seed floors (skip if V011 taken by FR-03)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: After FR-07 V008 (floors FK)
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (P1)**: After Foundational — list MVP SCR-29
- **US2 (P1)**: After Foundational; benefits from US1 list for verification
- **US3 (P1)**: After US2 (room records exist) or parallel backend with US2
- **US4 (P1)**: After US2; BookingRepository optional until FR-04
- **US5 (P1)**: After US2 (roomId for gallery); can parallel backend with US3
- **US6 (P2)**: After US1 list service exists
- **Polish**: After US1–US5 minimum

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| US1 | Foundational + FR-06 scope | GET list + SCR-29 filters |
| US2 | Foundational | POST create + Available default |
| US3 | US2 (room exists) | GET/PUT detail SCR-31 |
| US4 | US2 | DELETE + active booking 409 |
| US5 | US2 | Gallery upload/primary/reorder SCR-32 |
| US6 | US1 RoomService.listRooms | Employee GET read-only SCR-65 |

### Parallel Opportunities

- Phase 1: T002, T005, T006 parallel
- Phase 2: T007–T012, T017–T018 parallel
- US1: T023, T027 parallel after T021
- US3: T050 parallel with T049
- US5: T067 parallel after T066
- US6: T077 parallel with T074–T076
- Polish: T078, T079, T081, T084, T086 parallel

---

## Parallel Example: Foundational Phase

```bash
T007 RoomOperationalStatus.java | T008 Room.java | T009 RoomImage.java
T010 RoomRepository.java | T011 RoomImageRepository.java | T012 DTOs package
T017 roomsApi.ts migration | T018 types alignment
```

---

## Parallel Example: User Story 1

```bash
# After T021 controller:
T023 roomsApi fetchManagerRooms
T027 status badges on RoomListPage
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2
2. Phase 3 (US1) — Manager room list SCR-29
3. **STOP and VALIDATE**: quickstart GET list + UI filters
4. Add US2 create next

### Incremental Delivery

1. Setup + Foundational
2. US1 → list/filter MVP
3. US2 → create room
4. US3 → edit room
5. US4 → delete with booking guard
6. US5 → gallery
7. US6 → employee read-only
8. Polish → tests + quickstart

### Suggested MVP Scope

**T001–T030** (Setup + Foundational + US1) — Manager room list SCR-29.

### Full Feature Scope

**T001–T086** — Complete FR-08 including CRUD, gallery, employee read-only, and integration tests.

---

## Notes

- V009 must run after FR-07 `V008__floors.sql`
- `BookingRepository` may stub until FR-04 — delete guard IT uses mocks per `plan.md` Risks
- Do not implement PATCH room status in FR-08 — SCR-33 belongs to FR-05
- `pricePerNight` update must not alter existing booking snapshots (FR-04)
- api-spec field `name` maps to `roomNumber` in all DTOs
- Commit after each phase checkpoint
