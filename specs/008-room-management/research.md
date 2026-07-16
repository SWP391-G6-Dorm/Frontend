# Research: FR-08 Room Management

**Date**: 2026-06-27  
**Spec**: [spec.md](./spec.md) | **Docs**: `docs/Specification_v2.md` FR-08, `docs/api-spec-by-screen.md` SCR-29–32, frontend `roomsApi.ts`, manager room pages

## 1. Table Ownership & Migration Order

**Decision**: FR-08 creates `rooms` (V009) and `room_images` (V010) after FR-07 `floors` (V008). Renumber FR-03 discovery seed from V010 → **V011** if conflict.

**Rationale**: Room FK to floor; FR-07 tree reads rooms after FR-08.

**Alternatives considered**: Rooms in FR-03 seed only — rejected (no Manager CRUD lifecycle).

## 2. Unique Room Number Scope

**Decision**: `UNIQUE (property_id, room_number)` — same room number allowed across different properties.

**Rationale**: spec FR-007; hospitality often repeats "101" per building.

**Alternatives considered**: Global unique — rejected.

## 3. Delete Room — Active Booking Guard

**Decision**: Block delete if any booking with status in:

`PENDING_DEPOSIT`, `CONFIRMED`, `CHECKED_IN`, `PENDING_INSPECTION`, `PENDING_DAMAGE_PAYMENT`

Query via `BookingRepository.existsByRoomIdAndStatusIn`.

**Rationale**: spec FR-004 + FR-04 data-model blocking statuses; terminal statuses allow delete.

**Alternatives considered**: Block if any historical booking — rejected (spec says active only).

## 4. Default Status on Create

**Decision**: New room always `AVAILABLE` in `RoomService.create()`; status changes via FR-04/05/21 automation only (not FR-08 form).

**Rationale**: spec FR-005; FR-08 defers manual status to FR-05 SCR-33.

**Alternatives considered**: Manager picks status on create — rejected (overlap FR-05).

## 5. Manager API Surface

**Decision**:

| Method | Path |
|--------|------|
| GET | `/api/v1/manager/rooms` — list/filter |
| POST | `/api/v1/manager/rooms` |
| GET | `/api/v1/manager/rooms/{id}` |
| PUT | `/api/v1/manager/rooms/{id}` |
| DELETE | `/api/v1/manager/rooms/{id}` |
| POST | `/api/v1/manager/rooms/{id}/images` |
| PUT | `/api/v1/manager/rooms/{id}/images/reorder` |
| PATCH | `/api/v1/manager/rooms/{id}/images/{imageId}/primary` |
| DELETE | `/api/v1/manager/rooms/{id}/images/{imageId}` |

**Rationale**: Align api-spec SCR-29–32; extend minimal attachments payload to full gallery ops.

**Alternatives considered**: Single POST attachments batch only — insufficient for reorder/primary.

## 6. api-spec Field Mapping

**Decision**: Request/response `name` → entity `roomNumber`. Response includes both during migration optional.

**Rationale**: spec Assumption; api-spec SCR-30 uses `name`.

**Alternatives considered**: Rename entity to name — rejected (§5 RoomNumber).

## 7. Amenities Storage

**Decision**: `rooms.amenities` as `JSONB` or `TEXT[]` storing Vietnamese tag strings; validate against known set optional (FR-03 `AMENITY_ICONS`).

**Rationale**: FR-03 research; SCR-30 amenities checkboxes.

**Alternatives considered**: Normalized amenity table — deferred (YAGNI v1).

## 8. Pricing v1

**Decision**: `pricePerNight` on Room entity only; ignore api-spec nested `pricingRule` in v1 or map `basePrice` → `pricePerNight`.

**Rationale**: spec Assumptions PricingRule deferred.

**Alternatives considered**: Full PricingRule CRUD — FR-08 scope creep.

## 9. RoomImage Primary Constraint

**Decision**: Partial unique index `(room_id) WHERE is_primary = true`; service clears other primaries in `@Transactional` when setting new primary.

**Rationale**: §5 RoomImage constraint; spec SC-005.

**Alternatives considered**: Application-only — rejected.

## 10. Image Upload v1

**Decision**: `POST /manager/rooms/{id}/images` accepts multipart file OR `{ imageUrl }` for dev; store under configurable `app.upload.dir`; return public URL path served by Spring resource handler or Nginx.

**Rationale**: SCR-32 upload area; avoid blocking on S3 integration.

**Alternatives considered**: URL-only manual entry — insufficient for SCR-32 UX.

## 11. Employee Read Endpoint

**Decision**: `GET /api/v1/employee/rooms?propertyId=` — same `RoomSummaryResponse` as manager list; `@PreAuthorize EMPLOYEE` + EmployeePropertyAssignment check (FR-17 entity; stub same as ManagerPropertyAssignment pattern until FR-17).

**Rationale**: SCR-65; spec US-6.

**Alternatives considered**: Reuse manager GET with read-only UI — acceptable if RBAC denies writes.

## 12. Floor FK Validation

**Decision**: On create/update, verify `floor.propertyId == room.propertyId` via join query; reject 400 if mismatch.

**Rationale**: spec US-2 scenario 2; FR-07 integrity.

**Alternatives considered**: Trust client floorId — rejected.

## 13. Cascade Delete Images

**Decision**: `ON DELETE CASCADE` from rooms → room_images; explicit delete in service before room delete for audit.

**Rationale**: spec hard delete assumption; gallery cleanup.

**Alternatives considered**: Orphan images — rejected.

## 14. List Query Performance

**Decision**: JPA Specification or `@Query` with filters; index `(property_id, status)`, `(floor_id)`, GIN/trgm on `room_number` for search; join floor for floorNumber display.

**Rationale**: SC-004 ≤500 rooms.

**Alternatives considered**: In-memory filter — rejected at scale.

## 15. FR-05 Status Boundary

**Decision**: FR-08 does **not** implement `PATCH /manager/rooms/{id}/status`; SCR-29 kebab "Status" navigates to existing `RoomStatusPage` (FR-05).

**Rationale**: spec Assumptions FR-010.

**Alternatives considered**: Duplicate status in Edit form — rejected.

## 16. Frontend Migration Strategy

**Decision**: Consolidate manager methods in `roomsApi.ts` under `/api/v1/manager/rooms`; keep public `fetchRooms` for FR-03 at `/api/v1/rooms` unchanged.

**Rationale**: Single api module already used by RoomListPage, AddRoomPage.

**Alternatives considered**: New `managerRoomApi.ts` — optional split in tasks.
