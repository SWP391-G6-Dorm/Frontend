package com.homestay.controller;

import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.CustomerDashboardResponse;
import com.homestay.entity.User;
import com.homestay.service.CustomerDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerDashboardService customerDashboardService;

    public CustomerController(CustomerDashboardService customerDashboardService) {
        this.customerDashboardService = customerDashboardService;
    }

    /** SCR-15 — Customer Dashboard summary (legacy) */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerDashboardResponse>> getDashboard(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(
                customerDashboardService.getDashboard(currentUser)));
    }
}
