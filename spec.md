# Homestay / Resort Booking Management System

## 1. Context & Goal

### Background

Việc quản lý homestay và resort hiện nay chủ yếu được thực hiện thủ công thông qua sổ sách, Excel hoặc các ứng dụng nhắn tin. Điều này gây khó khăn trong việc quản lý phòng, hợp đồng đặt phòng, thanh toán đặt cọc và các yêu cầu bảo trì.

Hệ thống Homestay / Resort Booking Management System được xây dựng nhằm số hóa toàn bộ quy trình quản lý đặt phòng homestay và resort, giúp Manager, Customer và khách tham quan làm việc trên một nền tảng tập trung. Hệ thống hỗ trợ nhiều property tại các địa điểm du lịch khác nhau.

### Goals

* Hỗ trợ tìm kiếm và đặt phòng homestay/resort trực tuyến.
* Quản lý hợp đồng đặt phòng (Accommodation Contract).
* Quản lý thanh toán đặt cọc (40%) và thanh toán phần còn lại.
* Tự động tạo và gửi hợp đồng PDF qua email sau khi đặt cọc thành công.
* Hiển thị lịch trống và tình trạng phòng theo thời gian thực.
* Quản lý cấu trúc phân cấp: Property → Floor → Room.
* Cung cấp báo cáo và thống kê cho Manager.
* Hỗ trợ quản trị hệ thống tập trung.

---

## 2. Actors & Roles

### Guest

Người dùng chưa đăng nhập hệ thống.

**Permissions**

* Xem danh sách phòng.
* Xem chi tiết phòng và lịch trống.
* Đăng ký tài khoản.
* Đăng nhập.
* Quên mật khẩu.

### Customer

Khách đã đăng nhập, có thể thực hiện đặt phòng homestay/resort.

**Permissions**

* Quản lý hồ sơ cá nhân.
* Gửi yêu cầu đặt phòng (Booking).
* Xem lịch sử đặt phòng.
* Xem hợp đồng đặt phòng (Accommodation Contract).
* Thanh toán đặt cọc và thanh toán phần còn lại.
* Gửi yêu cầu bảo trì.
* Đánh giá phòng sau khi check-out.
* Nhận thông báo.
* Tải và xem hợp đồng PDF.

### Manager

Người quản lý hệ thống, kết hợp vai trò của cả Admin và Landlord.

**Permissions**

* Quản lý Property (Property Management).
* Quản lý cấu trúc (Structure Management): Floor.
* Quản lý phòng (Room Management).
* Quản lý đặt phòng (Booking Management).
* Xác nhận thanh toán (Payment Verification).
* Quản lý hợp đồng đặt phòng (Contract Management).
* Tạo và gửi lại hợp đồng PDF.
* Xem báo cáo và thống kê (Reporting).
* Quản lý tài khoản Customer.
* Quản lý khiếu nại.
* Kiểm duyệt nội dung.
* Cấu hình hệ thống (System Settings).
* Theo dõi hoạt động hệ thống.

---

## 3. Functional Requirements

### FR-01 Authentication

* Người dùng có thể đăng ký tài khoản.
* Hệ thống xác thực email bằng OTP.
* Người dùng có thể đăng nhập.
* Người dùng có thể đặt lại mật khẩu.
* Người dùng có thể đổi mật khẩu.

### FR-02 User Profile

* Xem hồ sơ cá nhân.
* Cập nhật hồ sơ cá nhân.
* Quản lý thông tin liên hệ.

### FR-03 Room Discovery

* Hiển thị danh sách phòng theo từng property.
* Tìm kiếm phòng theo nhiều tiêu chí (địa điểm, loại phòng, ngày check-in/check-out, số khách).
* Xem chi tiết phòng bao gồm gallery, tiện ích và lịch trống.
* Xem lịch trống (Availability Calendar) theo từng phòng.

### FR-04 Booking

* Customer gửi yêu cầu đặt phòng (Booking) với thông tin check-in, check-out, số khách.
* Hệ thống kiểm tra tình trạng phòng trước khi xác nhận đặt.
* Customer thanh toán đặt cọc 40% tổng giá trị đặt phòng.
* Khi đặt cọc thành công: hệ thống tự động chuyển trạng thái Booking → Confirmed ngay lập tức (không cần xác nhận thủ công từ Manager), tạo Accommodation Contract PDF và gửi qua email.
* Customer thanh toán phần còn lại (60%) trước hoặc khi check-in.
* Customer có thể huỷ Booking trước khi check-in. Nếu huỷ sau khi đã đặt cọc, toàn bộ tiền cọc sẽ không được hoàn lại.
* Xem trạng thái Booking.

