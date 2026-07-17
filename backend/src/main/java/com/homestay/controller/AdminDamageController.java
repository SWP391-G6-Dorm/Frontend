package com.homestay.controller;

import com.homestay.dto.request.CoApproveDamageRequest;
import com.homestay.dto.response.AdminDamageReportResponse;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.User;
import com.homestay.service.AdminDamageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * SCR-53 — Damage Escalation (Admin).
 * Dual-map: docs {@code /api/v1/admin/...} + legacy {@code /api/admin/...}.
 * List: {@code GET .../escalated} (docs) + {@code GET ...} (legacy FE).
 * Approve: {@code POST .../{id}/approve} (docs) + {@code PATCH .../{id}/co-approve} (legacy).
 */
@RestController
@RequestMapping({"/api/v1/admin/damage-reports", "/api/admin/damage-reports"})
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDamageController {

    private final AdminDamageService adminDamageService;

    @GetMapping("/escalated")
    public ResponseEntity<ApiResponse<PageResponse<AdminDamageReportResponse>>> listEscalated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminDamageService.listEscalated(PageRequest.of(page, size))));
    }

    /** Legacy FE: GET ?status=ESCALATED — status ignored; always escalated queue. */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminDamageReportResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminDamageService.listEscalated(PageRequest.of(page, size))));
    }

    @PostMapping("/{id}/approve")
    @PatchMapping("/{id}/co-approve")
    public ResponseEntity<ApiResponse<AdminDamageReportResponse>> approve(
            @AuthenticationPrincipal User currentUser,
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) CoApproveDamageRequest body) {
        CoApproveDamageRequest req = body != null ? body : new CoApproveDamageRequest();
        return ResponseEntity.ok(ApiResponse.ok(
                "Co-approve thành công",
                adminDamageService.coApprove(id, req, currentUser)));
    }
}
