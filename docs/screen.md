# 📋 Screen Catalog
## Homestay / Resort Booking Management System

---

## 🗂️ Overview

| #  | Role     | Screen Range     | Total |
|----|----------|------------------|-------|
| 1  | Guest    | SCR-01 – SCR-10  | 10    |
| 2  | Shared   | SCR-11 – SCR-15  | 5     |
| 3  | Customer | SCR-16 – SCR-31  | 16    |
| 4  | Manager  | SCR-32 – SCR-60  | 29    |
| 5  | Admin    | SCR-61 – SCR-80  | 20    |
| 6  | Employee | SCR-81 – SCR-91  | 11    |
|    | **Total**  |                | **91** |

---

## 🌐 Section 1 — Guest / Public Screens

> Màn hình dành cho người dùng chưa đăng nhập.

| Screen ID | Screen Name              | Actor           | Purpose                                                      |
|-----------|--------------------------|-----------------|--------------------------------------------------------------|
| SCR-01    | Landing / Home Page      | Guest           | Trang chủ, giới thiệu hệ thống và phòng nổi bật             |
| SCR-02    | Login                    | Guest           | Đăng nhập bằng email + password                             |
| SCR-03    | Register                 | Guest           | Đăng ký tài khoản mới                                       |
| SCR-04    | OTP / Email Verification | Guest           | Xác thực tài khoản bằng OTP gửi qua email                  |
| SCR-05    | Forgot Password          | Guest           | Yêu cầu đặt lại mật khẩu qua email                         |
| SCR-06    | Reset Password           | Guest           | Tạo mật khẩu mới sau khi xác nhận link reset               |
| SCR-07    | Room Listing             | Guest, Customer | Xem danh sách tất cả phòng theo từng property               |
| SCR-08    | Room Detail              | Guest, Customer | Xem chi tiết phòng: gallery, tiện ích, lịch trống           |
| SCR-09    | Search Results           | Guest, Customer | Kết quả tìm kiếm theo địa điểm, loại phòng, ngày, số khách |
| SCR-10    | Availability Calendar    | Guest, Customer | Lịch trống theo ngày của từng phòng                         |

---

## 👤 Section 2 — Shared Screens (All Authenticated Users)

> Màn hình dùng chung cho tất cả người dùng đã đăng nhập.

| Screen ID | Screen Name         | Actor                              | Purpose                                 |
|-----------|---------------------|------------------------------------|-----------------------------------------|
| SCR-11    | User Profile        | Customer, Employee, Manager, Admin | Xem thông tin hồ sơ cá nhân            |
| SCR-12    | Edit Profile        | Customer, Employee, Manager, Admin | Cập nhật hồ sơ và thông tin liên hệ    |
| SCR-13    | Change Password     | Customer, Employee, Manager, Admin | Đổi mật khẩu tài khoản                 |
| SCR-14    | Notification Center | Customer, Employee, Manager, Admin | Xem danh sách thông báo                 |
| SCR-15    | Notification Detail | Customer, Employee, Manager, Admin | Xem nội dung chi tiết của thông báo    |

---

## 🛎️ Section 3 — Customer Screens

> Màn hình dành cho khách đã đăng nhập và đặt phòng.

### 3.1 Booking

| Screen ID | Screen Name          | Purpose                                               |
|-----------|----------------------|-------------------------------------------------------|
| SCR-16    | Customer Dashboard   | Tổng quan đặt phòng, check-in/out sắp tới            |
| SCR-17    | Booking Form         | Gửi yêu cầu đặt phòng mới (ngày, số khách)          |
| SCR-18    | Booking List         | Xem toàn bộ lịch sử đặt phòng và trạng thái         |
| SCR-19    | Booking Detail       | Xem chi tiết booking và thực hiện các thao tác       |
| SCR-20    | Booking Cancellation | Huỷ booking trước khi check-in                       |

### 3.2 Payment

