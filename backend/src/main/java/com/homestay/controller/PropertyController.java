package com.homestay.controller;

import com.homestay.dto.request.CreatePropertyRequest;
import com.homestay.dto.request.UpdatePropertyRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.FeaturedPropertyResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.PropertyDetailResponse;
import com.homestay.dto.response.PropertyResponse;
import com.homestay.dto.response.PropertyStructureResponse;
import com.homestay.entity.User;
import com.homestay.service.FloorService;
import com.homestay.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService propertyService;
    private final FloorService floorService;

    public PropertyController(PropertyService propertyService, FloorService floorService) {
        this.propertyService = propertyService;
        this.floorService = floorService;
    }

    // Lấy danh sách property nổi bật cho Landing Page — SCR-01
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<FeaturedPropertyResponse>>> getFeatured(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getFeatured(limit)));
    }

    // Lấy danh sách property - public (SCR-01, SCR-07)
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PropertyResponse>>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getAll(search, status, pageable)));
    }

    // Xem chi tiết property - public
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PropertyResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getById(id)));
    }

    // Xem chi tiết đầy đủ property — SCR-34 (stats + floors)
    @GetMapping("/{id}/detail")
    public ResponseEntity<ApiResponse<PropertyDetailResponse>> getDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getDetail(id)));
    }

    // Tạo property - chỉ Manager
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PropertyResponse>> create(
            @Valid @RequestBody CreatePropertyRequest request) {

        PropertyResponse res = propertyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Tạo property thành công", res));
    }

    // Legacy structure tree — Manager + assignment (prefer /api/v1/properties/{id}/tree)
    @GetMapping("/{id}/structure")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PropertyStructureResponse>> getStructure(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(floorService.getStructureForManager(currentUser, id)));
    }

    // Cập nhật property - chỉ Manager
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PropertyResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePropertyRequest request) {

        return ResponseEntity.ok(ApiResponse.ok("Cập nhật property thành công", propertyService.update(id, request)));
    }

    // Xóa property - chỉ Manager
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        propertyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa property thành công"));
    }
}
