# Feature Specification: FR-04 Booking & Inventory Management

**Feature Branch**: `006-booking-inventory`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "FR-04 Booking & Inventory Management — dựa vào docs (Specification_v2.md § FR-04, §5 Booking entity, §2 Customer/Manager permissions, api-spec-by-screen SCR-15–20/34–35, screen.md, screendesign.md, entity-ui-mapping.md)"

**Phụ thuộc**: FR-01 (Customer đăng nhập để đặt phòng); FR-03 (chọn phòng và ngày từ discovery); dữ liệu Room/Property phải tồn tại. **Ranh giới**: tạo/gửi hợp đồng PDF chi tiết (FR-10); đối soát VNPay định kỳ và lịch sử payment đầy đủ (FR-12); quy trình kiểm tra phòng & damage dispute chi tiết (FR-23); thực thi housekeeping (FR-21); dashboard Customer tổng quan (SCR-15) chỉ đọc booking — thuộc phạm vi hiển thị FR-04 khi liên quan booking.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer đặt phòng và thanh toán cọc (Priority: P1)

Là **Customer**, tôi muốn gửi yêu cầu đặt phòng với ngày check-in/check-out, số khách, ghi chú đặc biệt và thanh toán **40% tổng giá trị** làm cọc qua cổng thanh toán trực tuyến hoặc chuyển khoản, để giữ phòng trong thời gian chờ xác nhận.

**Why this priority**: Luồng cốt lõi tạo doanh thu và khóa tồn kho; SCR-16.

**Independent Test**: Customer chọn phòng + ngày (từ FR-03) → điền form checkout → xác nhận → booking ở trạng thái chờ cọc; tổng tiền và tiền cọc hiển thị đúng; phòng không thể bị đặt trùng bởi khách khác trong khoảng ngày đã chọn.

**Acceptance Scenarios**:

1. **Given** phòng còn trống trong khoảng ngày và Customer đã đăng nhập, **When** submit form đặt phòng hợp lệ, **Then** tạo booking trạng thái **Pending Deposit**, snapshot **TotalAmount** (không đổi khi Manager sửa giá phòng sau này), **DepositAmount = 40%**, **RemainingAmount = 60%**, và giữ phòng trong khoảng ngày.
2. **Given** booking Pending Deposit và Customer chọn thanh toán trực tuyến, **When** thanh toán cọc thành công, **Then** booking chuyển **Confirmed**, hệ thống tự động tạo và gửi **Accommodation Contract** qua email cho Customer.
3. **Given** hai Customer cùng đặt một phòng trùng khoảng ngày gần như đồng thời, **When** hệ thống xử lý, **Then** chỉ **một** booking được chấp nhận; booking còn lại nhận thông báo phòng không còn khả dụng.
4. **Given** check-out ≤ check-in hoặc guestCount vượt capacity phòng, **When** submit, **Then** từ chối với thông báo lỗi rõ ràng, không tạo booking.
5. **Given** phòng không còn available (Maintenance, Out Of Service, hoặc đã booked), **When** Customer submit, **Then** từ chối đặt phòng.

---

### User Story 2 - Customer xem và theo dõi booking (Priority: P1)

Là **Customer**, tôi muốn xem danh sách booking của mình (theo tab trạng thái) và chi tiết từng booking (ngày, giá, số tiền đã trả, còn lại, hành động theo trạng thái) để quản lý chuyến đi.

**Why this priority**: Customer cần theo dõi sau khi đặt; SCR-17, SCR-18; dashboard SCR-15 hiển thị upcoming stay.

**Independent Test**: Customer mở "My Bookings" → thấy booking của chính mình; click chi tiết → thấy breakdown giá và action phù hợp trạng thái (thanh toán phần còn lại, hủy, v.v.).

**Acceptance Scenarios**:

