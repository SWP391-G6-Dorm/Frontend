package com.homestay.service;

import com.homestay.dto.request.CreateRoomRequest;
import com.homestay.dto.request.ReorderImagesRequest;
import com.homestay.dto.request.UpdateRoomRequest;
import com.homestay.dto.request.UpdateRoomStatusRequest;
import com.homestay.dto.response.AvailabilityResponse;
import com.homestay.dto.response.BookingSummaryResponse;
import com.homestay.dto.response.MonthAvailabilityResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.RoomCalendarResponse;
import com.homestay.dto.response.RoomDetailResponse;
import com.homestay.dto.response.RoomSummaryResponse;
import com.homestay.entity.Floor;
import com.homestay.entity.Property;
import com.homestay.entity.Review;
import com.homestay.entity.Room;
import com.homestay.entity.User;
import com.homestay.entity.RoomImage;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.BookingRepository;
import com.homestay.repository.FloorRepository;
import com.homestay.repository.ManagerPropertyAssignmentRepository;
import com.homestay.repository.PropertyRepository;
import com.homestay.repository.ReviewRepository;
import com.homestay.repository.RoomImageRepository;
import com.homestay.repository.RoomRepository;
import com.homestay.repository.spec.RoomPublicSpecifications;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private static final Set<Room.Status> MAINTENANCE_ROOM_STATUSES = Set.of(
            Room.Status.MAINTENANCE,
            Room.Status.OUT_OF_SERVICE,
            Room.Status.PENDING_CLEANING,
            Room.Status.CLEANING_IN_PROGRESS
    );

    private static final Set<Room.Status> MANAGER_SETTABLE_STATUSES = Set.of(
            Room.Status.AVAILABLE,
            Room.Status.MAINTENANCE,
            Room.Status.OUT_OF_SERVICE
    );

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final FloorRepository floorRepository;
    private final RoomImageRepository roomImageRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final ReportPropertyScopeValidator scopeValidator;
    private final ManagerPropertyAssignmentRepository assignmentRepository;

    public RoomService(RoomRepository roomRepository,
                       PropertyRepository propertyRepository,
                       FloorRepository floorRepository,
                       RoomImageRepository roomImageRepository,
                       BookingRepository bookingRepository,
                       ReviewRepository reviewRepository,
                       ReportPropertyScopeValidator scopeValidator,
                       ManagerPropertyAssignmentRepository assignmentRepository) {
        this.roomRepository = roomRepository;
        this.propertyRepository = propertyRepository;
        this.floorRepository = floorRepository;
        this.roomImageRepository = roomImageRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.scopeValidator = scopeValidator;
        this.assignmentRepository = assignmentRepository;
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    // Lấy danh sách phòng (public listing - SCR-07/SCR-09) với full filter
    public PageResponse<RoomSummaryResponse> getAll(
            String search, String location, String status, String propertyIdStr,
            String roomType, BigDecimal minPrice, BigDecimal maxPrice,
            Integer capacity, LocalDate checkIn, LocalDate checkOut,
            Pageable pageable) {

        Room.Status statusEnum = null;
        if (status != null && !status.isBlank()) {
            try { statusEnum = Room.Status.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        UUID propertyId = (propertyIdStr != null && !propertyIdStr.isBlank())
                ? UUID.fromString(propertyIdStr) : null;

        String cleanSearch   = (search   != null && !search.isBlank())   ? search.trim()   : null;
        String cleanLocation = (location != null && !location.isBlank()) ? location.trim() : null;
        String keyword = cleanSearch != null ? cleanSearch : cleanLocation;
        String cleanRoomType = (roomType != null && !roomType.isBlank()) ? roomType.trim() : null;

        Page<Room> page = roomRepository.findAll(
                RoomPublicSpecifications.withFilters(
                        keyword, statusEnum, propertyId, cleanRoomType,
                        minPrice, maxPrice, capacity, checkIn, checkOut),
                pageable);

        return toPageResponse(page);
    }

    // Khoảng giá thực tế cho slider bộ lọc
    public java.util.Map<String, java.math.BigDecimal> getPriceStats() {
        java.math.BigDecimal min = roomRepository.findMinPrice(Room.Status.AVAILABLE);
        java.math.BigDecimal max = roomRepository.findMaxPrice(Room.Status.AVAILABLE);
        return java.util.Map.of(
                "minPrice", min != null ? min : java.math.BigDecimal.ZERO,
                "maxPrice", max != null ? max : new java.math.BigDecimal("5000000"));
    }

    // Lấy danh sách phòng nổi bật cho trang chủ (public - SCR-01)
    public List<RoomSummaryResponse> getFeatured(int limit) {
        Page<Room> page = roomRepository.findByStatus(
                Room.Status.AVAILABLE,
                org.springframework.data.domain.PageRequest.of(0, limit,
                        org.springframework.data.domain.Sort.by("createdAt").descending()));
        return page.getContent().stream().map(RoomSummaryResponse::fromEntity).toList();
    }

    // Lấy chi tiết phòng (public - SCR-08)
    public RoomDetailResponse getById(UUID id) {
        Room room = findById(id);
        return RoomDetailResponse.fromEntity(room);
    }

    /** SCR-31 — Manager-scoped room detail (v1). */
    @Transactional(readOnly = true)
    public RoomDetailResponse getByIdForManager(User manager, UUID id) {
        Room room = findById(id);
        scopeValidator.validateManagerAccess(manager, room.getProperty().getId());
        return RoomDetailResponse.fromEntity(room);
    }

    // Đánh giá công khai của phòng (SCR-08) — chỉ PUBLISHED
    public PageResponse<RoomDetailResponse.ReviewInfo> getPublishedReviews(UUID roomId, Pageable pageable) {
        findById(roomId);
        Page<Review> page = reviewRepository.findByRoom_IdAndStatusOrderByCreatedAtDesc(
                roomId, Review.Status.PUBLISHED, pageable);
        List<RoomDetailResponse.ReviewInfo> content = page.getContent().stream()
                .map(this::toReviewInfo)
                .collect(Collectors.toList());
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    private RoomDetailResponse.ReviewInfo toReviewInfo(Review review) {
        RoomDetailResponse.ReviewInfo info = new RoomDetailResponse.ReviewInfo();
        info.setId(review.getId());
        info.setCustomerName(review.getCustomer().getFullName());
        info.setRating(review.getRating());
        info.setComment(review.getComment());
        info.setCreatedAt(review.getCreatedAt());
        return info;
    }

    // Lấy lịch trống phòng cho SCR-10 calendar
    public RoomCalendarResponse getCalendar(UUID roomId) {
        Room room = findById(roomId);
        List<Object[]> ranges = roomRepository.findBookedDateRanges(roomId);
        List<RoomCalendarResponse.BookedRange> bookedRanges = ranges.stream()
                .map(r -> new RoomCalendarResponse.BookedRange(
                        (LocalDate) r[0],
                        (LocalDate) r[1],
                        r[2].toString()))
                .collect(Collectors.toList());
        return new RoomCalendarResponse(room.getStatus().name(), bookedRanges);
    }

    // Kiểm tra phòng còn trống không (public - SCR-10)
    public AvailabilityResponse checkAvailability(UUID roomId, LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            throw new BusinessException("Ngày check-out phải sau ngày check-in");
        }

        Room room = findById(roomId);
        List<Object[]> ranges = roomRepository.findBookedDateRanges(roomId);
        List<AvailabilityResponse.DateRange> bookedRanges = ranges.stream()
                .map(r -> new AvailabilityResponse.DateRange((LocalDate) r[0], (LocalDate) r[1]))
                .collect(Collectors.toList());

        if (MAINTENANCE_ROOM_STATUSES.contains(room.getStatus())) {
            return new AvailabilityResponse(false, bookedRanges);
        }

        boolean hasOverlap = roomRepository.existsOverlapBooking(roomId, checkIn, checkOut);
        return new AvailabilityResponse(!hasOverlap, bookedRanges);
    }

    // SCR-09 — month view: flat bookedDates + maintenanceDates for a window
    public MonthAvailabilityResponse getMonthAvailability(UUID roomId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || endDate.isBefore(startDate)) {
            throw new BusinessException("startDate và endDate không hợp lệ");
        }
        Room room = findById(roomId);

        Set<String> bookedDates = new LinkedHashSet<>();
        List<Object[]> ranges = roomRepository.findBlockingBookingsInRange(roomId, startDate, endDate);
        for (Object[] row : ranges) {
            LocalDate checkIn = (LocalDate) row[0];
            LocalDate checkOut = (LocalDate) row[1];
            LocalDate cursor = checkIn;
            // Inclusive checkout day = turnover buffer (Spec FR-04)
            while (!cursor.isAfter(checkOut)) {
                if (!cursor.isBefore(startDate) && !cursor.isAfter(endDate)) {
                    bookedDates.add(cursor.toString());
                }
                cursor = cursor.plusDays(1);
            }
        }

        Set<String> maintenanceDates = new LinkedHashSet<>();
        if (MAINTENANCE_ROOM_STATUSES.contains(room.getStatus())) {
            LocalDate cursor = startDate;
            while (!cursor.isAfter(endDate)) {
                maintenanceDates.add(cursor.toString());
                cursor = cursor.plusDays(1);
            }
        }

        return new MonthAvailabilityResponse(
                new ArrayList<>(bookedDates),
                new ArrayList<>(maintenanceDates));
    }

    // ── Manager API ────────────────────────────────────────────────

    // SCR-40: Lịch sử booking của một phòng cụ thể (Manager)
    public PageResponse<BookingSummaryResponse> getRoomBookings(UUID roomId, Pageable pageable) {
        findById(roomId); // validates room exists
        var page = bookingRepository.findByRoomIdOrderByCheckInDateDesc(roomId, pageable);
        return new PageResponse<>(
                page.getContent().stream()
                        .map(BookingSummaryResponse::fromEntity)
                        .collect(Collectors.toList()),
                page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages()
        );
    }

    // SCR-39: Manager room list với combined filter
    public PageResponse<RoomSummaryResponse> getAllForManager(
            String search, String status, String propertyIdStr,
            String floorIdStr, String roomType, Pageable pageable) {

        Room.Status statusEnum = null;
        if (status != null && !status.isBlank()) {
            try { statusEnum = Room.Status.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        UUID propertyId = (propertyIdStr != null && !propertyIdStr.isBlank())
                ? UUID.fromString(propertyIdStr) : null;
        UUID floorId = (floorIdStr != null && !floorIdStr.isBlank())
                ? UUID.fromString(floorIdStr) : null;
        String cleanSearch    = (search   != null && !search.isBlank())    ? search.trim()    : null;
        String cleanRoomType  = (roomType != null && !roomType.isBlank())  ? roomType.trim()  : null;

        Page<Room> page = roomRepository.findWithFilters(
                cleanSearch, statusEnum, propertyId, floorId, cleanRoomType, pageable);
        return toPageResponse(page);
    }

    /** SCR-29 — Manager room list with property assignment scope (v1). */
    @Transactional(readOnly = true)
    public PageResponse<RoomSummaryResponse> getAllForManagerScoped(
            User manager,
            String search, String status, String propertyIdStr,
            String floorIdStr, String roomType, Pageable pageable) {

        Room.Status statusEnum = parseStatus(status);
        UUID floorId = parseUuid(floorIdStr);
        String cleanSearch   = blankToNull(search);
        String cleanRoomType = blankToNull(roomType);

        Page<Room> page;
        if (propertyIdStr != null && !propertyIdStr.isBlank()) {
            UUID propertyId = UUID.fromString(propertyIdStr);
            scopeValidator.validateManagerAccess(manager, propertyId);
            page = roomRepository.findWithFilters(
                    cleanSearch, statusEnum, propertyId, floorId, cleanRoomType, pageable);
        } else {
            List<UUID> assignedIds = assignmentRepository.findActivePropertiesByManagerId(manager.getId())
                    .stream().map(Property::getId).toList();
            if (assignedIds.isEmpty()) {
                page = Page.empty(pageable);
            } else {
                page = roomRepository.findWithFiltersInProperties(
                        cleanSearch, statusEnum, assignedIds, floorId, cleanRoomType, pageable);
            }
        }
        return toPageResponse(page);
    }

    private static Room.Status parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return Room.Status.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static UUID parseUuid(String value) {
        if (value == null || value.isBlank()) return null;
        return UUID.fromString(value);
    }

    private static String blankToNull(String value) {
        return (value != null && !value.isBlank()) ? value.trim() : null;
    }

    // SCR-39: Xóa phòng — chỉ cho phép khi không có booking active
    @Transactional
    public void deleteRoom(UUID id) {
        Room room = findById(id);

        if (roomRepository.hasActiveBookings(id)) {
            throw new BusinessException("Không thể xóa phòng đang có booking. Hãy hủy hoặc hoàn thành các booking trước.");
        }

        roomRepository.delete(room);
    }

    // Tạo phòng mới
    @Transactional
    public RoomDetailResponse create(CreateRoomRequest request) {
        UUID propertyId = UUID.fromString(request.getPropertyId());
        UUID floorId = UUID.fromString(request.getFloorId());

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy property"));
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tầng"));

        // Floor phải thuộc property
        if (!floor.getProperty().getId().equals(propertyId)) {
            throw new BusinessException("Tầng không thuộc property này");
        }

        Room room = new Room();
        room.setProperty(property);
        room.setFloor(floor);
        room.setRoomNumber(request.getRoomNumber());
        room.setRoomType(request.getRoomType());
        room.setPricePerNight(request.getPricePerNight());
        room.setCapacity(request.getCapacity());
        room.setArea(request.getArea());
        room.setDescription(request.getDescription());
        room.setAmenities(request.getAmenities() != null
                ? new ArrayList<>(request.getAmenities())
                : new ArrayList<>());
        room.setStatus(Room.Status.AVAILABLE);

        roomRepository.save(room);
        return RoomDetailResponse.fromEntity(room);
    }

    /** SCR-30 — Manager-scoped room create (v1). */
    @Transactional
    public RoomDetailResponse createForManager(User manager, CreateRoomRequest request) {
        UUID propertyId = UUID.fromString(request.getPropertyId());
        scopeValidator.validateManagerAccess(manager, propertyId);
        return create(request);
    }

    // Cập nhật thông tin phòng
    @Transactional
    public RoomDetailResponse update(UUID id, UpdateRoomRequest request) {
        Room room = findById(id);

        if (request.getFloorId() != null && !request.getFloorId().isBlank()) {
            UUID floorId = UUID.fromString(request.getFloorId());
            Floor floor = floorRepository.findById(floorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tầng"));
            if (!floor.getProperty().getId().equals(room.getProperty().getId())) {
                throw new BusinessException("Tầng không thuộc property này");
            }
            room.setFloor(floor);
        }

        if (request.getRoomNumber() != null) room.setRoomNumber(request.getRoomNumber());
        if (request.getRoomType() != null) room.setRoomType(request.getRoomType());
        if (request.getPricePerNight() != null) room.setPricePerNight(request.getPricePerNight());
        if (request.getCapacity() != null) room.setCapacity(request.getCapacity());
        if (request.getArea() != null) room.setArea(request.getArea());
        if (request.getDescription() != null) room.setDescription(request.getDescription());
        if (request.getAmenities() != null) {
            room.setAmenities(new ArrayList<>(request.getAmenities()));
        }

        roomRepository.save(room);
        return RoomDetailResponse.fromEntity(room);
    }

    /** SCR-31 — Manager-scoped room update (v1). */
    @Transactional
    public RoomDetailResponse updateForManager(User manager, UUID id, UpdateRoomRequest request) {
        Room room = findById(id);
        scopeValidator.validateManagerAccess(manager, room.getProperty().getId());
        return update(id, request);
    }

    // Cập nhật trạng thái phòng (Manager — SCR-33)
    @Transactional
    public RoomDetailResponse updateStatus(UUID id, UpdateRoomStatusRequest request) {
        Room room = findById(id);

        Room.Status newStatus;
        try {
            newStatus = Room.Status.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Trạng thái không hợp lệ: " + request.getStatus());
        }

        if (!MANAGER_SETTABLE_STATUSES.contains(newStatus)) {
            throw new BusinessException("Manager chỉ được đặt trạng thái AVAILABLE, MAINTENANCE hoặc OUT_OF_SERVICE");
        }

        String reasonText = resolveStatusReason(request);

        if (newStatus == Room.Status.MAINTENANCE || newStatus == Room.Status.OUT_OF_SERVICE) {
            if (reasonText == null || reasonText.isBlank()) {
                throw new BusinessException("Vui lòng nhập lý do");
            }
            if (request.getStartDate() == null || request.getEndDate() == null) {
                throw new BusinessException("Vui lòng chọn từ ngày và đến ngày");
            }
            if (request.getEndDate().isBefore(request.getStartDate())) {
                throw new BusinessException("Đến ngày phải sau hoặc bằng từ ngày");
            }
        }

        room.setStatus(newStatus);
        roomRepository.save(room);
        return RoomDetailResponse.fromEntity(room);
    }

    /** SCR-33 — Manager-scoped status update (v1). */
    @Transactional
    public RoomDetailResponse updateStatusForManager(User manager, UUID id, UpdateRoomStatusRequest request) {
        Room room = findById(id);
        scopeValidator.validateManagerAccess(manager, room.getProperty().getId());
        return updateStatus(id, request);
    }

    private static String resolveStatusReason(UpdateRoomStatusRequest request) {
        if (request.getReason() != null && !request.getReason().isBlank()) {
            return request.getReason().trim();
        }
        if (request.getNote() != null && !request.getNote().isBlank()) {
            return request.getNote().trim();
        }
        return null;
    }

    // Upload ảnh cho phòng — trả về list ảnh mới (SCR-43)
    @Transactional
    public List<RoomDetailResponse.RoomImageInfo> uploadImages(UUID roomId, List<MultipartFile> files, boolean setPrimary) {
        Room room = findById(roomId);

        // Tạo thư mục nếu chưa có
        String roomUploadDir = uploadDir + "rooms/" + roomId + "/";
        Path dirPath = Paths.get(roomUploadDir);
        try {
            Files.createDirectories(dirPath);
        } catch (IOException e) {
            throw new BusinessException("Không thể tạo thư mục upload");
        }

        // Lấy sortOrder lớn nhất hiện tại
        List<RoomImage> existingImages = roomImageRepository.findByRoomIdOrderBySortOrderAsc(roomId);
        int nextSort = existingImages.isEmpty() ? 0 : existingImages.get(existingImages.size() - 1).getSortOrder() + 1;
        boolean isFirstEver = existingImages.isEmpty(); // ảnh đầu tiên của phòng → tự set primary

        // Nếu setPrimary → bỏ primary cũ trước
        if (setPrimary || isFirstEver) {
            roomImageRepository.clearPrimaryByRoomId(roomId);
        }

        List<RoomDetailResponse.RoomImageInfo> result = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            String originalName = file.getOriginalFilename();
            if (originalName == null || originalName.isBlank()) originalName = "image.png";
            originalName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + originalName;
            Path filePath = dirPath.resolve(fileName);

            try {
                Files.write(filePath, file.getBytes());
            } catch (IOException e) {
                throw new BusinessException("Lưu file thất bại: " + file.getOriginalFilename());
            }

            boolean makePrimary = (setPrimary || isFirstEver) && i == 0;
            RoomImage image = new RoomImage();
            image.setRoom(room);
            image.setImageUrl("/" + roomUploadDir + fileName);
            image.setIsPrimary(makePrimary);
            image.setSortOrder(nextSort + i);
            RoomImage saved = roomImageRepository.save(image);

            // Build response DTO
            RoomDetailResponse.RoomImageInfo info = new RoomDetailResponse.RoomImageInfo();
            info.setId(saved.getId());
            info.setImageUrl(saved.getImageUrl());
            info.setIsPrimary(saved.getIsPrimary());
            info.setSortOrder(saved.getSortOrder());
            result.add(info);
        }
        return result;
    }

    @Transactional
    public List<RoomDetailResponse.RoomImageInfo> reorderImages(UUID roomId, List<UUID> imageIds) {
        List<RoomImage> existing = roomImageRepository.findByRoomIdOrderBySortOrderAsc(roomId);
        Set<UUID> existingIds = existing.stream().map(RoomImage::getId).collect(Collectors.toSet());
        Set<UUID> requestedIds = new LinkedHashSet<>(imageIds);

        if (existing.isEmpty() || existingIds.size() != requestedIds.size() || !existingIds.equals(requestedIds)) {
            throw new BusinessException("Danh sách ảnh không hợp lệ");
        }

        Map<UUID, RoomImage> byId = existing.stream()
                .collect(Collectors.toMap(RoomImage::getId, Function.identity()));

        for (int i = 0; i < imageIds.size(); i++) {
            RoomImage img = byId.get(imageIds.get(i));
            img.setSortOrder(i);
            roomImageRepository.save(img);
        }

        return roomImageRepository.findByRoomIdOrderBySortOrderAsc(roomId).stream()
                .map(this::toRoomImageInfo)
                .collect(Collectors.toList());
    }

    // Set ảnh làm primary (SCR-43)
    @Transactional
    public void setPrimaryImage(UUID imageId) {
        RoomImage image = roomImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ảnh"));
        // Bỏ primary cũ của phòng này
        roomImageRepository.clearPrimaryByRoomId(image.getRoom().getId());
        // Set ảnh này là primary
        image.setIsPrimary(true);
        roomImageRepository.save(image);
    }

    // Xóa ảnh — xóa file vật lý + DB record (SCR-43)
    @Transactional
    public void deleteImage(UUID imageId) {
        RoomImage image = roomImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ảnh"));
        boolean wasPrimary = Boolean.TRUE.equals(image.getIsPrimary());
        UUID roomId = image.getRoom().getId();
        // Xóa file vật lý nếu tồn tại
        try {
            Path filePath = Paths.get(image.getImageUrl().replaceFirst("^/", ""));
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {}
        roomImageRepository.delete(image);

        if (wasPrimary) {
            List<RoomImage> remaining = roomImageRepository.findByRoomIdOrderBySortOrderAsc(roomId);
            if (!remaining.isEmpty()) {
                RoomImage next = remaining.get(0);
                roomImageRepository.clearPrimaryByRoomId(roomId);
                next.setIsPrimary(true);
                roomImageRepository.save(next);
            }
        }
    }

    // ── SCR-32 v1: Manager-scoped gallery ─────────────────────────────────────

    @Transactional
    public List<RoomDetailResponse.RoomImageInfo> uploadImagesForManager(
            User manager, UUID roomId, List<MultipartFile> files, boolean setPrimary) {
        validateManagerRoomAccess(manager, roomId);
        return uploadImages(roomId, files, setPrimary);
    }

    @Transactional
    public void deleteImageForManager(User manager, UUID roomId, UUID imageId) {
        validateManagerRoomAccess(manager, roomId);
        assertImageBelongsToRoom(roomId, imageId);
        deleteImage(imageId);
    }

    @Transactional
    public void setPrimaryImageForManager(User manager, UUID roomId, UUID imageId) {
        validateManagerRoomAccess(manager, roomId);
        assertImageBelongsToRoom(roomId, imageId);
        setPrimaryImage(imageId);
    }

    @Transactional
    public List<RoomDetailResponse.RoomImageInfo> reorderImagesForManager(
            User manager, UUID roomId, ReorderImagesRequest request) {
        validateManagerRoomAccess(manager, roomId);
        List<UUID> imageIds = request.getImageIds().stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());
        return reorderImages(roomId, imageIds);
    }

    private void validateManagerRoomAccess(User manager, UUID roomId) {
        Room room = findById(roomId);
        scopeValidator.validateManagerAccess(manager, room.getProperty().getId());
    }

    private void assertImageBelongsToRoom(UUID roomId, UUID imageId) {
        RoomImage image = roomImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ảnh"));
        if (!image.getRoom().getId().equals(roomId)) {
            throw new BusinessException("Ảnh không thuộc phòng này");
        }
    }

    private RoomDetailResponse.RoomImageInfo toRoomImageInfo(RoomImage saved) {
        RoomDetailResponse.RoomImageInfo info = new RoomDetailResponse.RoomImageInfo();
        info.setId(saved.getId());
        info.setImageUrl(saved.getImageUrl());
        info.setIsPrimary(saved.getIsPrimary());
        info.setSortOrder(saved.getSortOrder());
        return info;
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private Room findById(UUID id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng với ID: " + id));
    }

    private PageResponse<RoomSummaryResponse> toPageResponse(Page<Room> page) {
        return new PageResponse<>(
                page.getContent().stream().map(RoomSummaryResponse::fromEntity).collect(Collectors.toList()),
                page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages()
        );
    }
}