### FR-05 Availability Calendar

* Mỗi phòng hiển thị lịch trống với các trạng thái: Available, Pending Deposit, Reserved, Occupied, Maintenance.
* Manager có thể cập nhật trạng thái phòng thủ công.

### FR-06 Property Management

* Tạo property mới (homestay/resort).
* Chỉnh sửa thông tin property.
* Xem danh sách và chi tiết property.
* Quản lý trạng thái property.

### FR-07 Structure Management

* Quản lý phân cấp: Property → Floor → Room.
* Thêm, sửa, xóa Floor trong Property.
* Property Selector và Structure Tree View.

### FR-08 Room Management

* Thêm phòng vào đúng Property/Floor.
* Chỉnh sửa thông tin phòng.
* Quản lý trạng thái phòng.
* Quản lý hình ảnh phòng (gallery).
* Lọc phòng theo Property, Floor.

### FR-09 Customer Management

* Xem danh sách Customer.
* Xem lịch sử đặt phòng của từng Customer.

### FR-10 Contract Management

* Tự động tạo Accommodation Contract PDF khi đặt cọc thành công.
* Gửi contract qua email cho Customer.
* Xem danh sách và chi tiết hợp đồng đặt phòng.
* Tải PDF hợp đồng.
* In hợp đồng.
* Gửi lại email hợp đồng.

### FR-11 Billing Management

* Tạo hóa đơn thanh toán đặt cọc (40%) và phần còn lại (60%).
* Theo dõi trạng thái hóa đơn.

### FR-12 Payment Management

* Thanh toán đặt cọc (Deposit Payment).
* Thanh toán phần còn lại (Remaining Balance Payment).
* Upload biên lai thanh toán.
* Manager xác nhận thanh toán.
* Xem lịch sử thanh toán và trạng thái.

### FR-13 Maintenance Management

* Customer tạo yêu cầu bảo trì.
* Manager cập nhật trạng thái xử lý.
* Theo dõi tiến độ xử lý.

### FR-14 Review & Rating

* Customer đánh giá phòng sau khi check-out.
* Customer chỉ có thể đánh giá khi Booking.Status = Checked-out.
* Mỗi Booking chỉ được phép đánh giá 1 lần.
* Review liên kết với BookingId để đảm bảo tính xác thực.
* Xem đánh giá phòng.

### FR-15 Notification Management

* Gửi thông báo hệ thống.
* Gửi thông báo xác nhận đặt phòng, hợp đồng, thanh toán.
* Xem danh sách thông báo.
* Xem chi tiết thông báo.

### FR-16 Reporting

* Báo cáo doanh thu theo property, tháng, năm.
* Báo cáo tỷ lệ lấp đầy (Occupancy Rate).
* Báo cáo Booking Trend và Revenue Trend.
* Thống kê tổng số property, floor, room, booking.

### FR-17 Administration

* Quản lý tài khoản Customer.
* Quản lý khiếu nại.
* Kiểm duyệt nội dung.
* Quản lý cấu hình hệ thống (System Settings).

---

## 4. Non-Functional Requirements

### Performance

* Thời gian phản hồi trung bình dưới 3 giây.
* Hỗ trợ tối thiểu 500 người dùng đồng thời.

### Security

* Mật khẩu phải được mã hóa.
* Sử dụng HTTPS.
* Phân quyền theo vai trò (Guest, Customer, Manager).
* Chống truy cập trái phép.

### Availability

* Hệ thống hoạt động tối thiểu 99% thời gian.

### Scalability

* Có khả năng mở rộng số lượng property, phòng và người dùng.

### Usability

* Giao diện thân thiện.
* Hỗ trợ trên desktop và mobile.

### Maintainability

* Mã nguồn được tổ chức rõ ràng.
* Dễ bảo trì và mở rộng.

---

## 5. Data Model

## User

| Attribute    | Type     | Description            |
| ------------ | -------- | ---------------------- |
| UserId       | UUID     | Unique user identifier |
| RoleId       | UUID     | Reference to Role      |
| FullName     | String   | User full name         |
| Email        | String   | Login email            |
| PasswordHash | String   | Encrypted password     |
| PhoneNumber  | String   | Contact number         |
| AvatarUrl    | String   | Profile picture        |
| Status       | Enum     | Account status         |
| CreatedAt    | DateTime | Creation date          |
| UpdatedAt    | DateTime | Last update date       |

---

## Role

| Attribute | Type   | Description            |
| --------- | ------ | ---------------------- |
| RoleId    | UUID   | Unique role identifier |
| RoleName  | String | Role name              |

### Values

* Manager
* Customer

---

## Property

