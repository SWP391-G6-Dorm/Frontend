package com.homestay.controller;

import com.homestay.dto.request.PaymentVerificationRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.PaymentDetailResponse;
import com.homestay.dto.response.PaymentSummaryResponse;
import com.homestay.entity.User;
import com.homestay.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.UUID;

/**
 * SCR-36 Payment Management + Manager verify (entity-ui SCR-37 verify endpoint).
 * Canonical path per docs: {@code /api/v1/managers/payments}.
 */
@RestController
@RequestMapping("/api/v1/managers/payments")
@RequiredArgsConstructor
public class ManagerPaymentV1Controller {

    private final PaymentService paymentService;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<PaymentSummaryResponse>>> list(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        PageResponse<PaymentSummaryResponse> data = paymentService.getPaymentsForManagerScoped(
                currentUser, propertyId, status, type, method, search, page, size, sort);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PaymentDetailResponse>> getDetail(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        PaymentDetailResponse data = paymentService.getPaymentDetail(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PaymentDetailResponse>> verify(
            @PathVariable UUID id,
            @Valid @RequestBody PaymentVerificationRequest request,
            @AuthenticationPrincipal User currentUser) {
        PaymentDetailResponse data = paymentService.verifyPayment(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Đã duyệt thanh toán thành công", data));
    }
}
