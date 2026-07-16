# Homestay / Resort Booking Management System

Web app for multi-property homestay/resort discovery, booking, Accommodation Contract PDF + email, deposit/remaining/damage payments (VNPay + bank transfer), Property → Floor → Room ops, housekeeping, room inspection/damage, maintenance, reviews, complaints, promotions, and role-scoped reporting. Doc map: `Specification_v2.md` (requirements), `Agents.md` (agent standards), `screen.md` / `screendesign.md` (65 screens), `api-spec-by-screen.md`, `DESIGN.md` / `component-library.md`, `entity-ui-mapping.md`.

## Tech Stack

- **Frontend**: ReactJS, TypeScript, Vite, React Router, TailwindCSS, Axios, Zustand / Redux Toolkit, React Query
- **Backend**: Java Spring Boot, Spring Security, Spring Data JPA, Hibernate, JWT, JavaMail (SMTP), iText / Apache PDFBox
- **Database**: PostgreSQL (inventory lock uses `EXCLUDE USING gist` on `(RoomId, DateRange)`)
- **Integrations**: VNPay, Google OAuth, WebSocket notifications, Outbox (`outbox_events`) for reliable async dispatch
- **DevOps**: Docker, GitHub Actions, Nginx

## Commands

### Frontend (`frontend/`)

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm run test`

### Backend (`backend/`)

- Dev: `./mvnw spring-boot:run`
- Test: `./mvnw test`
- Package: `./mvnw clean package`

## Project Structure

```
frontend/src/
  api/  assets/  components/  hooks/  layouts/  pages/
  services/  store/  styles/  utils/

backend/src/main/java/com/homestay/
  config/  configs/  controller/  dto/  entity/  exception/
  repository/  security/  service/  util/

Allowed edit roots: frontend/  backend/  docs/  tests/  scripts/
Never touch: .env*, secrets/, node_modules/, dist/, build/, target/, coverage/
```

## Roles

| Role | Scope |
|------|--------|
| **Guest** | Public browse/search/calendar, register, login (email or Google), forgot password |
| **Customer** | Own bookings, payments, contracts, maintenance tickets, reviews, complaints, notifications |
| **Employee** | One Property only: assigned housekeeping/maintenance, room inspection, damage report capture |
| **Manager** | Assigned Properties only: floors/rooms, bookings/contracts, payment verification, employees, HK/maintenance assign+verify, damage fee approval, property reports |
| **Admin** | Global: managers, properties + manager assignment, customers, complaints, review moderation, system settings, promotions, global reports, damage co-approve when fee > 5,000,000 VND; no operational HK/maintenance work |

Property-level data isolation is mandatory for Manager and Employee.

## Architecture & Coding Rules

### Frontend

- Feature/component architecture; functional TypeScript components only.
- Server state: React Query. Client state: Zustand or Redux Toolkit.
- Centralized Axios + JWT / refresh / error interceptors.
- Design tokens in Tailwind (`DESIGN.md` / `component-library.md`): fonts Outfit + Plus Jakarta Sans; primary `#0F766E`. Soft status badges (semantic color at 10% opacity). WCAG 2.1 AA; every input needs a `<label>`; visible focus rings.
- Lazy load / code-split; mobile 375px + desktop 1440px.

### Backend

- Layers: Controller → Service → Repository → Entity. Thin controllers, DTOs, constructor injection, SOLID.
- Bean Validation on DTOs; global `@RestControllerAdvice`.
- Entities: UUID `id`, `createdAt`/`updatedAt` (DB: `snake_case`).
- `@Transactional` for booking create, deposit/remaining/damage payment, contract generation, cancel, check-in/out, housekeeping completion.
- Outbox for contract email / notifications; `@Async` for PDF/email so payment APIs stay fast.
- Jobs: Booking Hold Timeout (cancel unpaid deposit after **30 min**, configurable); VNPay Reconciliation every **15 min** via `OrderRef`.
- Pagination on all list endpoints. Indexes on `email`, `property_id`, `room_id`, `booking_id`, `customer_id`.

## Business Rules (Critical)

### Booking & money

