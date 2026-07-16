# Data Model: FR-08 Room Management

**Date**: 2026-06-27  
**Spec**: [spec.md](./spec.md) | **Base**: `docs/Specification_v2.md` §5 Room, RoomImage

## Scope

FR-08 **owns** `rooms` and `room_images`. Reads `floors`, `properties`, `bookings` (delete guard). Does not own status PATCH (FR-05) or PricingRule writes (deferred).

## ERD

```text
Property 1──* Floor 1──* Room 1──* RoomImage
Property 1──* Room (denormalized property_id for queries)
Room 1──* Booking (read — delete guard)
```

## Table: rooms

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| property_id | UUID | FK properties NOT NULL | Denormalized for list/filter |
| floor_id | UUID | FK floors NOT NULL | Must match floor.property_id |
| room_number | VARCHAR(32) | NOT NULL | api-spec `name` |
| room_type | VARCHAR(64) | NOT NULL | Studio, Standard, … |
| area | DECIMAL(10,2) | nullable | m² |
| price_per_night | DECIMAL(12,2) | NOT NULL | > 0 |
| capacity | INTEGER | NOT NULL | >= 1 |
| status | VARCHAR(32) | NOT NULL, DEFAULT 'AVAILABLE' | 8 enum values §5 |
| description | TEXT | nullable | |
| amenities | JSONB | DEFAULT '[]' | string tags |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**:

- `UNIQUE (property_id, room_number)`
- `(property_id, status)`, `(floor_id)`, `(property_id, room_type)`
- GIN/trgm on `room_number` for search

**Validation**:

- `floor_id` belongs to same `property_id`
- `price_per_night` > 0, `capacity` >= 1
- Unique room number per property

### RoomOperationalStatus enum

`AVAILABLE`, `PENDING_DEPOSIT`, `RESERVED`, `OCCUPIED`, `PENDING_CLEANING`, `CLEANING_IN_PROGRESS`, `MAINTENANCE`, `OUT_OF_SERVICE`

## Table: room_images

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| room_id | UUID | FK rooms ON DELETE CASCADE | |
| image_url | VARCHAR(1024) | NOT NULL | |
| is_primary | BOOLEAN | NOT NULL DEFAULT false | |
| sort_order | INTEGER | NOT NULL DEFAULT 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**:

- Partial unique: `(room_id) WHERE is_primary = true`
- `(room_id, sort_order)`

## Delete Guard (bookings read)

Block room delete when:

```sql
EXISTS (
  SELECT 1 FROM bookings b
  WHERE b.room_id = :roomId
  AND b.status IN (
    'PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN',
    'PENDING_INSPECTION', 'PENDING_DAMAGE_PAYMENT'
  )
)
```

## API DTOs

### CreateRoomRequest (SCR-30)

```json
{
  "propertyId": "uuid",
  "floorId": "uuid",
  "roomNumber": "101",
  "roomType": "Deluxe",
  "pricePerNight": 500000,
  "capacity": 2,
  "area": 25.5,
  "description": "...",
  "amenities": ["WiFi", "Điều hòa"]
}
```

### UpdateRoomRequest (SCR-31)

Partial update; `floorId` must stay within same property.

### RoomSummaryResponse (SCR-29 list)

```json
{
  "id": "uuid",
  "roomNumber": "101",
  "roomType": "Deluxe",
  "floorId": "uuid",
  "floorNumber": 1,
  "propertyId": "uuid",
  "propertyName": "...",
  "pricePerNight": 500000,
  "capacity": 2,
  "status": "AVAILABLE",
  "primaryImageUrl": "https://..."
}
```

### RoomDetailResponse (SCR-31)

Extends summary with `description`, `amenities[]`, `area`, `images[]`, `createdAt`.

### RoomImageResponse

```json
{
  "id": "uuid",
  "imageUrl": "...",
  "isPrimary": true,
  "sortOrder": 0
}
```

### ReorderImagesRequest

```json
{
  "imageIds": ["uuid1", "uuid2", "uuid3"]
}
```

## Flyway

```text
V009__rooms.sql
V010__room_images.sql
```

**Note**: If FR-03 uses `V010__discovery_seed.sql`, renumber to **V011** after FR-08 migrations.

## ActivityLog Events

| Event | When |
|-------|------|
| ROOM_CREATED | POST room |
| ROOM_UPDATED | PUT room |
| ROOM_DELETED | DELETE room |
| ROOM_IMAGE_ADDED | POST image |
| ROOM_IMAGE_REMOVED | DELETE image |
| ROOM_IMAGE_REORDERED | PUT reorder |
| ROOM_PRIMARY_IMAGE_SET | PATCH primary |

## Integration Points

| Feature | Integration |
|---------|-------------|
| FR-06 | PropertyAccessValidator on all manager writes |
| FR-07 | floor_id FK; delete floor blocked if rooms exist |
| FR-03 | Public GET /rooms reads rooms + primary image |
| FR-04 | Booking statuses for delete guard; price snapshot unaffected |
| FR-05 | Room.status updated by manual/calendar flows — not FR-08 PATCH |
| FR-07 tree | Room nodes populated after FR-08 |

## Security

| Endpoint | MANAGER | EMPLOYEE |
|----------|---------|----------|
| GET /manager/rooms | Assigned properties | — |
| GET /employee/rooms | — | Assigned property read-only |
| POST/PUT/DELETE /manager/rooms/** | Assigned | **Denied** |
| Gallery mutations | Assigned | **Denied** |