1. **Given** Customer có nhiều booking, **When** mở danh sách booking, **Then** chỉ hiển thị booking thuộc tài khoản đó, có thể lọc theo trạng thái (All, Upcoming, Completed, Cancelled).
2. **Given** booking Confirmed sắp tới, **When** xem chi tiết, **Then** hiển thị TotalAmount, paidAmount, remainingBalance, ngày check-in/check-out, phòng, trạng thái.
3. **Given** booking Pending Deposit chưa thanh toán cọc, **When** xem chi tiết, **Then** hiển thị hành động hoàn tất thanh toán cọc hoặc upload biên lai (chuyển khoản).
4. **Given** Customer cố truy cập booking của người khác, **When** mở chi tiết theo ID, **Then** từ chối truy cập (chỉ dữ liệu của chính mình).

---

### User Story 3 - Manager check-in và check-out (Priority: P1)

Là **Manager** của property, tôi muốn xem danh sách booking thuộc property được gán, xem chi tiết, thực hiện check-in khi khách đến và check-out khi khách rời, để phản ánh trạng thái thực tế lưu trú.

**Why this priority**: Vận hành tại chỗ; SCR-34, SCR-35.

**Independent Test**: Manager lọc booking Confirmed → check-in vào ngày đến → trạng thái Checked-in; sau khi kiểm tra phòng hoàn tất → check-out → Checked-out và phòng chuyển chờ dọn.

**Acceptance Scenarios**:

1. **Given** Manager được gán property P, **When** xem danh sách booking, **Then** chỉ thấy booking thuộc phòng của property P; có lọc theo trạng thái và ngày.
2. **Given** booking Confirmed đến ngày check-in, **When** Manager thực hiện check-in, **Then** booking chuyển **Checked-in**; nếu chính sách yêu cầu thu phần còn lại tại check-in, hệ thống xác nhận remaining balance đã thanh toán trước khi cho phép check-in.
3. **Given** booking Checked-in và **Room Inspection** đã hoàn tất (không còn hư hại chưa xử lý), **When** Manager check-out, **Then** booking chuyển **Checked-out**, phòng chuyển **Pending Cleaning**, hệ thống tạo **HousekeepingTask** tự động.
4. **Given** Room Inspection chưa hoàn tất, **When** Manager cố check-out, **Then** chặn check-out với thông báo cần hoàn thành kiểm tra phòng trước.
5. **Given** Manager không được gán property của booking, **When** truy cập chi tiết, **Then** từ chối truy cập.

---

### User Story 4 - Customer hủy booking theo chính sách hoàn tiền (Priority: P2)

Là **Customer**, tôi muốn hủy booking trước ngày check-in và thấy rõ số tiền hoàn lại theo chính sách, để quyết định có hủy hay không.

**Why this priority**: FR-04 chính sách hủy linh hoạt; SCR-19.

**Independent Test**: Mở màn hình hủy → hệ thống hiển thị % hoàn theo số ngày còn lại → xác nhận → booking Cancelled và phòng được nhả.

**Acceptance Scenarios**:

1. **Given** booking Confirmed còn **≥7 ngày** trước check-in, **When** Customer xác nhận hủy, **Then** hoàn **100%** tiền cọc đã trả (theo chính sách), booking **Cancelled**, phòng available lại.
2. **Given** còn **3–7 ngày** trước check-in, **When** hủy, **Then** hoàn **50%** tiền cọc.
3. **Given** còn **<3 ngày** trước check-in, **When** hủy, **Then** **không hoàn** tiền cọc.
4. **Given** booking đã **Checked-in** hoặc sau check-in, **When** Customer cố hủy, **Then** không cho phép hủy.
5. **Given** booking Pending Deposit chưa thanh toán, **When** hủy hoặc hết thời gian giữ chỗ, **Then** Cancelled, không có khoản hoàn (chưa thu tiền).

---

### User Story 5 - Cọc chuyển khoản và xác minh Manager (Priority: P2)

Là **Customer**, tôi muốn chọn thanh toán cọc bằng chuyển khoản, upload biên lai, và được thông báo khi Manager xác nhận — thay vì thanh toán trực tuyến tức thì.

