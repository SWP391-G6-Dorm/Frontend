# Dormitory Management System Specification

## 1. Overview

### 1.1 Purpose

Hệ thống quản lý ký túc xá hỗ trợ:

- Quản lý sinh viên
- Đăng ký và quản lý phòng ở
- Quản lý hóa đơn và thanh toán
- Quản lý campus/ký túc xá/phòng
- Quản lý hỗ trợ và thông báo
- Thống kê và audit log

---

## 2. User Roles

| Role | Description |
|---|---|
| Student | Sinh viên sử dụng hệ thống |
| Staff | Nhân viên quản lý campus |
| Admin | Quản trị toàn hệ thống |

---

# 3. Functional Specifications

---

# FE01 - Login System

## Description
Đăng nhập hệ thống bằng Google OAuth.

## Actors
- Student
- Staff
- Admin

## Functional Requirements
- Cho phép đăng nhập bằng Google OAuth2.
- Xác thực email tồn tại trong hệ thống.
- Tạo JWT token sau khi login thành công.
- Điều hướng theo role người dùng.

## Business Rules
- Chỉ email đã được cấp quyền mới đăng nhập được.
- Session/token có thời gian hết hạn.

---

# FE02 - View & Update Profile

## Description
Xem và cập nhật thông tin cá nhân.

## Functional Requirements
- Xem thông tin profile.
- Cập nhật:
  - Full name
  - Phone number
  - Gender
  - Date of birth
  - Address
  - Avatar

## Business Rules
- Student ID không được chỉnh sửa.
- Email không được chỉnh sửa.
- Phone number phải unique.

---

# FE03 - Room Registration

## Description
Đăng ký phòng ở cho kỳ học.

## Functional Requirements
- Chọn semester.
- Chọn campus.
- Chọn dormitory.
- Chọn phòng còn chỗ.
- Gửi yêu cầu đăng ký.

## Registration Status
- Pending
- Approved
- Rejected
- Cancelled

## Business Rules
- Một sinh viên chỉ được có một đăng ký active trong một semester.
- Không được đăng ký phòng full.
- Chỉ đăng ký trong thời gian mở.

---

# FE04 - View Registration History

## Description
Xem lịch sử đăng ký phòng.

## Functional Requirements
- Hiển thị:
  - Semester
  - Room
  - Status
  - Created date
  - Approved date

---

# FE05 - Cancel Room Registration

## Description
Hủy yêu cầu đăng ký phòng.

## Functional Requirements
- Hủy request đang pending.

## Business Rules
- Chỉ được hủy khi status = Pending.

---

# FE06 - Extend Room Stay

## Description
Gia hạn phòng ở cho semester tiếp theo.

## Functional Requirements
- Gửi yêu cầu gia hạn.
- Chọn semester tiếp theo.

## Business Rules
- Chỉ sinh viên đang ở phòng mới được gia hạn.
- Không được gia hạn nếu còn hóa đơn unpaid.

---

# FE07 - View Current Room Information

## Description
Xem thông tin phòng hiện tại.

## Functional Requirements
Hiển thị:
- Room number
- Dormitory
- Campus
- Capacity
- Current occupants
- Check-in date
- Expired date

---

# FE08 - View & Pay Invoice

## Description
Xem hóa đơn và thanh toán qua VNPay.

## Functional Requirements
- Xem danh sách hóa đơn.
- Xem chi tiết hóa đơn.
- Thanh toán qua VNPay.
- Nhận callback từ VNPay.

## Invoice Status
- Unpaid
- Paid
- Expired

## Business Rules
- Chỉ hóa đơn unpaid mới được thanh toán.

---

# FE09 - Submit Support Request

## Description
Gửi yêu cầu hỗ trợ.

## Categories
- Room issue
- Payment issue
- Technical issue
- Other

## Ticket Status
- Open
- In Progress
- Resolved
- Closed

---

# FE10 - View Notifications

## Description
Xem thông báo từ hệ thống.

## Functional Requirements
- Hiển thị danh sách thông báo.
- Xem chi tiết thông báo.

---

# FE11 - Manage Students In Campus

## Description
Quản lý sinh viên trong campus được phân quyền.

## Actors
- Staff

## Functional Requirements
- Xem danh sách sinh viên.
- Xem chi tiết sinh viên.
- Tìm kiếm sinh viên.
- Filter theo:
  - Semester
  - Room
  - Status

---

# FE12 - Handle Support Requests

## Description
Xử lý yêu cầu hỗ trợ.

## Actors
- Staff

## Functional Requirements
- Xem ticket.
- Trả lời ticket.
- Cập nhật trạng thái ticket.

---

# FE13 - Campus Revenue Statistics

## Description
Xem thống kê doanh thu campus.