1. Create booking → `Pending Deposit`; snapshot `TotalAmount` (later `PricePerNight` changes MUST NOT rewrite it).
2. Deposit **40%** / Remaining **60%** (ratios configurable via `SystemSetting`).
3. Pay deposit via **VNPay** (auto-confirm) or **bank transfer** (Manager verifies with uploaded `PaymentReceipt`; remind if unverified > 24h).
4. On confirmed deposit → Booking `Confirmed` + immutable Accommodation Contract PDF + email (async/outbox).
5. Hold timeout: no deposit within 30 min → `Cancelled`, room released.
6. No-show: **24h** past check-in with no arrival → `No-show` (deposit kept).
7. Remaining due before/at check-in. Damage fee (if any) must be settled before check-out completes.
8. Cancel (Customer): flex policy e.g. ≥7 days 100%, 3–7 days 50%, &lt;3 days 0%. Manager-initiated cancel (force majeure/system) → **100%** deposit refund.
9. Zero overbooking: DB exclusion constraint on room date ranges.

### Booking statuses

`Pending Deposit` → `Confirmed` → `Checked-in` → `Pending Inspection` → (`Pending Damage Payment`) → `Checked-out` | `Cancelled` | `No-show`

### Room statuses

`Available` | `Pending Deposit` | `Reserved` | `Occupied` | `Pending Cleaning` | `Cleaning In Progress` | `Maintenance` | `Out Of Service`

### Check-out, damage, housekeeping

- Check-out blocked until Room Inspection completes and all payments (incl. damage) are done.
- Manager approves Damage Fee; if fee **> 5,000,000 VND** (configurable) Admin MUST co-approve. Customer may **Dispute** within **24h** → escalate to Admin.
- Refuse damage fee / leave early → Customer `Outstanding Debt`; block future bookings until paid. Contract Addendum for post-contract damage fees (contract itself is immutable).
- After successful check-out → room `Pending Cleaning` + auto `HousekeepingTask`. Manager MUST NOT skip HK to force `Available`. Employee start → `Cleaning In Progress`; complete → `Available`.

### Reviews & other

- One review per booking; only after `Checked-out`. Admin/Manager may Hide. Maintenance tickets require an active booking; edit/delete only while `Open`.

## API Standards

```
Success: { "success": true,  "message": "Success",           "data": {} }
Error:   { "success": false, "message": "...",               "errors": [{ "field", "message" }] }

Auth: Authorization: Bearer <access_token>
Upload: multipart/form-data when attaching files
Pagination: ?page=0&size=10&sort=createdAt,desc
```

HTTP: 200 / 201 / 400 / 401 / 403 / 404 / 409 / 500. Per-screen contracts: `api-spec-by-screen.md`.

## Security Rules

- **NEVER**: hardcode secrets, log passwords/tokens, insecure SQL, skip RBAC or property isolation.
- **ALWAYS**: validate input, parameterized queries, BCrypt passwords, HTTPS in prod, verify VNPay signatures, verify bank receipts before confirming transfer payments.
- Google link only if local email already verified (else extra verification — prevent account takeover).
- Suspended accounts cannot log in. Revoke tokens on logout.

## Git / Testing / Performance

- Branches: `feature/…`, `bugfix/…`, `hotfix/…`. Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- Tests: RTL + Vitest/Jest; JUnit 5 + Mockito. Coverage **≥ 80%**. Include unit, integration, API validation.
- Perf: paged lists, avoid N+1, lazy UI bundles; NFR target &lt;3s average response, ≥500 concurrent users.

## Open conflicts

- Deposit refund: FR-04 flexible % by days-to-check-in vs business error text “Deposit is non-refundable upon cancellation after deposit payment” — implement FR-04 + Manager 100% cancel rule until product clarifies.
- DB wording in `Agents.md` (“SQL Server / PostgreSQL”) vs Spec inventory lock requiring PostgreSQL gist — use **PostgreSQL**.
- `figma-generation-prompt.md` mentions cream/orange tokens; canonical UI tokens are Teal/Modern Zen in `DESIGN.md` / `Agents.md`.