**Why this priority**: FR-04 hỗ trợ hai phương thức cọc; SCR-20; xác minh Manager (SCR-37 thuộc payment nhưng kết quả là Confirmed booking).

**Independent Test**: Chọn Transfer → tạo booking Pending Deposit → upload receipt → Manager approve → Confirmed + contract email.

**Acceptance Scenarios**:

1. **Given** Customer chọn phương thức chuyển khoản khi đặt phòng, **When** booking được tạo, **Then** trạng thái Pending Deposit chờ xác minh; Customer được hướng dẫn upload biên lai.
2. **Given** Customer upload biên lai hợp lệ, **When** submit, **Then** booking đánh dấu chờ xác minh; Manager nhận thông báo cần duyệt.
3. **Given** Manager duyệt biên lai khớp số tiền cọc kỳ vọng, **When** approve, **Then** booking → Confirmed, contract gửi email; từ chối nếu biên lai không hợp lệ với lý do.
4. **Given** quá thời gian giữ chỗ mà chưa có cọc được xác nhận, **When** job tự động chạy, **Then** booking Cancelled và phòng được nhả (xem US7).

---

### User Story 6 - Manager sửa booking Confirmed (Priority: P2)

Là **Manager**, tôi muốn chỉnh sửa booking đang **Confirmed** (đổi ngày hoặc phòng) khi khách yêu cầu, với tính toán chênh lệch giá rõ ràng.

**Why this priority**: FR-04 "Chỉnh sửa Booking: đổi ngày/phòng cho Confirmed".

**Independent Test**: Manager mở booking Confirmed → đổi ngày/phòng → hệ thống tính chênh lệch → cập nhật snapshot giá và inventory lock mới.

**Acceptance Scenarios**:

1. **Given** booking Confirmed, **When** Manager đổi check-in/check-out sang khoảng ngày phòng còn trống, **Then** cập nhật booking, tính lại TotalAmount snapshot và chênh lệch cần thu/hoàn phần còn lại hoặc cọc nếu có.
2. **Given** booking Confirmed, **When** Manager đổi sang phòng khác cùng property còn trống, **Then** nhả lock phòng cũ, khóa phòng mới, cập nhật giá snapshot.
3. **Given** phòng/ngày mới không available, **When** Manager submit sửa, **Then** từ chối với thông báo conflict.
4. **Given** booking đã Checked-in hoặc Cancelled, **When** cố sửa, **Then** không cho phép chỉnh sửa loại này.

---

### User Story 7 - Vòng đời tự động: giữ chỗ quá hạn và no-show (Priority: P3)

Là **hệ thống**, tôi cần tự động hủy booking không thanh toán cọc đúng hạn và đánh dấu no-show khi khách không đến, để giải phóng tồn kho và áp dụng chính sách cọc.

**Why this priority**: FR-04 Hold Timeout và No-show; giảm overbooking ảo và tồn kho treo.

**Independent Test**: Tạo Pending Deposit → không thanh toán sau thời gian cấu hình → Cancelled; Confirmed qua 24h sau giờ check-in mà chưa check-in → No-show, cọc không hoàn.

**Acceptance Scenarios**:

1. **Given** booking Pending Deposit quá **30 phút** (có thể cấu hình) không có cọc xác nhận, **When** scheduled job chạy, **Then** booking → Cancelled, phòng available.
2. **Given** booking Confirmed, **When** quá **24 giờ** kể từ thời điểm check-in dự kiến mà chưa check-in, **Then** booking → **No-show**, tiền cọc **không hoàn**.
3. **Given** Customer thanh toán cọc ngay trước khi job timeout chạy, **When** xác nhận thành công, **Then** booking Confirmed, không bị hủy bởi timeout.

---

### Edge Cases

