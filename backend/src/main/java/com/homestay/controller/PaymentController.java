package com.homestay.controller;

import com.homestay.dto.request.PaymentVerificationRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.PaymentDetailResponse;
import com.homestay.dto.response.PaymentSummaryResponse;
import com.homestay.entity.User;
import com.homestay.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Legacy manager payment routes. Prefer {@code /api/v1/managers/payments} (SCR-36).
 * List is property-scoped (same as v1) — never returns cross-property payments.
 */
@RestController
@RequestMapping("/api/manager/payments")
@PreAuthorize("hasRole('MANAGER')")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PaymentSummaryResponse>>> getAllPayments(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        PageResponse<PaymentSummaryResponse> data = paymentService.getPaymentsForManagerScoped(
                currentUser, propertyId, status, type, method, search, page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentDetailResponse>> getPaymentDetail(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser
    ) {
        PaymentDetailResponse data = paymentService.getPaymentDetail(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<PaymentDetailResponse>> verifyPayment(
            @PathVariable UUID id,
            @Valid @RequestBody PaymentVerificationRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        PaymentDetailResponse data = paymentService.verifyPayment(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Đã duyệt thanh toán thành công", data));
    }
}
