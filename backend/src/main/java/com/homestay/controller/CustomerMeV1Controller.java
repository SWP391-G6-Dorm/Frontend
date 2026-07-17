package com.homestay.controller;

import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.ContractSummaryResponse;
import com.homestay.dto.response.MyReviewResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.PaymentSummaryResponse;
import com.homestay.entity.User;
import com.homestay.service.ContractService;
import com.homestay.service.PaymentService;
import com.homestay.service.ReviewService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Customer “me” resources under /api/v1/customers/me.
 * SCR-21 contracts · SCR-26 payments · SCR-24 reviews.
 * Contract detail/PDF: {@link ContractController}.
 */
@RestController
@RequestMapping("/api/v1/customers/me")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerMeV1Controller {

    private final ContractService contractService;
    private final PaymentService paymentService;
    private final ReviewService reviewService;

    public CustomerMeV1Controller(
            ContractService contractService,
            PaymentService paymentService,
            ReviewService reviewService) {
        this.contractService = contractService;
        this.paymentService = paymentService;
        this.reviewService = reviewService;
    }

    @GetMapping("/contracts")
    public ResponseEntity<ApiResponse<PageResponse<ContractSummaryResponse>>> getMyContracts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort,
            @AuthenticationPrincipal User currentUser) {
        PageResponse<ContractSummaryResponse> data =
                contractService.getMyContracts(currentUser, page, size, status, search, sort);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<PageResponse<PaymentSummaryResponse>>> getMyPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal User currentUser) {
        PageResponse<PaymentSummaryResponse> data =
                paymentService.getMyPayments(currentUser, page, size, status);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<PageResponse<MyReviewResponse>>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User currentUser) {
        PageResponse<MyReviewResponse> data =
                reviewService.getMyReviews(currentUser, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
