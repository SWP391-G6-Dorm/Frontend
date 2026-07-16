package com.homestay.controller;

import com.homestay.dto.request.PromotionRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.PromotionResponse;
import com.homestay.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    /** Public: Landing Page lấy banner active */
    @GetMapping("/api/public/promotions")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getActive() {
        return ResponseEntity.ok(ApiResponse.ok(promotionService.getActivePromotions()));
    }

    /** Manager: xem tất cả banner (kể cả inactive) */
    @GetMapping("/api/manager/promotions")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(promotionService.getAllPromotions()));
    }

    /** Manager: tạo banner mới */
    @PostMapping("/api/manager/promotions")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PromotionResponse>> create(
            @Valid @RequestBody PromotionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo banner thành công", promotionService.create(req)));
    }

    /** Manager: cập nhật banner */
    @PutMapping("/api/manager/promotions/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PromotionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody PromotionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công", promotionService.update(id, req)));
    }

    /** Manager: xóa banner */
    @DeleteMapping("/api/manager/promotions/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        promotionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa banner thành công"));
    }
}
