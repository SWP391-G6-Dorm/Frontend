package com.homestay.controller;

import com.homestay.dto.request.ManagerCheckOutRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.BookingSummaryResponse;
import com.homestay.dto.response.ManagerBookingDetailResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.User;
import com.homestay.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** SCR-34/35/37 — Manager booking list + detail + check-in/out v1. */
@RestController
@RequestMapping({"/api/v1/managers/bookings", "/api/v1/manager/bookings"})
@RequiredArgsConstructor
public class ManagerBookingV1Controller {

    private final BookingService bookingService;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<BookingSummaryResponse>>> list(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInTo,
            @RequestParam(defaultValue = "checkInDate,desc") String sort) {

        PageResponse<BookingSummaryResponse> data = bookingService.getBookingsForManagerScoped(
                currentUser, propertyId, status, search, checkInFrom, checkInTo, page, size, sort);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ManagerBookingDetailResponse>> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        ManagerBookingDetailResponse data = bookingService.getBookingDetailForManager(currentUser, id);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /** SCR-37 — Check-in with CMND/CCCD multipart (idCardFront, idCardBack, depositCollected). */
    @PostMapping(value = "/{id}/check-in", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> checkIn(
            @PathVariable UUID id,
            @RequestParam("idCardFront") MultipartFile idCardFront,
            @RequestParam("idCardBack") MultipartFile idCardBack,
            @RequestParam("depositCollected") boolean depositCollected,
            @RequestParam(value = "keyHandedOver", defaultValue = "false") boolean keyHandedOver,
            @RequestParam(value = "note", required = false) String note,
            @AuthenticationPrincipal User currentUser) {

        ManagerBookingDetailResponse data = bookingService.markAsCheckedInForManager(
                currentUser, id, idCardFront, idCardBack, depositCollected, keyHandedOver, note);

        return ResponseEntity.ok(ApiResponse.ok(
                "Nhận phòng thành công",
                Map.of("status", data.getStatus())));
    }

    /** SCR-37 — Check-out with inspection / payment gates. */
    @PostMapping("/{id}/check-out")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> checkOut(
            @PathVariable UUID id,
            @Valid @RequestBody ManagerCheckOutRequest body,
            @AuthenticationPrincipal User currentUser) {

        ManagerBookingDetailResponse data = bookingService.markAsCheckedOutForManager(currentUser, id, body);

        String message = "CHECKED_OUT".equals(data.getStatus())
                ? "Trả phòng thành công"
                : "Đã chuyển sang chờ kiểm tra phòng";

        return ResponseEntity.ok(ApiResponse.ok(message, Map.of("status", data.getStatus())));
    }

    /** Legacy helper — still used if clients upload ID docs separately. */
    @PostMapping("/{id}/id-documents")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<String>>> uploadIdDocuments(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal User currentUser) {
        List<String> urls = bookingService.uploadIdDocumentsForManager(currentUser, id, files);
        return ResponseEntity.ok(ApiResponse.ok("Tải ảnh giấy tờ thành công", urls));
    }
}
