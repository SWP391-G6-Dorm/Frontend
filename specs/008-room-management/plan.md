# Implementation Plan: FR-08 Room Management

**Branch**: `010-room-management` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-room-management/spec.md`

**Nguồn docs**: `docs/Specification_v2.md` (FR-08, §5 Room/RoomImage), `docs/api-spec-by-screen.md` (SCR-29–32), `docs/screen.md`, `docs/screendesign.md`, `docs/entity-ui-mapping.md` §1.3–1.5, frontend `RoomListPage.tsx`, `AddRoomPage.tsx`, `EditRoomPage.tsx`, `RoomGalleryPage.tsx`, `roomsApi.ts`

**Phụ thuộc**: FR-06 (property scope); FR-07 (`floors` FK). **Enables**: FR-03 discovery, FR-04/05 calendar & booking. **Ranh giới**: FR-05 SCR-33 PATCH status; FR-04 booking status transitions; PricingRule table deferred v1.

## Summary

Triển khai **FR-08 Room Management**: bảng `rooms` + `room_images`; Manager CRUD phòng (property/floor scoped); gallery primary/sort; delete guard via active bookings; Employee read-only list (SCR-65). Stack: **Spring Boot 3 + JPA + PostgreSQL** + **React/TypeScript** — wire existing manager room pages; migrate `/api/rooms/manager` → `/api/v1/manager/rooms`.

## Technical Context

**Language/Version**: Java 17+, TypeScript 5.x, React 18  
**Primary Dependencies**: Spring Boot 3.x, Spring Security, Spring Data JPA, Flyway; Vite, Axios, React Router; file upload (local `MultipartFile` v1 or pre-signed URL stub)  
**Storage**: PostgreSQL — `rooms` (V009), `room_images` (V010); read `floors`, `properties`, `bookings` (delete guard)  
**Testing**: JUnit 5 + Mockito; `RoomServiceTest` duplicate number + delete guard; `ManagerRoomControllerIT` scope + CRUD  
**Target Platform**: Web application  
**Project Type**: `frontend/` + `backend/`  
**Performance Goals**: Room list p95 < 500ms for ≤500 rooms; SC-004 filter < 3s user-facing  
**Constraints**: Unique `(property_id, room_number)`; default status AVAILABLE; one primary image partial unique index; `@PropertyAccess` on writes; no PATCH status (FR-05)  
**Scale/Scope**: ~10 REST endpoints; 6 user stories; SCR-29–32, SCR-65

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Layered architecture | PASS | ManagerRoomController → RoomService → repositories |
| DTO + Bean Validation | PASS | CreateRoomRequest, gallery payloads |
| Security-first (RBAC, property isolation) | PASS | Manager write; Employee read-only |
| No secrets in code | PASS | Upload path from env |
| Test coverage ≥80% | PASS | Delete guard + unique room number IT |
| Standard API envelope | PASS | api-spec §1 |
| Audit log ROOM_* | PASS | create/update/delete room, gallery changes |

**Post-design re-check**: PASS — booking active check delegates to FR-04 statuses; price change does not touch booking snapshot.

## Project Structure

### Documentation (this feature)

```text
specs/008-room-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/room-api.yaml
├── spec.md
└── tasks.md              # /speckit-tasks (next)
```

### Source Code (repository root)

```text
backend/src/main/java/com/homestay/
├── controllers/
│   ├── ManagerRoomController.java       # SCR-29–32 /manager/rooms/*
│   └── EmployeeRoomController.java      # SCR-65 read-only list
├── dtos/room/
│   ├── CreateRoomRequest.java
│   ├── UpdateRoomRequest.java
│   ├── RoomSummaryResponse.java
│   ├── RoomDetailResponse.java
│   ├── RoomPageResponse.java
│   ├── RoomImageRequest.java
│   └── ReorderImagesRequest.java
├── entities/
│   ├── Room.java
│   └── RoomImage.java
├── enums/RoomOperationalStatus.java     # 8 values §5
├── repositories/
│   ├── RoomRepository.java
│   └── RoomImageRepository.java
├── services/
│   ├── RoomService.java                 # CRUD, filters, delete guard
│   ├── RoomImageService.java            # gallery, primary, sort
│   └── RoomValidationService.java       # floor/property FK, unique number
├── security/PropertyAccessValidator.java
└── configs/SecurityConfig.java