| Screen ID | Screen Name               | Purpose                                              |
|-----------|---------------------------|------------------------------------------------------|
| SCR-21    | Deposit Payment           | Thanh toán đặt cọc 40% để xác nhận booking          |
| SCR-22    | Remaining Balance Payment | Thanh toán phần còn lại 60% trước/khi check-in      |
| SCR-23    | Payment History           | Xem lịch sử và trạng thái tất cả giao dịch          |
| SCR-24    | Receipt Upload            | Tải lên biên lai chuyển khoản hoặc ví điện tử       |

### 3.3 Contract

| Screen ID | Screen Name      | Purpose                                            |
|-----------|------------------|-----------------------------------------------------|
| SCR-25    | My Contract List | Xem danh sách hợp đồng đặt phòng                  |
| SCR-26    | Contract Detail  | Xem chi tiết hợp đồng, tải xuống và in PDF        |

### 3.4 Maintenance

| Screen ID | Screen Name               | Purpose                                        |
|-----------|---------------------------|------------------------------------------------|
| SCR-27    | Maintenance Ticket List   | Xem danh sách yêu cầu bảo trì đã gửi          |
| SCR-28    | Create Maintenance Ticket | Gửi yêu cầu bảo trì phòng mới                 |
| SCR-29    | Maintenance Ticket Detail | Xem chi tiết ticket và tiến độ xử lý           |

### 3.5 Review & Rating

| Screen ID | Screen Name     | Purpose                                                        |
|-----------|-----------------|----------------------------------------------------------------|
| SCR-30    | Review & Rating | Đánh giá phòng sau check-out (chỉ khi Booking = Checked-out) |
| SCR-31    | My Reviews      | Xem, chỉnh sửa hoặc xóa các đánh giá đã gửi                 |

---

## 🏢 Section 4 — Manager Screens

> Màn hình dành cho Manager — chỉ truy cập Property được gán.

### 4.1 Dashboard

| Screen ID | Screen Name       | Purpose                                                                            |
|-----------|-------------------|------------------------------------------------------------------------------------|
| SCR-32    | Manager Dashboard | KPIs Property được gán: phòng, booking, check-in/out sắp tới, doanh thu tháng    |

### 4.2 Structure Management

| Screen ID | Screen Name         | Purpose                                         |
|-----------|---------------------|-------------------------------------------------|
| SCR-33    | Structure Tree View | Xem phân cấp Property → Floor → Room (Property được gán) |
| SCR-34    | Floor Management    | Thêm, sửa, xóa tầng trong Property được gán    |

### 4.3 Room Management

| Screen ID | Screen Name             | Purpose                                          |
|-----------|-------------------------|--------------------------------------------------|
| SCR-35    | Room List               | Xem và lọc danh sách phòng (chỉ Property được gán) |
| SCR-36    | Room Detail Management  | Xem thông tin chi tiết phòng                     |
| SCR-37    | Add Room                | Tạo phòng mới thuộc Property/Floor được gán      |
| SCR-38    | Edit Room               | Cập nhật thông tin, giá và trạng thái phòng      |
| SCR-39    | Room Gallery Management | Tải lên và quản lý hình ảnh phòng               |
| SCR-40    | Room Status Management  | Cập nhật thủ công trạng thái phòng               |

### 4.4 Booking Management

| Screen ID | Screen Name    | Purpose                                          |
|-----------|----------------|--------------------------------------------------|
| SCR-41    | Booking List   | Xem và quản lý booking trong Property được gán   |
| SCR-42    | Booking Detail | Xem chi tiết booking, check-in/out, trạng thái inspection |

### 4.5 Payment Management

| Screen ID | Screen Name          | Purpose                                          |
|-----------|----------------------|--------------------------------------------------|
| SCR-43    | Payment List         | Xem tất cả giao dịch (đặt cọc + còn lại + damage fee) |
| SCR-44    | Payment Verification | Xem biên lai đã tải lên và xác nhận thanh toán  |
| SCR-45    | Payment Detail       | Xem thông tin thanh toán và lịch sử giao dịch   |

