package com.homestay.controller;

import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.GlobalKpisResponse;
import com.homestay.dto.response.GlobalRevenueReportResponse;
import com.homestay.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * SCR-45 — Admin Dashboard endpoints (ADMIN only, view-only).
 * Không dùng class-level @RequestMapping vì 2 path khác base.
 */
@RestController
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    /** SCR-45 — KPI toàn hệ thống. */
    @GetMapping("/api/reports/global-kpis")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GlobalKpisResponse>> getGlobalKpis() {
        return ResponseEntity.ok(ApiResponse.ok(adminDashboardService.getGlobalKpis()));
    }

    /** SCR-45 — Doanh thu theo tháng toàn hệ thống. */
    @GetMapping("/api/admin/reports/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GlobalRevenueReportResponse>> getGlobalRevenueReport(
            @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.ok(adminDashboardService.getGlobalRevenueReport(year)));
    }
}
