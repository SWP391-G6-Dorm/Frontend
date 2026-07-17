package com.homestay.service;

import com.homestay.dto.request.ManagerCheckInRequest;
import com.homestay.dto.request.ManagerCheckOutRequest;
import com.homestay.dto.response.BookingDetailResponse;
import com.homestay.dto.response.BookingSummaryResponse;
import com.homestay.dto.response.CancellationPreviewResponse;
import com.homestay.dto.response.ManagerBookingDetailResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.Booking;
import com.homestay.entity.BookingCheckVerification;
import com.homestay.entity.Payment;
import com.homestay.entity.Property;
import com.homestay.entity.Room;
import com.homestay.entity.RoomInspection;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ConflictException;
import com.homestay.exception.ForbiddenException;
import com.homestay.repository.BookingCheckVerificationRepository;
import com.homestay.repository.BookingRepository;
import com.homestay.repository.ManagerPropertyAssignmentRepository;
import com.homestay.repository.PaymentRepository;
import com.homestay.repository.RoomInspectionRepository;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private static final java.util.Set<Room.Status> BOOKING_BLOCKED_ROOM_STATUSES = java.util.Set.of(
            Room.Status.MAINTENANCE,
            Room.Status.OUT_OF_SERVICE,
            Room.Status.PENDING_CLEANING,
            Room.Status.CLEANING_IN_PROGRESS
    );

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final com.homestay.repository.RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final com.homestay.repository.ReviewRepository reviewRepository;
    private final ReportPropertyScopeValidator scopeValidator;
    private final ManagerPropertyAssignmentRepository assignmentRepository;
    private final RoomInspectionRepository roomInspectionRepository;
    private final BookingCheckVerificationRepository checkVerificationRepository;
    private final HousekeepingTaskService housekeepingTaskService;
    private final long holdTimeoutMinutes;

    private static final long MAX_ID_DOC_BYTES = 5L * 1024 * 1024;

    public BookingService(BookingRepository bookingRepository,
                          NotificationService notificationService,
                          com.homestay.repository.RoomRepository roomRepository,
                          PaymentRepository paymentRepository,
                          com.homestay.repository.ReviewRepository reviewRepository,
                          ReportPropertyScopeValidator scopeValidator,
                          ManagerPropertyAssignmentRepository assignmentRepository,
                          RoomInspectionRepository roomInspectionRepository,
                          BookingCheckVerificationRepository checkVerificationRepository,
                          HousekeepingTaskService housekeepingTaskService,
                          @org.springframework.beans.factory.annotation.Value("${app.booking.hold-timeout-minutes:10}") long holdTimeoutMinutes) {
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
        this.roomRepository = roomRepository;
        this.paymentRepository = paymentRepository;
        this.reviewRepository = reviewRepository;
        this.scopeValidator = scopeValidator;
        this.assignmentRepository = assignmentRepository;
        this.roomInspectionRepository = roomInspectionRepository;
        this.checkVerificationRepository = checkVerificationRepository;
        this.housekeepingTaskService = housekeepingTaskService;
        this.holdTimeoutMinutes = holdTimeoutMinutes > 0 ? holdTimeoutMinutes : 10;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public PageResponse<BookingSummaryResponse> getMyBookings(
            User currentUser,
            int page,
            int size,
            String status,
            String sort
    ) {
        if (currentUser.getRole() != User.Role.CUSTOMER) {
            throw new ForbiddenException("Chỉ khách hàng mới có danh sách đặt phòng");
        }

        Pageable pageable = buildPageable(page, size, sort);
        Page<Booking> result;

        if (status != null && !status.isBlank()) {
            Booking.Status bookingStatus = Booking.Status.valueOf(status.trim().toUpperCase());
            result = bookingRepository.findByCustomerIdAndStatus(
                    currentUser.getId(), bookingStatus, pageable);
        } else {
            result = bookingRepository.findByCustomerId(currentUser.getId(), pageable);
        }

        return new PageResponse<>(
                result.getContent().stream().map(booking -> {
                    boolean isReviewed = reviewRepository.existsByBooking_Id(booking.getId());
                    return BookingSummaryResponse.fromEntity(booking, isReviewed);
                }).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    public static Pageable buildPageable(int page, int size, String sort) {
        if (sort == null || sort.isBlank()) {
            return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        List<String> allowed = Arrays.asList("createdAt", "checkInDate", "totalAmount", "status");
        if (!allowed.contains(field)) {
            field = "createdAt";
        }
        return PageRequest.of(page, size, Sort.by(direction, field));
    }
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public PageResponse<BookingSummaryResponse> getAllBookings(
            int page,
            int size,
            String status,
            String search,
            String sort
    ) {
        Pageable pageable = buildPageable(page, size, sort);
        Booking.Status bookingStatus = (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL"))
                ? Booking.Status.valueOf(status.trim().toUpperCase()) : null;

        Page<Booking> result = bookingRepository.findAllWithFilters(bookingStatus, search, pageable);

        return new PageResponse<>(
                result.getContent().stream().map(booking -> {
                    boolean isReviewed = reviewRepository.existsByBooking_Id(booking.getId());
                    return BookingSummaryResponse.fromEntity(booking, isReviewed);
                }).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    /** SCR-34 — Manager booking list scoped to assigned properties (v1). */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public PageResponse<BookingSummaryResponse> getBookingsForManagerScoped(
            User manager,
            String propertyIdStr,
            String status,
            String search,
            LocalDate checkInFrom,
            LocalDate checkInTo,
            int page,
            int size,
            String sort
    ) {
        Pageable pageable = (sort == null || sort.isBlank())
                ? PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkInDate"))
                : buildPageable(page, size, sort);

        List<UUID> propertyIds;
        if (propertyIdStr != null && !propertyIdStr.isBlank()) {
            UUID propertyId = UUID.fromString(propertyIdStr.trim());
            scopeValidator.validateManagerAccess(manager, propertyId);
            propertyIds = List.of(propertyId);
        } else {
            propertyIds = assignmentRepository.findActivePropertiesByManagerId(manager.getId())
                    .stream()
                    .map(Property::getId)
                    .toList();
        }

        if (propertyIds.isEmpty()) {
            return new PageResponse<>(List.of(), page, size, 0, 0);
        }

        Booking.Status bookingStatus = parseBookingStatus(status);
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Booking> result = bookingRepository.findForManagerWithFilters(
                propertyIds, bookingStatus, cleanSearch, checkInFrom, checkInTo, pageable);

        return new PageResponse<>(
                result.getContent().stream().map(booking -> {
                    boolean isReviewed = reviewRepository.existsByBooking_Id(booking.getId());
                    return BookingSummaryResponse.fromEntity(booking, isReviewed);
                }).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    private static Booking.Status parseBookingStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status.trim())) {
            return null;
        }
        try {
            return Booking.Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** SCR-35 — Manager booking detail (scoped). */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ManagerBookingDetailResponse getBookingDetailForManager(User manager, UUID id) {
        Booking booking = findBookingOrThrow(id);
        scopeValidator.validateManagerAccess(manager, booking.getRoom().getProperty().getId());
        return buildManagerDetail(booking);
    }

    /** SCR-37 — Upload CMND/CCCD for manager check-in flow. */
    @org.springframework.transaction.annotation.Transactional
    public List<String> uploadIdDocumentsForManager(User manager, UUID bookingId, List<MultipartFile> files) {
        Booking booking = findBookingOrThrow(bookingId);
        scopeValidator.validateManagerAccess(manager, booking.getRoom().getProperty().getId());

        if (files == null || files.isEmpty()) {
            throw new BusinessException("Cần ít nhất một ảnh giấy tờ");
        }
        if (files.size() > 3) {
            throw new BusinessException("Tối đa 3 ảnh giấy tờ");
        }

        Path uploadDir = Paths.get("uploads", "bookings", bookingId.toString()).toAbsolutePath();
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new BusinessException("Không thể tạo thư mục upload");
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }
            validateIdDocumentFile(file);
            String savedName = UUID.randomUUID() + "_" + sanitizeFilename(file.getOriginalFilename());
            Path target = uploadDir.resolve(savedName);
            try {
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new BusinessException("Không thể lưu ảnh giấy tờ");
            }
            urls.add("/uploads/bookings/" + bookingId + "/" + savedName);
        }

        if (urls.isEmpty()) {
            throw new BusinessException("Cần ít nhất một ảnh giấy tờ");
        }
        return urls;
    }

    /** SCR-37 — Manager check-in with verification (scoped). */
    @org.springframework.transaction.annotation.Transactional
    public ManagerBookingDetailResponse markAsCheckedInForManager(
            User manager, UUID id, ManagerCheckInRequest req) {
        Booking booking = findBookingOrThrow(id);
        scopeValidator.validateManagerAccess(manager, booking.getRoom().getProperty().getId());

        validateIdDocumentUrls(req.getIdDocumentUrls());
        if (!Boolean.TRUE.equals(req.getKeyHandedOver())) {
            throw new BusinessException("Phải xác nhận đã giao chìa khóa cho khách");
        }

        if (booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new BusinessException("Chỉ có thể nhận phòng khi booking đã xác nhận");
        }
        if (booking.getCheckInDate().isAfter(LocalDate.now())) {
            throw new BusinessException("Chưa đến ngày nhận phòng");
        }

        List<Payment> payments = paymentRepository.findByBookingIdOrderByCreatedAtDesc(booking.getId());
        boolean remainingUnpaid = booking.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0
                && payments.stream().noneMatch(p ->
                p.getType() == Payment.Type.REMAINING_BALANCE && p.getStatus() == Payment.Status.PAID);
        if (remainingUnpaid && !Boolean.TRUE.equals(req.getRemainingCollected())) {
            throw new ConflictException("Chưa thu phần còn lại");
        }

        booking.setStatus(Booking.Status.CHECKED_IN);
        booking.getRoom().setStatus(Room.Status.OCCUPIED);
        bookingRepository.save(booking);

        saveCheckVerification(booking, manager, BookingCheckVerification.Type.CHECK_IN, req);

        String roomName = booking.getRoom().getRoomNumber();
        notificationService.sendNotification(
                booking.getCustomer().getId(),
                com.homestay.entity.Notification.Type.BOOKING_CONFIRMED,
                "Đã nhận phòng",
                "Bạn đã check-in phòng " + roomName + ". Chúc bạn có kỳ nghỉ vui vẻ!",
                booking.getId(), "Booking"
        );

        return buildManagerDetail(booking);
    }

    /** SCR-37 — Manager check-out with inspection gate (scoped). */
    @org.springframework.transaction.annotation.Transactional
    public ManagerBookingDetailResponse markAsCheckedOutForManager(
            User manager, UUID id, ManagerCheckOutRequest req) {
        Booking booking = findBookingOrThrow(id);
        scopeValidator.validateManagerAccess(manager, booking.getRoom().getProperty().getId());

        if (!Boolean.TRUE.equals(req.getKeyReturned())) {
            throw new BusinessException("Phải xác nhận đã thu lại chìa khóa");
        }

        if (booking.getStatus() == Booking.Status.CHECKED_IN) {
            booking.setStatus(Booking.Status.PENDING_INSPECTION);
            ensureInspectionPending(booking);
            bookingRepository.save(booking);
            saveCheckOutVerification(booking, manager, req);
            return buildManagerDetail(booking);
        }

        if (booking.getStatus() == Booking.Status.PENDING_INSPECTION) {
            RoomInspection inspection = roomInspectionRepository.findByBookingId(id)
                    .orElseThrow(() -> new ConflictException("Chưa hoàn tất kiểm tra phòng"));
            if (inspection.getStatus() != RoomInspection.Status.PASSED) {
                throw new ConflictException("Chưa hoàn tất kiểm tra phòng");
            }
            booking.setStatus(Booking.Status.CHECKED_OUT);
            booking.getRoom().setStatus(Room.Status.PENDING_CLEANING);
            bookingRepository.save(booking);
            housekeepingTaskService.onBookingCheckedOut(booking);
            saveCheckOutVerification(booking, manager, req);

            String roomName = booking.getRoom().getRoomNumber();
            notificationService.sendNotification(
                    booking.getCustomer().getId(),
                    com.homestay.entity.Notification.Type.BOOKING_CONFIRMED,
                    "Đã trả phòng",
                    "Cảm ơn bạn đã lưu trú tại " + roomName + ". Hẹn gặp lại!",
                    booking.getId(), "Booking"
            );
            return buildManagerDetail(booking);
        }

        if (booking.getStatus() == Booking.Status.PENDING_DAMAGE_PAYMENT) {
            throw new ConflictException("Khách chưa thanh toán phí thiệt hại");
        }

        throw new BusinessException("Không thể trả phòng ở trạng thái hiện tại");
    }

    private void validateIdDocumentFile(MultipartFile file) {
        if (file.getSize() > MAX_ID_DOC_BYTES) {
            throw new BusinessException("Ảnh giấy tờ không được vượt quá 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null
                || (!contentType.equalsIgnoreCase("image/jpeg")
                && !contentType.equalsIgnoreCase("image/png"))) {
            throw new BusinessException("Chỉ chấp nhận ảnh JPG hoặc PNG");
        }
    }

    private static String sanitizeFilename(String original) {
        if (original == null || original.isBlank()) {
            return "document.jpg";
        }
        return original.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private void validateIdDocumentUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            throw new BusinessException("Cần ít nhất một ảnh giấy tờ");
        }
        if (urls.size() > 3) {
            throw new BusinessException("Tối đa 3 ảnh giấy tờ");
        }
        for (String url : urls) {
            if (url == null || !url.startsWith("/uploads/")) {
                throw new BusinessException("URL ảnh giấy tờ không hợp lệ");
            }
        }
    }

    private void saveCheckVerification(
            Booking booking,
            User manager,
            BookingCheckVerification.Type type,
            ManagerCheckInRequest req) {
        BookingCheckVerification record = new BookingCheckVerification();
        record.setBooking(booking);
        record.setType(type);
        record.setIdDocumentUrls(req.getIdDocumentUrls());
        record.setKeyHandedOver(req.getKeyHandedOver());
        record.setRemainingCollected(req.getRemainingCollected());
        record.setNote(req.getNote());
        record.setPerformedBy(manager);
        checkVerificationRepository.save(record);
    }

    private void saveCheckOutVerification(Booking booking, User manager, ManagerCheckOutRequest req) {
        BookingCheckVerification record = new BookingCheckVerification();
        record.setBooking(booking);
        record.setType(BookingCheckVerification.Type.CHECK_OUT);
        record.setKeyReturned(req.getKeyReturned());
        record.setNote(req.getNote());
        record.setPerformedBy(manager);
        checkVerificationRepository.save(record);
    }

    private Booking findBookingOrThrow(UUID id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new com.homestay.exception.ResourceNotFoundException("Booking không tồn tại"));
    }

    private ManagerBookingDetailResponse buildManagerDetail(Booking booking) {
        boolean isReviewed = reviewRepository.existsByBooking_Id(booking.getId());
        Optional<RoomInspection> inspection = roomInspectionRepository.findByBookingId(booking.getId());
        List<BookingDetailResponse.PaymentInfo> payments =
                paymentRepository.findByBookingIdOrderByCreatedAtDesc(booking.getId()).stream()
                        .map(BookingDetailResponse.PaymentInfo::fromEntity)
                        .toList();
        return ManagerBookingDetailResponse.fromBooking(booking, isReviewed, inspection, payments);
    }

    private void ensureInspectionPending(Booking booking) {
        if (roomInspectionRepository.findByBookingId(booking.getId()).isPresent()) {
            return;
        }
        RoomInspection inspection = new RoomInspection();
        inspection.setBooking(booking);
        inspection.setRoom(booking.getRoom());
        inspection.setProperty(booking.getRoom().getProperty());
        inspection.setStatus(RoomInspection.Status.PENDING);
        roomInspectionRepository.save(inspection);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public BookingDetailResponse getBookingDetail(UUID id, User currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new com.homestay.exception.ResourceNotFoundException("Booking không tồn tại"));

        boolean isManager = currentUser.getRole() == User.Role.MANAGER;

        if (!isManager && !booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không có quyền xem chi tiết đặt phòng này");
        }

        boolean isReviewed = reviewRepository.existsByBooking_Id(booking.getId());
        BookingDetailResponse response = BookingDetailResponse.fromEntity(booking, isReviewed);
        response.setPayments(
                paymentRepository.findByBookingIdOrderByCreatedAtDesc(id).stream()
                        .map(BookingDetailResponse.PaymentInfo::fromEntity)
                        .toList()
        );
        return response;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public CancellationPreviewResponse getCancellationPreview(UUID id, User currentUser) {
        if (currentUser.getRole() != User.Role.CUSTOMER) {
            throw new ForbiddenException("Chỉ khách hàng mới có thể xem chính sách hủy");
        }

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new com.homestay.exception.ResourceNotFoundException("Booking không tồn tại"));

        if (!booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không có quyền hủy booking này");
        }

        if (booking.getStatus() != Booking.Status.PENDING_DEPOSIT
                && booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new IllegalArgumentException("Booking không thể hủy ở trạng thái hiện tại");
        }

        long daysUntilCheckIn = java.time.temporal.ChronoUnit.DAYS.between(
                java.time.LocalDate.now(), booking.getCheckInDate());
        if (daysUntilCheckIn < 0) {
            daysUntilCheckIn = 0;
        }

        java.math.BigDecimal depositPaid = java.math.BigDecimal.ZERO;
        List<Payment> payments = paymentRepository.findByBookingIdOrderByCreatedAtDesc(id);
        java.util.Optional<Payment> paidDeposit = payments.stream()
                .filter(p -> p.getType() == Payment.Type.DEPOSIT && p.getStatus() == Payment.Status.PAID)
                .findFirst();
        if (paidDeposit.isPresent()) {
            depositPaid = paidDeposit.get().getAmount();
        } else if (booking.getStatus() != Booking.Status.PENDING_DEPOSIT) {
            depositPaid = booking.getDepositAmount() != null ? booking.getDepositAmount() : java.math.BigDecimal.ZERO;
        }

        int refundPercent;
        String policyText;
        if (daysUntilCheckIn >= 7) {
            refundPercent = 100;
            policyText = "Hủy trước 7 ngày check-in: hoàn 100% tiền cọc đã thanh toán.";
        } else if (daysUntilCheckIn >= 3) {
            refundPercent = 50;
            policyText = "Hủy từ 3–6 ngày trước check-in: hoàn 50% tiền cọc đã thanh toán.";
        } else {
            refundPercent = 0;
            policyText = "Hủy dưới 3 ngày trước check-in: không hoàn tiền cọc.";
        }

        java.math.BigDecimal refundAmount = depositPaid
                .multiply(java.math.BigDecimal.valueOf(refundPercent))
                .divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal forfeitAmount = depositPaid.subtract(refundAmount);

        return new CancellationPreviewResponse(
                (int) daysUntilCheckIn,
                refundPercent,
                refundAmount,
                forfeitAmount,
                policyText
        );
    }

    @org.springframework.transaction.annotation.Transactional
    public void cancelBooking(UUID id, User currentUser) {
        cancelBooking(id, currentUser, null);
    }

    @org.springframework.transaction.annotation.Transactional
    public void cancelBooking(UUID id, User currentUser, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new com.homestay.exception.ResourceNotFoundException("Booking không tồn tại"));

        boolean isManager = currentUser.getRole() == User.Role.MANAGER;
        if (!isManager && !booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không có quyền hủy booking này");
        }

        if (booking.getStatus() == Booking.Status.CANCELLED) {
            throw new IllegalArgumentException("Booking đã bị hủy trước đó");
        }
        if (booking.getStatus() == Booking.Status.CHECKED_IN || booking.getStatus() == Booking.Status.CHECKED_OUT) {
            throw new IllegalArgumentException("Không thể hủy booking đang check-in hoặc đã check-out");
        }

        booking.setStatus(Booking.Status.CANCELLED);
        booking.setCancelledAt(java.time.LocalDateTime.now());
        if (!isManager) {
            booking.setCancelledBy(currentUser);
        }
        if (reason != null && !reason.isBlank()) {
            booking.setCancelReason(reason.trim());
        }
        bookingRepository.save(booking);
        // Inventory is date-range based; only clear stale ops hold flags if no other blocking bookings
        releaseStaleRoomHoldStatus(booking.getRoom());

        notificationService.sendNotification(
                booking.getCustomer().getId(),
                com.homestay.entity.Notification.Type.BOOKING_CANCELLED,
                "Booking Cancelled",
                "Your booking #" + booking.getId().toString().substring(0, 8).toUpperCase() + " has been cancelled.",
                booking.getId(), "Booking"
        );
    }

    @org.springframework.transaction.annotation.Transactional
    public void markAsCheckedIn(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new com.homestay.exception.ResourceNotFoundException("Booking không tồn tại"));

        if (booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new IllegalArgumentException("Chỉ có thể check-in khi booking ở trạng thái CONFIRMED");
        }

        booking.setStatus(Booking.Status.CHECKED_IN);
        booking.getRoom().setStatus(Room.Status.OCCUPIED);
        bookingRepository.save(booking);

        // Gửi thông báo cho Customer
        String roomName = booking.getRoom().getRoomNumber();
        notificationService.sendNotification(
                booking.getCustomer().getId(),
                com.homestay.entity.Notification.Type.BOOKING_CONFIRMED,
                "Booking Confirmed",
                "Your booking for " + roomName + " has been confirmed. Check-in on " + booking.getCheckInDate() + ".",
                booking.getId(), "Booking"
        );
    }

    @org.springframework.transaction.annotation.Transactional
    public void markAsCheckedOut(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new com.homestay.exception.ResourceNotFoundException("Booking không tồn tại"));

        if (booking.getStatus() != Booking.Status.CHECKED_IN) {
            throw new IllegalArgumentException("Chỉ có thể check-out khi booking ở trạng thái CHECKED_IN");
        }

        booking.setStatus(Booking.Status.CHECKED_OUT);
        booking.getRoom().setStatus(Room.Status.AVAILABLE);
        bookingRepository.save(booking);

        // Gửi thông báo cho Customer
        String roomName = booking.getRoom().getRoomNumber();
        notificationService.sendNotification(
                booking.getCustomer().getId(),
                com.homestay.entity.Notification.Type.BOOKING_CONFIRMED,
                "Check-out Complete",
                "Thank you for your stay at " + roomName + ". We hope to see you again!",
                booking.getId(), "Booking"
        );
    }

    @org.springframework.transaction.annotation.Transactional
    public BookingDetailResponse createBooking(com.homestay.dto.request.CreateBookingRequest request, User currentUser) {
        if (currentUser.getRole() != User.Role.CUSTOMER) {
            throw new ForbiddenException("Chỉ khách hàng mới có thể đặt phòng");
        }

        if (!request.getCheckOutDate().isAfter(request.getCheckInDate())) {
            throw new IllegalArgumentException("Ngày check-out phải sau ngày check-in");
        }

        if (request.getCheckInDate().isBefore(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Ngày check-in không được trong quá khứ");
        }

        Room room = roomRepository.findByIdForUpdate(request.getRoomId())
                .orElseThrow(() -> new com.homestay.exception.ResourceNotFoundException("Phòng không tồn tại"));

        if (BOOKING_BLOCKED_ROOM_STATUSES.contains(room.getStatus())) {
            throw new ConflictException("Phòng hiện không khả dụng để đặt (bảo trì / ngưng phục vụ / đang dọn)");
        }

        if (request.getGuestCount() > room.getCapacity()) {
            throw new IllegalArgumentException("Số người vượt quá sức chứa của phòng");
        }

        boolean isOverlap = roomRepository.existsOverlapBooking(
                room.getId(), request.getCheckInDate(), request.getCheckOutDate());
        if (isOverlap) {
            throw new ConflictException(
                    "Phòng đang được giữ hoặc đã đặt trong khoảng ngày này. Vui lòng chọn ngày khác hoặc thử lại sau khi hết thời gian giữ chỗ.");
        }

        long nights = java.time.temporal.ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        if (nights <= 0) nights = 1;

        java.math.BigDecimal totalAmount = room.getPricePerNight().multiply(java.math.BigDecimal.valueOf(nights));
        java.math.BigDecimal depositAmount = totalAmount.multiply(java.math.BigDecimal.valueOf(0.40));
        java.math.BigDecimal remainingAmount = totalAmount.subtract(depositAmount);

        Booking booking = new Booking();
        booking.setCustomer(currentUser);
        booking.setRoom(room);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setGuestCount(request.getGuestCount());
        booking.setSpecialRequests(request.getSpecialRequests());
        booking.setTotalAmount(totalAmount);
        booking.setDepositAmount(depositAmount);
        booking.setRemainingAmount(remainingAmount);
        booking.setStatus(Booking.Status.PENDING_DEPOSIT);
        booking.setHoldExpiresAt(java.time.LocalDateTime.now().plusMinutes(holdTimeoutMinutes));

        booking = bookingRepository.save(booking);
        // Do NOT set Room.status = PENDING_DEPOSIT — inventory is date-range based (Spec FR-04).

        return BookingDetailResponse.fromEntity(booking);
    }

    /**
     * Hold timeout: cancel unpaid PENDING_DEPOSIT past holdExpiresAt and release inventory.
     * @return number of bookings cancelled
     */
    @org.springframework.transaction.annotation.Transactional
    public int cancelExpiredDepositHolds() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        List<Booking> expired = bookingRepository.findExpiredPendingDeposits(now);
        int cancelled = 0;
        for (Booking booking : expired) {
            boolean depositPaid = paymentRepository.findByBookingIdOrderByCreatedAtDesc(booking.getId()).stream()
                    .anyMatch(p -> p.getType() == Payment.Type.DEPOSIT && p.getStatus() == Payment.Status.PAID);
            if (depositPaid) {
                continue;
            }
            booking.setStatus(Booking.Status.CANCELLED);
            booking.setCancelledAt(now);
            booking.setCancelReason("Hold timeout — unpaid deposit");
            bookingRepository.save(booking);
            releaseStaleRoomHoldStatus(booking.getRoom());
            cancelled++;

            notificationService.sendNotification(
                    booking.getCustomer().getId(),
                    com.homestay.entity.Notification.Type.BOOKING_CANCELLED,
                    "Booking Cancelled",
                    "Your booking #" + booking.getId().toString().substring(0, 8).toUpperCase()
                            + " was cancelled because the deposit was not paid in time.",
                    booking.getId(), "Booking"
            );
        }
        return cancelled;
    }

    /** Clear legacy PENDING_DEPOSIT/RESERVED room flags when no blocking bookings remain. */
    private void releaseStaleRoomHoldStatus(Room room) {
        if (room == null) {
            return;
        }
        if (room.getStatus() != Room.Status.PENDING_DEPOSIT && room.getStatus() != Room.Status.RESERVED) {
            return;
        }
        if (!roomRepository.hasBlockingBookings(room.getId())) {
            room.setStatus(Room.Status.AVAILABLE);
            roomRepository.save(room);
        }
    }
}