### 4.6 Contract Management

| Screen ID | Screen Name                | Purpose                                          |
|-----------|----------------------------|--------------------------------------------------|
| SCR-46    | Contract List              | Xem và quản lý hợp đồng trong Property được gán |
| SCR-47    | Contract Detail Management | Xem hợp đồng, tải xuống và in PDF               |
| SCR-48    | Resend Contract Email      | Gửi lại hợp đồng PDF qua email cho khách        |

### 4.7 Employee Management

| Screen ID | Screen Name            | Purpose                                          |
|-----------|------------------------|--------------------------------------------------|
| SCR-49    | Employee List          | Xem danh sách Employee trong Property được gán   |
| SCR-50    | Employee Assignment    | Gán Employee vào Property                        |

### 4.8 Housekeeping Management

| Screen ID | Screen Name              | Purpose                                          |
|-----------|--------------------------|--------------------------------------------------|
| SCR-51    | Housekeeping Task List   | Xem danh sách tác vụ dọn phòng trong Property    |
| SCR-52    | Housekeeping Task Detail | Xem chi tiết tác vụ, gán Employee dọn phòng     |

### 4.9 Maintenance Management

| Screen ID | Screen Name               | Purpose                                      |
|-----------|---------------------------|----------------------------------------------|
| SCR-53    | Maintenance Ticket List   | Xem và quản lý ticket bảo trì trong Property |
| SCR-54    | Maintenance Ticket Detail | Xem chi tiết, gán Employee, xác nhận hoàn thành |

### 4.10 Room Inspection & Damage

| Screen ID | Screen Name            | Purpose                                          |
|-----------|------------------------|--------------------------------------------------|
| SCR-55    | Inspection List        | Xem danh sách Room Inspection trong Property     |
| SCR-56    | Inspection Detail      | Xem kết quả kiểm tra phòng                      |
| SCR-57    | Damage Report Detail   | Xem chi tiết hư hại và phê duyệt bồi thường    |

### 4.11 Reporting & Statistics

| Screen ID | Screen Name          | Purpose                                         |
|-----------|----------------------|-------------------------------------------------|
| SCR-58    | Revenue Report       | Doanh thu theo Property được gán, tháng, năm    |
| SCR-59    | Occupancy Report     | Tỷ lệ lấp đầy theo Property được gán           |
| SCR-60    | Booking Trend Report | Xu hướng đặt phòng trong Property được gán      |

---

## 🔑 Section 5 — Admin Screens

> Màn hình dành cho Admin — quản trị toàn hệ thống.

### 5.1 Dashboard

| Screen ID | Screen Name     | Purpose                                                                  |
|-----------|-----------------|--------------------------------------------------------------------------|
| SCR-61    | Admin Dashboard | KPIs toàn hệ thống: tổng property, phòng, booking, doanh thu tháng     |

### 5.2 Property Management

| Screen ID | Screen Name          | Purpose                                          |
|-----------|----------------------|--------------------------------------------------|
| SCR-62    | Property List        | Xem và quản lý tất cả Property                  |
| SCR-63    | Property Detail      | Xem thông tin chi tiết Property                  |
| SCR-64    | Add / Edit Property  | Tạo hoặc cập nhật Property                      |
| SCR-65    | Manager Assignment   | Gán Manager vào Property (ManagerPropertyAssignment) |

### 5.3 Manager Management

| Screen ID | Screen Name    | Purpose                                          |
|-----------|----------------|--------------------------------------------------|
| SCR-66    | Manager List   | Xem và quản lý tất cả tài khoản Manager         |
| SCR-67    | Manager Detail | Xem hồ sơ, danh sách Property được gán          |

### 5.4 Customer Management

| Screen ID | Screen Name     | Purpose                                         |
|-----------|-----------------|-------------------------------------------------|
| SCR-68    | Customer List   | Xem và quản lý tài khoản khách hàng             |
| SCR-69    | Customer Detail | Xem hồ sơ và lịch sử đặt phòng của khách       |

