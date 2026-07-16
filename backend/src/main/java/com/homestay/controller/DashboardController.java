package com.homestay.controller;

import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.DashboardResponse;
import com.homestay.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller cho Manager Dashboard (SCR-32).
 * Endpoint: GET /api/manager/dashboard
 * Role: MANAGER only
 */
@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * GET /api/manager/dashboard
     * Trả về tất cả KPI, chart data và recent bookings cho Manager Dashboard.
     * Yêu cầu role MANAGER.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        DashboardResponse data = dashboardService.getDashboardData();
        return ResponseEntity.ok(ApiResponse.ok("Success", data));
    }
}
