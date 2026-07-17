package com.homestay.controller;

import com.homestay.dto.request.AdminUpdateUserRequest;
import com.homestay.dto.response.AdminCustomerBookingSummaryResponse;
import com.homestay.dto.response.AdminUserResponse;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * SCR-50/51 - Manager/Customer Directory (Admin). Resource /api/admin/users.
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> list(
            @RequestParam String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.listUsers(role, status, keyword, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.getById(id)));
    }

    /** SCR-51 — Lịch sử đặt phòng của Customer (Drawer). */
    @GetMapping("/{id}/bookings")
    public ResponseEntity<ApiResponse<PageResponse<AdminCustomerBookingSummaryResponse>>> customerBookings(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminUserService.listCustomerBookings(id, page, size)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật user thành công", adminUserService.updateUser(id, req)));
    }
}