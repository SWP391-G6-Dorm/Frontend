package com.homestay.controller;

import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.RevenueReportResponse;
import com.homestay.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Controller cho Reporting & Statistics (SCR-59 – SCR-62).
 * Tất cả endpoints yêu cầu role MANAGER.
 *
 * Base path: /api/reports
 */
@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('MANAGER')")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * GET /api/reports/revenue
     *
     * SCR-59 — Revenue Report
     * Trả về tổng hợp doanh thu theo kỳ và theo property.
     *
     * Query params:
     *   propertyId  (UUID, optional)  — lọc theo property
     *   from        (yyyy-MM-dd, optional) — ngày bắt đầu
     *   to          (yyyy-MM-dd, optional) — ngày kết thúc
     *   groupBy     (month|week, default month)
     *
     * Role: MANAGER only
     */
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<RevenueReportResponse>> getRevenueReport(
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "month") String groupBy
    ) {
        // Validate groupBy
        if (!"month".equalsIgnoreCase(groupBy) && !"week".equalsIgnoreCase(groupBy)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("groupBy phải là 'month' hoặc 'week'"));
        }

        // Validate date range
        if (from != null && to != null && from.isAfter(to)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("from phải trước hoặc bằng to"));
        }

        RevenueReportResponse data = reportService.getRevenueReport(propertyId, from, to, groupBy);
        return ResponseEntity.ok(ApiResponse.ok("Success", data));
    }
}