- Hai khách đặt cùng phòng cùng millisecond → chỉ một thành công (zero overbooking).
- Customer thanh toán online nhưng mạng chậm / callback trễ → booking không bị hủy sai nếu thanh toán thực sự thành công (đối soát thuộc FR-12).
- Hủy booking Pending Deposit đang chờ Manager duyệt chuyển khoản → Cancelled, phòng nhả ngay.
- Manager hủy booking (lỗi hệ thống/bất khả kháng) → **bắt buộc hoàn 100% cọc**, khác với hủy do Customer.
- Phát hiện hư hại khi inspection → **Damage Fee** được Manager phê duyệt, cộng vào số tiền còn lại; check-out chỉ khi inspection xong và các khoản liên quan đã xử lý (chi tiết dispute FR-23).
- Customer thanh toán **60% còn lại** trước hoặc tại check-in — booking vẫn Confirmed cho đến check-in; remaining balance theo dõi trong chi tiết booking (thu tiền chi tiết FR-11/FR-12).
- Sửa booking Confirmed làm tăng giá → Customer được thông báo số tiền bổ sung cần thanh toán.
- Booking No-show → phòng được giải phóng theo quy trình vận hành; không cho Customer review (FR-14).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cho phép **Customer** tạo yêu cầu đặt phòng với room, check-in, check-out, guestCount, specialRequests (SCR-16).
- **FR-002**: Hệ thống MUST **khóa tồn kho phòng** theo khoảng ngày khi booking được tạo và MUST **ngăn overbooking** — không hai booking active cùng phòng trùng khoảng ngày.
- **FR-003**: Hệ thống MUST **snapshot TotalAmount, DepositAmount (40%), RemainingAmount (60%)** tại thời điểm tạo booking; thay đổi giá phòng sau đó MUST NOT ảnh hưởng booking đã tạo.
- **FR-004**: Hệ thống MUST hỗ trợ trạng thái booking: Pending Deposit, Confirmed, Checked-in, Pending Inspection, Pending Damage Payment, Checked-out, Cancelled, No-show.
- **FR-005**: Hệ thống MUST chuyển booking **Pending Deposit → Confirmed** khi cọc 40% được xác nhận (thanh toán trực tuyến tự động hoặc Manager duyệt chuyển khoản).
- **FR-006**: Khi cọc được xác nhận, hệ thống MUST **tự động tạo và gửi Accommodation Contract** qua email cho Customer (nội dung hợp đồng chi tiết thuộc FR-10).
- **FR-007**: Hệ thống MUST tự động **hủy booking Pending Deposit** và nhả phòng nếu không có cọc xác nhận trong thời gian giữ chỗ (**mặc định 30 phút**, có thể cấu hình).
- **FR-008**: Hệ thống MUST chuyển booking **Confirmed → No-show** nếu quá **24 giờ** từ thời điểm check-in dự kiến mà chưa check-in; tiền cọc không hoàn.
- **FR-009**: Customer MUST có thể **xem danh sách và chi tiết** booking của chính mình (SCR-17, SCR-18); MUST NOT xem booking người khác.
- **FR-010**: Customer MUST có thể **hủy booking** trước check-in theo chính sách: ≥7 ngày hoàn 100% cọc, 3–7 ngày hoàn 50%, <3 ngày không hoàn; MUST NOT hủy sau khi Checked-in.
- **FR-011**: Manager MUST có thể **xem danh sách và chi tiết** booking thuộc property được gán (SCR-34, SCR-35); MUST NOT truy cập property khác.
- **FR-012**: Manager MUST có thể **check-in** booking Confirmed (→ Checked-in) và **check-out** (→ Checked-out) khi điều kiện nghiệp vụ thỏa mãn.
- **FR-013**: Check-out MUST bị **chặn** cho đến khi **Room Inspection** hoàn tất (FR-23); nếu có Damage Fee đã duyệt, MUST phản ánh trong số tiền còn lại trước khi hoàn tất checkout.
- **FR-014**: Khi check-out hoàn tất, hệ thống MUST chuyển phòng sang **Pending Cleaning** và **tạo HousekeepingTask** tự động (thực thi dọn phòng FR-21).
- **FR-015**: Manager MUST có thể **sửa booking Confirmed** — đổi ngày hoặc phòng — với tính toán chênh lệch giá và cập nhật khóa tồn kho; MUST NOT sửa booking Checked-in/Cancelled/No-show.
- **FR-016**: Manager-initiated cancel (lỗi hệ thống/bất khả kháng) MUST **hoàn 100% cọc** và ghi nhận lý do/hình thức hủy.
- **FR-017**: Customer chọn cọc **chuyển khoản** MUST có thể **upload biên lai**; booking MUST ở trạng thái chờ xác minh cho đến khi Manager approve/reject.

