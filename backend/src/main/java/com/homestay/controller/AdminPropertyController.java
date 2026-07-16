package com.homestay.controller;

import com.homestay.dto.request.AdminCreatePropertyRequest;
import com.homestay.dto.request.AdminUpdatePropertyRequest;
import com.homestay.dto.request.AssignManagerRequest;
import com.homestay.dto.response.AdminPropertyResponse;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.User;
import com.homestay.service.AdminPropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * SCR-46 — Property Management (Admin). Danh sách toàn bộ property.
 */
@RestController
@RequestMapping("/api/admin/properties")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPropertyController {

    private final AdminPropertyService adminPropertyService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminPropertyResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(adminPropertyService.listProperties(status, pageable)));
    }

    /** SCR-47 — Tạo property mới. */
    @PostMapping
    public ResponseEntity<ApiResponse<AdminPropertyResponse>> create(
            @Valid @RequestBody AdminCreatePropertyRequest req) {
        AdminPropertyResponse data = adminPropertyService.createProperty(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo property thành công", data));
    }

    /** SCR-48 — Cập nhật property (partial). */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminPropertyResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUpdatePropertyRequest req) {
        AdminPropertyResponse data = adminPropertyService.updateProperty(id, req);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật property thành công", data));
    }

    /** SCR-49 — Gán Manager vào property. */
    @PatchMapping("/{id}/manager")
    public ResponseEntity<ApiResponse<AdminPropertyResponse>> assignManager(
            @PathVariable UUID id,
            @Valid @RequestBody AssignManagerRequest req,
            @AuthenticationPrincipal User currentUser) {
        AdminPropertyResponse data = adminPropertyService.assignManager(id, req.getManagerId(), currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Gán manager thành công", data));
    }
}
