package com.homestay.service;

import com.homestay.dto.request.UpdateMaintenanceStatusRequest;
import com.homestay.entity.*;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.BookingRepository;
import com.homestay.repository.MaintenanceTicketRepository;
import com.homestay.repository.RoomRepository;
import com.homestay.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MaintenanceTicketService {

    private final MaintenanceTicketRepository ticketRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final NotificationService notificationService;
    private final ReportPropertyScopeValidator scopeValidator;

    public MaintenanceTicketService(MaintenanceTicketRepository ticketRepository,
                                    BookingRepository bookingRepository,
                                    UserRepository userRepository,
                                    RoomRepository roomRepository,
                                    NotificationService notificationService,
                                    ReportPropertyScopeValidator scopeValidator) {
        this.ticketRepository = ticketRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.notificationService = notificationService;
        this.scopeValidator = scopeValidator;
    }

    // ── Helper: Convert MaintenanceTicket entity → Map for frontend ──
    private Map<String, Object> ticketToMap(MaintenanceTicket ticket) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", ticket.getId().toString());
        m.put("customerId", ticket.getCustomer().getId().toString());
        m.put("customerName", ticket.getCustomer().getFullName());
        m.put("customerEmail", ticket.getCustomer().getEmail());
        m.put("roomId", ticket.getRoom().getId().toString());
        m.put("roomNumber", ticket.getRoom().getRoomNumber());
        m.put("propertyId", ticket.getRoom().getProperty().getId().toString());
        m.put("propertyName", ticket.getRoom().getProperty().getName());
        m.put("title", ticket.getTitle());
        m.put("description", ticket.getDescription());

        // photoUrls: parse JSON string to array, or empty array
        List<String> photos = new ArrayList<>();
        if (ticket.getPhotoUrls() != null && !ticket.getPhotoUrls().isBlank()) {
            String raw = ticket.getPhotoUrls().trim();
            if (raw.startsWith("[")) {
                raw = raw.substring(1, raw.length() - 1);
                for (String s : raw.split(",")) {
                    s = s.trim().replaceAll("^\"|\"$", "");
                    if (!s.isEmpty()) photos.add(s);
                }
            } else {
                photos.add(raw);
            }
        }
        m.put("photoUrls", photos);

        m.put("status", ticket.getStatus().name());
        m.put("resolutionNote", ticket.getResolutionNote());
        m.put("createdAt", ticket.getCreatedAt().toString());
        m.put("updatedAt", ticket.getUpdatedAt().toString());
        return m;
    }

    // ── 1. Customer: Get paginated tickets with optional status filter ──
    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerTicketsPaged(UUID customerId, String status, int page, int size) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        MaintenanceTicket.Status ticketStatus = parseStatusFilter(status);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Page<MaintenanceTicket> result = ticketRepository.findByCustomerPaged(customer, ticketStatus, pageable);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", result.getContent().stream()
                .map(this::ticketToMap)
                .collect(Collectors.toList()));
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        return response;
    }

    private static MaintenanceTicket.Status parseStatusFilter(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status.trim())) {
            return null;
        }
        try {
            return MaintenanceTicket.Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    // ── 2. Customer: Create ticket from multipart form ──
    public Map<String, Object> createTicketFromForm(UUID customerId, UUID roomId, String title, String description, List<MultipartFile> photos) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        // Find a matching booking for this customer + room
        List<Booking> bookings = bookingRepository.findByCustomerOrderByCreatedAtDesc(customer);
        Booking matchingBooking = bookings.stream()
                .filter(b -> b.getRoom().getId().equals(roomId))
                .findFirst()
                .orElseThrow(() -> new BusinessException("No booking found for this room. You can only submit maintenance requests for rooms you have booked."));

        MaintenanceTicket ticket = new MaintenanceTicket();
        ticket.setCustomer(customer);
        ticket.setRoom(room);
        ticket.setBooking(matchingBooking);
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setStatus(MaintenanceTicket.Status.OPEN);

        savePhotosToTicket(ticket, photos);

        MaintenanceTicket saved = ticketRepository.saveAndFlush(ticket);
        // Re-fetch to ensure @CreationTimestamp/@UpdateTimestamp are populated
        saved = ticketRepository.findById(saved.getId()).orElse(saved);
        return ticketToMap(saved);
    }

    // ── 2b. Customer: Create ticket from booking (api-spec v1) ──
    public Map<String, Object> createTicketFromBooking(UUID customerId, UUID bookingId, String title,
                                                       String description, List<MultipartFile> files) {
        if (title == null || title.isBlank()) {
            throw new BusinessException("Tiêu đề không được để trống");
        }
        if (description == null || description.length() < 20) {
            throw new BusinessException("Mô tả phải có ít nhất 20 ký tự");
        }
        if (files != null && files.size() > 5) {
            throw new BusinessException("Chỉ được tải lên tối đa 5 ảnh");
        }

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Booking booking = bookingRepository.findByIdWithRoomAndCustomer(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Đặt phòng không tồn tại"));

        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new BusinessException("Bạn không có quyền tạo yêu cầu cho đặt phòng này");
        }

        if (booking.getStatus() != Booking.Status.CONFIRMED
                && booking.getStatus() != Booking.Status.CHECKED_IN) {
            throw new BusinessException("Chỉ có thể báo cáo sự cố cho đặt phòng đang hiệu lực");
        }

        MaintenanceTicket ticket = new MaintenanceTicket();
        ticket.setCustomer(customer);
        ticket.setRoom(booking.getRoom());
        ticket.setBooking(booking);
        ticket.setTitle(title.trim());
        ticket.setDescription(description.trim());
        ticket.setStatus(MaintenanceTicket.Status.OPEN);

        savePhotosToTicket(ticket, files);

        MaintenanceTicket saved = ticketRepository.saveAndFlush(ticket);
        saved = ticketRepository.findById(saved.getId()).orElse(saved);
        return ticketToMap(saved);
    }

    private void savePhotosToTicket(MaintenanceTicket ticket, List<MultipartFile> photos) {
        if (photos == null || photos.isEmpty()) {
            return;
        }

        List<String> photoUrls = new ArrayList<>();
        java.nio.file.Path ticketUploadDir = java.nio.file.Paths.get("uploads", "tickets").toAbsolutePath();
        try {
            java.nio.file.Files.createDirectories(ticketUploadDir);
        } catch (java.io.IOException e) {
            throw new BusinessException("Failed to create upload directory: " + e.getMessage());
        }

        for (MultipartFile photo : photos) {
            if (photo.isEmpty()) continue;
            String savedName = UUID.randomUUID() + "_" + photo.getOriginalFilename();
            java.nio.file.Path targetPath = ticketUploadDir.resolve(savedName);
            try {
                java.nio.file.Files.copy(photo.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            } catch (java.io.IOException e) {
                throw new BusinessException("Failed to save photo: " + e.getMessage());
            }
            photoUrls.add("/uploads/tickets/" + savedName);
        }
        if (!photoUrls.isEmpty()) {
            ticket.setPhotoUrls(photoUrls.toString());
        }
    }

    // ── 3. Customer/Manager: Get ticket detail ──
    @Transactional(readOnly = true)
    public Map<String, Object> getTicketDetail(User user, UUID ticketId) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (user.getRole() == User.Role.MANAGER) {
            scopeValidator.validateManagerAccess(user, ticket.getRoom().getProperty().getId());
        } else if (!ticket.getCustomer().getId().equals(user.getId())) {
            throw new BusinessException("You do not have permission to view this ticket");
        }

        return ticketToMap(ticket);
    }

    // ── 4. Customer: Update ticket content + photos (only OPEN) ──
    public Map<String, Object> updateTicketContent(UUID customerId, UUID ticketId, String title, String description,
                                                    List<String> existingPhotoUrls, List<MultipartFile> newPhotos) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (!ticket.getCustomer().getId().equals(customerId)) {
            throw new BusinessException("You do not have permission to update this ticket");
        }
        if (ticket.getStatus() != MaintenanceTicket.Status.OPEN) {
            throw new BusinessException("Cannot update ticket because it is already being processed");
        }

        if (title != null && !title.isBlank()) ticket.setTitle(title);
        if (description != null && !description.isBlank()) ticket.setDescription(description);

        // ── Handle photo changes ──
        // 1. Parse current photos from DB
        List<String> currentPhotos = new ArrayList<>();
        if (ticket.getPhotoUrls() != null && !ticket.getPhotoUrls().isBlank()) {
            String raw = ticket.getPhotoUrls().trim();
            if (raw.startsWith("[")) {
                raw = raw.substring(1, raw.length() - 1);
                for (String s : raw.split(",")) {
                    s = s.trim().replaceAll("^\"|\"$", "");
                    if (!s.isEmpty()) currentPhotos.add(s);
                }
            } else {
                currentPhotos.add(raw);
            }
        }

        // 2. Determine kept photos (those in existingPhotoUrls)
        List<String> keptPhotos = new ArrayList<>();
        if (existingPhotoUrls != null) {
            keptPhotos.addAll(existingPhotoUrls);
        }

        // 3. Delete removed photo files from disk
        for (String oldUrl : currentPhotos) {
            if (!keptPhotos.contains(oldUrl)) {
                try {
                    java.nio.file.Path filePath = java.nio.file.Paths.get("uploads").toAbsolutePath()
                            .resolve(oldUrl.replaceFirst("^/uploads/", ""));
                    java.nio.file.Files.deleteIfExists(filePath);
                } catch (java.io.IOException ignored) {}
            }
        }

        // 4. Save new uploaded photos to disk
        List<String> newPhotoUrls = new ArrayList<>();
        if (newPhotos != null && !newPhotos.isEmpty()) {
            java.nio.file.Path ticketUploadDir = java.nio.file.Paths.get("uploads", "tickets").toAbsolutePath();
            try {
                java.nio.file.Files.createDirectories(ticketUploadDir);
            } catch (java.io.IOException e) {
                throw new BusinessException("Failed to create upload directory: " + e.getMessage());
            }
            for (MultipartFile photo : newPhotos) {
                if (photo.isEmpty()) continue;
                String savedName = UUID.randomUUID() + "_" + photo.getOriginalFilename();
                java.nio.file.Path targetPath = ticketUploadDir.resolve(savedName);
                try {
                    java.nio.file.Files.copy(photo.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                } catch (java.io.IOException e) {
                    throw new BusinessException("Failed to save photo: " + e.getMessage());
                }
                newPhotoUrls.add("/uploads/tickets/" + savedName);
            }
        }

        // 5. Combine: kept old + newly uploaded (max 5)
        List<String> finalPhotos = new ArrayList<>(keptPhotos);
        finalPhotos.addAll(newPhotoUrls);
        if (finalPhotos.size() > 5) {
            finalPhotos = finalPhotos.subList(0, 5);
        }

        ticket.setPhotoUrls(finalPhotos.isEmpty() ? null : finalPhotos.toString());

        MaintenanceTicket updated = ticketRepository.save(ticket);
        return ticketToMap(updated);
    }

    // ── 5. Customer: Delete ticket (only OPEN) ──
    public void deleteTicket(UUID customerId, UUID ticketId) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (!ticket.getCustomer().getId().equals(customerId)) {
            throw new BusinessException("You do not have permission to delete this ticket");
        }

        if (ticket.getStatus() != MaintenanceTicket.Status.OPEN) {
            throw new BusinessException("Cannot delete ticket because it is already being processed");
        }

        ticketRepository.delete(ticket);
    }

    // ── 6. Manager: Get all tickets (paginated, with status filter) ──
    public Map<String, Object> getAllTicketsPaged(String status, int page, int size) {
        List<MaintenanceTicket> allTickets = ticketRepository.findAllByOrderByCreatedAtDesc();

        if (status != null && !status.equalsIgnoreCase("ALL")) {
            allTickets = allTickets.stream()
                    .filter(t -> t.getStatus().name().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        int totalElements = allTickets.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<Map<String, Object>> content = allTickets.subList(fromIndex, toIndex).stream()
                .map(this::ticketToMap)
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("totalElements", totalElements);
        result.put("totalPages", totalPages);
        return result;
    }

    // ── 7. Manager: Update ticket status ──
    public Map<String, Object> updateTicketStatusAndReturn(UUID ticketId, UpdateMaintenanceStatusRequest request) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ticket.setStatus(request.getStatus());
        if (request.getResolutionNote() != null) {
            ticket.setResolutionNote(request.getResolutionNote());
        }

        MaintenanceTicket updated = ticketRepository.save(ticket);

        // Gửi thông báo cho Customer
        notificationService.sendNotification(
                ticket.getCustomer().getId(),
                Notification.Type.MAINTENANCE_UPDATED,
                "Maintenance Update",
                String.format("Your ticket '%s' has been updated to %s.", ticket.getTitle(), request.getStatus()),
                ticket.getId(),
                "MaintenanceTicket"
        );

        return ticketToMap(updated);
    }

    // ── 8. Customer: Get active bookings for Create Ticket dropdown (SCR-23) ──
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActiveBookingsForCustomer(UUID customerId) {
        if (!userRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found");
        }

        List<Booking.Status> activeStatuses = List.of(
                Booking.Status.CONFIRMED,
                Booking.Status.CHECKED_IN
        );
        List<Booking> activeBookings = bookingRepository.findActiveWithRoomPropertyByCustomerId(
                customerId, activeStatuses);

        return activeBookings.stream()
                .map(b -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("bookingId", b.getId().toString());
                    m.put("roomId", b.getRoom().getId().toString());
                    m.put("roomNumber", b.getRoom().getRoomNumber());
                    m.put("propertyId", b.getRoom().getProperty().getId().toString());
                    m.put("propertyName", b.getRoom().getProperty().getName());
                    m.put("checkInDate", b.getCheckInDate().toString());
                    m.put("checkOutDate", b.getCheckOutDate().toString());
                    m.put("status", b.getStatus().name());
                    return m;
                })
                .collect(Collectors.toList());
    }
}