### Key Entities

- **Booking**: customer, room, checkIn/checkOut, guestCount, totalAmount (snapshot), depositAmount, remainingAmount, damageFeeAmount, specialRequests, status, holdExpiresAt, cancel metadata (cancelledBy, cancelReason, cancelledAt).
- **Inventory Lock** (logic nghiệp vụ): gắn room + date range với booking active; released khi Cancelled/No-show/Checked-out theo quy tắc.
- **Payment** (liên kết): cọc 40%, phần còn lại 60%, damage fee — trạng thái thanh toán chi tiết thuộc FR-11/FR-12; FR-04 yêu cầu xác nhận cọc để Confirmed.
- **Contract** (liên kết): sinh khi cọc xác nhận; immutable snapshot (FR-10).
- **RoomInspection** (liên kết FR-23): gate trước check-out.
- **HousekeepingTask** (liên kết FR-21): sinh sau check-out.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customer hoàn tất **đặt phòng và khởi tạo thanh toán cọc** trong **dưới 5 phút** từ màn hình checkout (không tính thời gian chờ duyệt chuyển khoản).
- **SC-002**: **0% overbooking** — không có trường hợp hai booking active cùng phòng trùng khoảng ngày trong kiểm thử đồng thời.
- **SC-003**: **100%** booking Pending Deposit quá thời gian giữ chỗ được tự động hủy và nhả phòng trong vòng **5 phút** sau thời hạn.
- **SC-004**: **95%** booking cọc trực tuyến thành công chuyển Confirmed và Customer nhận email hợp đồng trong **10 phút** kể từ thanh toán.
- **SC-005**: Customer xem chính sách hoàn tiền chính xác **100%** các tier (≥7d / 3–7d / <3d) trước khi xác nhận hủy.
- **SC-006**: Manager check-in/check-out một booking trong **dưới 2 phút** từ màn hình chi tiết khi điều kiện đã đủ.
- **SC-007**: **90%** Customer tìm thấy trạng thái và số tiền còn lại của booking trên màn chi tiết **không cần liên hệ support**.

## Assumptions

- Customer phải đăng nhập (FR-01) để tạo booking; Guest chỉ discovery (FR-03).
- Tỷ lệ cọc **40% / còn lại 60%** cố định theo Specification_v2.
- Thời gian giữ chỗ **mặc định 30 phút** (configurable); api-spec-by-screen ghi 15 phút cho VNPay cron — ưu tiên **30 phút** theo FR-04 chính thức trừ khi `/speckit-clarify` quyết định khác.
- No-show: **24 giờ** sau thời điểm check-in dự kiến, cọc không hoàn.
- Chính sách hủy Customer: **≥7 ngày 100%**, **3–7 ngày 50%**, **<3 ngày 0%** tính theo ngày lịch trước check-in.
- Thanh toán phần còn lại và damage fee chi tiết (VNPay reconciliation, invoice) thuộc FR-11/FR-12; FR-04 chỉ yêu cầu theo dõi số dư trên booking và gate check-in khi thu tại quầy.
- Room Inspection workflow chi tiết (Employee assign, dispute, Admin escalation) thuộc FR-23; FR-04 chỉ yêu cầu **chặn check-out** until inspection done.
- Contract PDF template và addendum damage thuộc FR-10.
- Tiền tệ và format hiển thị theo locale VND đã dùng trong project docs.
- WebSocket notification cho booking events thuộc FR-15; FR-04 yêu cầu thông báo tối thiểu qua email/in-app khi Confirmed, cancel, no-show.
