package com.homestay.controller;

import com.homestay.dto.request.PromotionRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.PromotionResponse;
import com.homestay.service.AdminPromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** SCR-57/58 - Promotion Management (Admin). List/Delete + Create/Update. */
@RestController
@RequestMapping("/api/admin/promotions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPromotionController {

    private final AdminPromotionService adminPromotionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PromotionResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(adminPromotionService.listForAdmin(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PromotionResponse>> create(
            @Valid @RequestBody PromotionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tao promotion thanh cong", adminPromotionService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PromotionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody PromotionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Cap nhat promotion thanh cong",
                adminPromotionService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        adminPromotionService.deleteForAdmin(id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa promotion thanh cong"));
    }
}