backend/src/main/resources/db/migration/
├── V009__rooms.sql
└── V010__room_images.sql

backend/src/test/java/com/homestay/
├── unit/RoomServiceTest.java
├── unit/RoomImageServiceTest.java
└── integration/ManagerRoomControllerIT.java

frontend/src/
├── api/roomsApi.ts                      # migrate manager CRUD → /api/v1/manager/rooms
├── api/roomGalleryApi.ts                # optional split from roomsApi
├── pages/manager/
│   ├── RoomListPage.tsx                 # SCR-29
│   ├── AddRoomPage.tsx                  # SCR-30
│   ├── EditRoomPage.tsx                 # SCR-31
│   └── RoomGalleryPage.tsx              # SCR-32
└── pages/employee/PropertyRoomListPage.tsx  # SCR-65 (create if missing)
```

**Structure Decision**: FR-08 **owns** `rooms` + `room_images` (V009–V010 after FR-07 V008). Frontend manager pages exist — primary work is backend + API alignment. FR-03 public `GET /api/v1/rooms` reads same tables (implemented in FR-03, verified after FR-08 seed).

## Implementation Phases

| Phase | Scope | Traceability |
|-------|-------|--------------|
| **A** | Flyway V009 rooms, V010 room_images + indexes | data-model.md |
| **B** | Room/RoomImage entities, repositories, DTOs | Foundational |
| **C** | RoomService list/filter/search (Manager scoped) | US-1, FR-001 |
| **D** | RoomService create/update + floor FK validation | US-2, US-3, FR-002–003, FR-007 |
| **E** | RoomService delete + BookingRepository active check | US-4, FR-004 |
| **F** | RoomImageService gallery CRUD, primary, reorder | US-5, FR-006 |
| **G** | ManagerRoomController all endpoints | SCR-29–32 |
| **H** | EmployeeRoomController read-only GET | US-6, FR-009 |
| **I** | Frontend pages + roomsApi migration | US-1–5 |
| **J** | Employee SCR-65 page + route | US-6 |
| **K** | ActivityLog + tests + quickstart | SC-001–SC-007 |

## Frontend Gap Analysis

| Item | Hiện tại | Target |
|------|----------|--------|
| Manager list | `GET /api/rooms/manager` | `GET /api/v1/manager/rooms?propertyId&floorId&status&search` |
| Create/Update | legacy `/api/rooms` | `POST/PUT /api/v1/manager/rooms` |
| Delete | `DELETE /api/rooms/{id}` | `DELETE /api/v1/manager/rooms/{id}` |
| Detail | `GET /api/rooms/{id}` | `GET /api/v1/manager/rooms/{id}` |
| Gallery | ad-hoc attachments | `POST/PUT/DELETE /api/v1/manager/rooms/{id}/images` |
| api-spec `name` | name field | Map to `roomNumber` in DTO |
| Status kebab | links SCR-33 | Keep navigation to FR-05 `RoomStatusPage` — not FR-08 |
| Employee list | may be missing | SCR-65 read-only page |
| Property filter | legacy properties API | FR-06 `/api/v1/manager/properties` |

## Risks

| Risk | Mitigation |
|------|------------|
| FR-07 floors missing | Blocker for create room — implement FR-07 first |
| FR-03 seed V010 conflict | Renumber discovery seed to V011 after V009–V010 |
| Upload storage undefined | v1: multipart → local `/uploads/rooms/` + public URL; S3 later |
| FR-04 bookings table missing | Delete guard returns false (allow delete) in dev only — IT mocks bookings |

## Generated Artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/room-api.yaml](./contracts/room-api.yaml)
- [quickstart.md](./quickstart.md)

## Next Step

Run **`/speckit-tasks`** to generate dependency-ordered `tasks.md`.
