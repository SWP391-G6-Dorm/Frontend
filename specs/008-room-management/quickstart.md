# Quickstart: FR-08 Room Management

**Feature**: `specs/008-room-management` | **Plan**: [plan.md](./plan.md)

**Prerequisite**: FR-06 property + manager assignment; FR-07 at least one floor on seed property.

## Prerequisites

- Java 17+, Maven 3.9+
- Node 18+
- PostgreSQL 15+
- Flyway V009–V010 applied (after FR-07 V008)

## Environment

```bash
# Optional upload directory (v1 local storage)
APP_UPLOAD_DIR=./uploads/rooms
```

Vite proxy: `/api/v1` → `http://localhost:8080`

## Run

```bash
cd backend && ./mvnw spring-boot:run
cd frontend && npm install && npm run dev
```

## Screen → Route → API

| Screen | Route | API |
|--------|-------|-----|
| SCR-29 Room List | `/manager/rooms` | `GET /manager/rooms` |
| SCR-30 Add Room | `/manager/rooms/add` | `POST /manager/rooms` |
| SCR-31 Edit Room | `/manager/rooms/:id/edit` | `GET/PUT /manager/rooms/{id}` |
| SCR-32 Gallery | `/manager/rooms/:id/gallery` | `POST/DELETE /manager/rooms/{id}/images/*` |
| SCR-33 Status | `/manager/rooms/:id/status` | FR-05 — not FR-08 |
| SCR-65 Employee List | `/employee/rooms` | `GET /employee/rooms` |

## curl smoke tests

Replace tokens and IDs.

```bash
BASE=http://localhost:8080/api/v1
MGR_TOKEN="<manager-jwt>"
EMP_TOKEN="<employee-jwt>"
PROPERTY_ID="<uuid>"
FLOOR_ID="<uuid>"

# SCR-29 — list rooms
curl -s "$BASE/manager/rooms?propertyId=$PROPERTY_ID&page=0&size=10" \
  -H "Authorization: Bearer $MGR_TOKEN" | jq

# SCR-30 — create room
curl -s -X POST "$BASE/manager/rooms" \
  -H "Authorization: Bearer $MGR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\":\"$PROPERTY_ID\",
    \"floorId\":\"$FLOOR_ID\",
    \"roomNumber\":\"101\",
    \"roomType\":\"Deluxe\",
    \"pricePerNight\":500000,
    \"capacity\":2,
    \"description\":\"Sea view\"
  }" | jq

ROOM_ID=$(curl -s -X POST "$BASE/manager/rooms" \
  -H "Authorization: Bearer $MGR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\":\"$PROPERTY_ID\",
    \"floorId\":\"$FLOOR_ID\",
    \"roomNumber\":\"102\",
    \"roomType\":\"Standard\",
    \"pricePerNight\":350000,
    \"capacity\":2
  }" | jq -r '.data.id')

# Duplicate room number (expect 409)
curl -s -X POST "$BASE/manager/rooms" \
  -H "Authorization: Bearer $MGR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\":\"$PROPERTY_ID\",
    \"floorId\":\"$FLOOR_ID\",
    \"roomNumber\":\"101\",
    \"roomType\":\"Standard\",
    \"pricePerNight\":300000,
    \"capacity\":2
  }" | jq

# SCR-31 — get detail
curl -s "$BASE/manager/rooms/$ROOM_ID" \
  -H "Authorization: Bearer $MGR_TOKEN" | jq

# Update room
curl -s -X PUT "$BASE/manager/rooms/$ROOM_ID" \
  -H "Authorization: Bearer $MGR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pricePerNight":550000,"description":"Updated"}' | jq

# SCR-32 — add image by URL (dev)
curl -s -X POST "$BASE/manager/rooms/$ROOM_ID/images" \
  -H "Authorization: Bearer $MGR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/room.jpg"}' | jq

IMAGE_ID=$(curl -s -X POST "$BASE/manager/rooms/$ROOM_ID/images" \
  -H "Authorization: Bearer $MGR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/room2.jpg"}' | jq -r '.data.id')

# Set primary
curl -s -X PATCH "$BASE/manager/rooms/$ROOM_ID/images/$IMAGE_ID/primary" \
  -H "Authorization: Bearer $MGR_TOKEN" | jq

# Delete room without booking
curl -s -X DELETE "$BASE/manager/rooms/$ROOM_ID" \
  -H "Authorization: Bearer $MGR_TOKEN" | jq

# Employee read-only list
curl -s "$BASE/employee/rooms?propertyId=$PROPERTY_ID" \
  -H "Authorization: Bearer $EMP_TOKEN" | jq

# Employee cannot create (expect 403)
curl -s -X POST "$BASE/manager/rooms" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"floorId\":\"$FLOOR_ID\",\"roomNumber\":\"999\",\"roomType\":\"Standard\",\"pricePerNight\":100000,\"capacity\":1}" | jq
```

## Validation checklist

- [ ] New room has status **AVAILABLE**
- [ ] Duplicate room number in same property returns **409**
- [ ] Floor from different property rejected on create
- [ ] Delete blocked when active booking exists (409)
- [ ] Only one **primary** image per room
- [ ] Manager list scoped to assigned properties only
- [ ] Employee GET works; Employee POST/PUT/DELETE returns **403**
- [ ] FR-07 structure tree shows room nodes after create

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 403 on all manager calls | Verify FR-06 manager assignment |
| Cannot create room | Ensure floor exists (FR-07 V008) |
| Gallery upload fails | Check `APP_UPLOAD_DIR` writable |
| FR-03 discovery empty | Property must be ACTIVE; room AVAILABLE |
| Migration order error | Apply V008 floors before V009 rooms |