| Attribute    | Type     | Description                |
| ------------ | -------- | -------------------------- |
| PropertyId   | UUID     | Unique property identifier |
| ManagerId    | UUID     | Property manager           |
| PropertyName | String   | Property name              |
| Address      | String   | Property address           |
| Description  | Text     | Property description       |
| Status       | Enum     | Property status            |
| CreatedAt    | DateTime | Creation date              |

---

## Floor

| Attribute   | Type     | Description            |
| ----------- | -------- | ---------------------- |
| FloorId     | UUID     | Floor identifier       |
| PropertyId  | UUID     | Related property       |
| FloorNumber | Integer  | Floor number           |
| Description | Text     | Floor description      |
| CreatedAt   | DateTime | Creation date          |

---

## Room

| Attribute     | Type    | Description            |
| ------------- | ------- | ---------------------- |
| RoomId        | UUID    | Unique room identifier |
| PropertyId    | UUID    | Related property       |
| FloorId       | UUID    | Related floor          |
| RoomNumber    | String  | Room number            |
| RoomType      | String  | Room category          |
| Area          | Decimal | Room area              |
| PricePerNight | Decimal | Price per night        |
| Capacity      | Integer | Maximum occupancy      |
| Status        | Enum    | Room status            |
| Description   | Text    | Room description       |

### Values

* Available
* Pending Deposit
* Reserved
* Occupied
* Maintenance

---

## RoomImage

| Attribute | Type    | Description      |
| --------- | ------- | ---------------- |
| ImageId   | UUID    | Image identifier |
| RoomId    | UUID    | Related room     |
| ImageUrl  | String  | Image URL        |
| IsPrimary | Boolean | Main image       |

---

## Booking

| Attribute      | Type     | Description           |
| -------------- | -------- | --------------------- |
| BookingId      | UUID     | Booking identifier    |
| CustomerId     | UUID     | Customer              |
| RoomId         | UUID     | Booked room           |
| CheckInDate    | Date     | Check-in date         |
| CheckOutDate   | Date     | Check-out date        |
| GuestCount     | Integer  | Number of guests      |
| TotalAmount    | Decimal  | Total booking amount  |
| DepositAmount  | Decimal  | Deposit amount (40%)  |
| SpecialRequests| Text     | Special requests note |
| Status         | Enum     | Booking status        |
| CreatedAt      | DateTime | Submission date       |

### Values

* Pending Deposit
* Confirmed
* Checked-in
* Checked-out
* Cancelled

---

## Contract

| Attribute      | Type    | Description                    |
| -------------- | ------- | ------------------------------ |
| ContractId     | UUID    | Contract identifier            |
| BookingId      | UUID    | Related booking                |
| CustomerId     | UUID    | Customer                       |
| RoomId         | UUID    | Room                           |
| CheckInDate    | Date    | Check-in date                  |
| CheckOutDate   | Date    | Check-out date                 |
| DepositAmount  | Decimal | Deposit amount (40%)           |
| TotalAmount    | Decimal | Total accommodation amount     |
| PdfUrl         | String  | Generated contract PDF URL     |
| EmailSentAt    | DateTime| Contract email sent timestamp  |
| Status         | Enum    | Contract status                |

### Values

* Active
* Completed
* Cancelled

---

## Payment

| Attribute     | Type     | Description                       |
| ------------- | -------- | --------------------------------- |
| PaymentId     | UUID     | Payment identifier                |
| BookingId     | UUID     | Related booking                   |
| PaymentType   | Enum     | Deposit / Remaining Balance       |
| Amount        | Decimal  | Paid amount                       |
| PaymentMethod | Enum     | Payment method                    |
| PaymentDate   | DateTime | Payment date                      |
| Status        | Enum     | Payment status                    |

### Payment Types

* Deposit Payment (40%)
* Remaining Balance Payment (60%)

### Payment Methods

* Bank Transfer
* Cash
* E-Wallet

### Payment Statuses

* Pending
* Paid
* Failed

---

## PaymentReceipt

| Attribute  | Type     | Description        |
| ---------- | -------- | ------------------ |
| ReceiptId  | UUID     | Receipt identifier |
| PaymentId  | UUID     | Related payment    |
| FileUrl    | String   | Receipt image/file |
| UploadedAt | DateTime | Upload date        |

---

## MaintenanceTicket

| Attribute   | Type     | Description       |
| ----------- | -------- | ----------------- |
| TicketId    | UUID     | Ticket identifier |
| CustomerId  | UUID     | Request owner     |
| RoomId      | UUID     | Related room      |
| Title       | String   | Issue title       |
| Description | Text     | Issue description |
| Status      | Enum     | Ticket status     |
| CreatedAt   | DateTime | Creation date     |

