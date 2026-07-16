package com.homestay.controller;

import com.homestay.dto.request.CreateReviewRequest;
import com.homestay.dto.request.UpdateReviewRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.MyReviewResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.User;
import com.homestay.service.ReviewService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@PreAuthorize("hasRole('CUSTOMER')")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MyReviewResponse>> submitReview(
            @jakarta.validation.Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        MyReviewResponse data = reviewService.submitReview(request, currentUser);
        return ResponseEntity.status(201).body(ApiResponse.ok("Review submitted successfully.", data));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<MyReviewResponse>>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser
    ) {
        PageResponse<MyReviewResponse> data = reviewService.getMyReviews(currentUser, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MyReviewResponse>> updateReview(
            @PathVariable UUID id,
            @jakarta.validation.Valid @RequestBody UpdateReviewRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        MyReviewResponse data = reviewService.updateReview(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Review updated successfully.", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser
    ) {
        reviewService.deleteReview(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Review deleted successfully."));
    }
}