## Actors
- Staff

## Functional Requirements
Hiển thị:
- Total revenue
- Paid invoices
- Unpaid invoices
- Revenue by semester

---

# FE14 - Manage Campus Accounts

## Description
Quản lý tài khoản trong campus.

## Actors
- Staff

## Functional Requirements
- Xem danh sách account.
- Activate/deactivate account.
- Xem profile account.

---

# FE15 - Payment History

## Description
Xem lịch sử thanh toán.

## Functional Requirements
Hiển thị:
- Invoice ID
- Amount
- Payment date
- Payment method
- Transaction code

---

# FE16 - Manage Campus/Dormitory/Room

## Description
Quản lý campus, dormitory, room.

## Actors
- Admin

## Functional Requirements

### Campus
- Create campus
- Update campus
- Delete campus

### Dormitory
- Create dormitory
- Update dormitory
- Delete dormitory

### Room
- Create room
- Update room
- Delete room

## Room Fields
- Room code
- Capacity
- Gender type
- Price

---

# FE17 - Manage System Accounts

## Description
Quản lý tài khoản toàn hệ thống.

## Actors
- Admin

## Functional Requirements
- CRUD Student account
- CRUD Staff account
- CRUD Admin account
- Assign roles

---

# FE18 - Create New Student

## Description
Tạo tài khoản sinh viên mới.

## Actors
- Admin
- Staff

## Required Fields
- Student ID
- Full name
- Email
- Campus

## Business Rules
- Student ID unique.
- Email unique.

---

# FE19 - Import Students From Excel

## Description
Import danh sách sinh viên từ file Excel.

## Actors
- Admin
- Staff

## File Format
- .xlsx

## Validation Rules
- Duplicate Student ID
- Invalid email
- Missing required fields

## Import Result
- Success count
- Failed rows

---

# FE20 - Manage Semester

## Description
Quản lý kỳ học.

## Actors
- Admin

## Functional Requirements
- Create semester
- Update semester
- Delete semester
- Open registration
- Close registration

## Semester Fields
- Semester code
- Start date
- End date

---

# FE21 - Send Notifications

## Description
Gửi thông báo hệ thống.

## Actors
- Admin
- Staff

## Notification Targets
- All users
- Campus users
- Individual users

## Notification Fields
- Title
- Content
- Priority

---

# FE22 - View Audit Log

## Description
Xem lịch sử thao tác hệ thống.

## Actors
- Admin

## Audit Log Fields
- User
- Action
- Entity
- Old value
- New value
- Timestamp
- IP address

---

# FE23 - View System Statistics

## Description
Xem thống kê toàn hệ thống.

## Actors
- Admin

## Functional Requirements
Hiển thị:
- Total students
- Occupancy rate
- Total revenue
- Total campuses
- Room usage statistics

---

# FE24 - Approve Room Registration

## Description
Phê duyệt đăng ký phòng.

## Actors
- Staff

## Functional Requirements
- Approve registration
- Reject registration

## Business Rules
- Không approve nếu phòng full.
- Approve sẽ tạo room assignment.

## Registration Status
- Pending
- Approved
- Rejected

---

# FE25 - View Received Notifications

## Description
Xem thông báo nhận được.

## Actors
- All users

## Functional Requirements
- View notification list
- Mark as read
- Filter notifications
- View notification detail

---

# 4. Non-functional Requirements

## Performance
- API response time < 2 seconds
- Support at least 1000 concurrent users

## Security
- OAuth2 authentication
- JWT authorization
- Role-based access control (RBAC)

## Availability
- System uptime >= 99.5%

## Audit
- Log all important actions

---

# 5. Suggested Database Entities

- User
- Role
- Student
- Campus
- Dormitory
- Room
- Semester
- RoomRegistration
- RoomAssignment
- Invoice
- Payment
- SupportTicket
- Notification
- AuditLog

---

# 6. Suggested API Modules

- /auth
- /users
- /students
- /campuses
- /dormitories
- /rooms
- /semesters
- /registrations
- /payments
- /invoices
- /support-tickets
- /notifications
- /audit-logs
- /statistics

---

# 7. Suggested Tech Stack

## Frontend
- React / Next.js

## Backend
- ASP.NET Core / Node.js / Spring Boot

## Database
- PostgreSQL / SQL Server

## Authentication
- Google OAuth2 + JWT

## Payment
- VNPay

---

# 8. Suggested Architecture

```text
Frontend (React/Next.js)
        ↓
Backend API
        ↓
Service Layer
        ↓
Database
```

---

# 9. Future Enhancements

- Mobile application
- Email notifications
- Push notifications
- QR check-in/check-out
- AI room recommendation
- Real-time chat support