### 5.5 Complaint Management

| Screen ID | Screen Name      | Purpose                                      |
|-----------|------------------|----------------------------------------------|
| SCR-70    | Complaint List   | Xem và quản lý tất cả khiếu nại              |
| SCR-71    | Complaint Detail | Xem chi tiết và cập nhật kết quả xử lý       |

### 5.6 Reporting & Statistics

| Screen ID | Screen Name          | Purpose                                         |
|-----------|----------------------|-------------------------------------------------|
| SCR-72    | Revenue Report       | Doanh thu toàn hệ thống theo property, tháng, năm |
| SCR-73    | Occupancy Report     | Tỷ lệ lấp đầy toàn hệ thống                   |
| SCR-74    | Booking Trend Report | Xu hướng đặt phòng toàn hệ thống              |
| SCR-75    | Revenue Trend Report | Phân tích xu hướng doanh thu toàn hệ thống     |

### 5.7 Administration

| Screen ID | Screen Name        | Purpose                                          |
|-----------|--------------------|--------------------------------------------------|
| SCR-76    | Activity Logs      | Theo dõi hoạt động người dùng và audit trail    |
| SCR-77    | System Settings    | Cấu hình hệ thống (% đặt cọc, banking info)    |
| SCR-78    | Content Moderation | Kiểm duyệt nội dung (Reviews)                   |

### 5.8 Promotion Management

| Screen ID | Screen Name     | Purpose                                          |
|-----------|-----------------|--------------------------------------------------|
| SCR-79    | Promotion List  | Xem và quản lý danh sách banner khuyến mãi      |
| SCR-80    | Add / Edit Promotion | Tạo hoặc cập nhật banner khuyến mãi          |

---

## 👷 Section 6 — Employee Screens

> Màn hình dành cho Employee — chỉ truy cập Property được gán và tác vụ được gán.

### 6.1 Dashboard

| Screen ID | Screen Name        | Purpose                                                        |
|-----------|--------------------|----------------------------------------------------------------|
| SCR-81    | Employee Dashboard | Tổng quan tác vụ: Housekeeping, Maintenance, Room Inspection  |

### 6.2 Housekeeping

| Screen ID | Screen Name              | Purpose                                          |
|-----------|--------------------------|--------------------------------------------------|
| SCR-82    | My Housekeeping Tasks    | Xem danh sách tác vụ dọn phòng được gán         |
| SCR-83    | Housekeeping Task Detail | Xem chi tiết và cập nhật trạng thái dọn phòng   |

### 6.3 Maintenance

| Screen ID | Screen Name               | Purpose                                          |
|-----------|---------------------------|--------------------------------------------------|
| SCR-84    | My Maintenance Tasks      | Xem danh sách tác vụ bảo trì được gán           |
| SCR-85    | Maintenance Task Detail   | Xem chi tiết và cập nhật trạng thái bảo trì     |

### 6.4 Room Inspection

| Screen ID | Screen Name              | Purpose                                          |
|-----------|--------------------------|--------------------------------------------------|
| SCR-86    | My Inspections           | Xem danh sách Room Inspection được gán           |
| SCR-87    | Inspection Form          | Thực hiện kiểm tra phòng trước check-out         |
| SCR-88    | Inspection Result        | Xem kết quả kiểm tra phòng (PASSED / FAILED)    |

### 6.5 Damage Report

| Screen ID | Screen Name         | Purpose                                          |
|-----------|---------------------|--------------------------------------------------|
| SCR-89    | Create Damage Report | Ghi nhận hạng mục hư hại, chụp ảnh, ước tính chi phí |
| SCR-90    | Damage Report Detail | Xem chi tiết Damage Report đã tạo               |

### 6.6 Room List

| Screen ID | Screen Name | Purpose                                          |
|-----------|-------------|--------------------------------------------------|
| SCR-91    | Room List   | Xem danh sách phòng trong Property được gán      |
