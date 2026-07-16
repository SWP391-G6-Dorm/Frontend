package com.homestay.controller;

import com.homestay.dto.request.UpdateComplaintStatusRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.ComplaintDetailResponse;
import com.homestay.dto.response.ComplaintSummaryResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.homestay.dto.request.CreateComplaintRequest;
import com.homestay.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/manager/complaints")
    public ResponseEntity<ApiResponse<PageResponse<ComplaintSummaryResponse>>> getAllComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        PageResponse<ComplaintSummaryResponse> data = complaintService.getAllComplaints(page, size, status, search);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/manager/complaints/{id}")
    public ResponseEntity<ApiResponse<ComplaintDetailResponse>> getComplaintDetail(
            @PathVariable UUID id
    ) {
        ComplaintDetailResponse data = complaintService.getComplaintDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PatchMapping("/complaints/{id}/status")
    public ResponseEntity<ApiResponse<ComplaintDetailResponse>> updateComplaintStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateComplaintStatusRequest request
    ) {
        ComplaintDetailResponse data = complaintService.updateComplaintStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái khiếu nại thành công", data));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/complaints")
    public ResponseEntity<ApiResponse<ComplaintDetailResponse>> submitComplaint(
            @Valid @RequestBody CreateComplaintRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        ComplaintDetailResponse data = complaintService.submitComplaint(request, currentUser);
        return ResponseEntity.status(201).body(ApiResponse.ok("Gửi khiếu nại thành công", data));
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/complaints")
    public ResponseEntity<ApiResponse<java.util.List<ComplaintDetailResponse>>> getMyComplaints(
            @AuthenticationPrincipal User currentUser
    ) {
        java.util.List<ComplaintDetailResponse> data = complaintService.getMyComplaints(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