### Values

* Open
* In Progress
* Resolved
* Closed

---

## Review

| Attribute  | Type     | Description        |
| ---------- | -------- | ------------------ |
| ReviewId   | UUID     | Review identifier  |
| CustomerId | UUID     | Reviewer           |
| BookingId  | UUID     | Related booking    |
| RoomId     | UUID     | Reviewed room      |
| Rating     | Integer  | Rating score (1–5) |
| Comment    | Text     | Review content     |
| CreatedAt  | DateTime | Review date        |

---

## Notification

| Attribute      | Type     | Description             |
| -------------- | -------- | ----------------------- |
| NotificationId | UUID     | Notification identifier |
| UserId         | UUID     | Receiver                |
| Title          | String   | Notification title      |
| Content        | Text     | Notification content    |
| IsRead         | Boolean  | Read status             |
| CreatedAt      | DateTime | Creation date           |

---

## Complaint

| Attribute   | Type     | Description          |
| ----------- | -------- | -------------------- |
| ComplaintId | UUID     | Complaint identifier |
| UserId      | UUID     | Submitter            |
| Subject     | String   | Complaint title      |
| Description | Text     | Complaint details    |
| Status      | Enum     | Complaint status     |
| CreatedAt   | DateTime | Creation date        |

---

## ActivityLog

| Attribute  | Type     | Description      |
| ---------- | -------- | ---------------- |
| LogId      | UUID     | Log identifier   |
| UserId     | UUID     | Related user     |
| Action     | String   | Performed action |
| EntityName | String   | Entity affected  |
| EntityId   | UUID     | Related entity   |
| CreatedAt  | DateTime | Action timestamp |


## 6. Error Handling

### Authentication Errors

* Invalid email or password.
* Account not verified.
* Account suspended.
* OTP expired.
* OTP invalid.

### Validation Errors

* Required field missing.
* Invalid email format.
* Invalid phone number.
* Invalid date range.
* Check-in date must be before check-out date.
* Selected dates are not available.

### Business Errors

* Room is not available for selected dates.
* Booking already confirmed.
* Deposit payment already completed.
* Duplicate booking for same room and date range.
* Contract already generated.
* Booking cannot be cancelled after check-in has started.
* Deposit is non-refundable upon cancellation after deposit payment.
* Review can only be submitted after Booking status is Checked-out.
* Booking already reviewed.

### System Errors

* Database connection failure.
* File upload failure.
* PDF generation failure.
* Email sending failure.
* Payment processing failure.
* Unexpected server error.

### Error Response

* Display user-friendly messages.
* Log technical errors for administrators.
* Prevent system crash.

---

## 7. Acceptance Criteria

### User Management

* Users can register and verify accounts successfully.
* Users can login and logout successfully.

### Room Management

* Managers can create and update rooms with correct Floor hierarchy.
* Guests can search and view rooms successfully.
* Availability Calendar displays correct room statuses.

### Booking Process

* Customers can submit bookings with check-in/check-out dates and guest count.
* System validates room availability before confirming booking.
* Customers can pay deposit (40%) successfully.
* Upon successful deposit: Booking status changes to Confirmed, Accommodation Contract PDF is generated and emailed.

### Contract Management

* Accommodation Contracts are generated automatically after deposit payment.
* Contracts can be viewed, downloaded as PDF, printed, and resent via email.

### Payment

* Deposit payments and remaining balance payments are recorded correctly.
* Payment status is tracked and updated accurately.

### Structure Management

* Managers can manage Property → Floor → Room hierarchy.
* Property Selector and Structure Tree View work correctly.

### Maintenance

* Maintenance requests can be created and tracked.

### Reporting

* Dashboard displays correct KPIs: Total Properties, Total Floors, Total Rooms, Available Rooms, Occupied Rooms, Upcoming Check-ins, Upcoming Check-outs, Monthly Revenue.
* Reports display accurate Occupancy Rate, Booking Trend, and Revenue Trend.

### Administration

* Manager can manage users and complaints.
* System settings can be configured.

---

## 8. Out of Scope

Các chức năng sau không nằm trong phạm vi của phiên bản hiện tại:

* Tích hợp chữ ký số cho hợp đồng.
* Tích hợp cổng thanh toán quốc tế.
* Ứng dụng mobile native (Android/iOS).
* AI đề xuất phòng homestay/resort.
* Chat trực tiếp giữa Customer và Manager.
* Tích hợp bản đồ thời gian thực.
* Hệ thống kế toán doanh nghiệp.
* Hỗ trợ đa ngôn ngữ.
* Hệ thống marketing và quảng cáo.
* Quản lý nhiều chi nhánh doanh nghiệp lớn.
