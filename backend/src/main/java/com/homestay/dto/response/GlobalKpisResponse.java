package com.homestay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO response cho SCR-45 — Admin Dashboard KPI toàn hệ thống.
 * Endpoint: GET /api/reports/global-kpis
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalKpisResponse {

    /** Tổng doanh thu toàn hệ thống (payment PAID, mọi thời điểm) */
    private long totalRevenue;

    /** Tổng số booking */
    private long totalBookings;

    /** Tổng số property */
    private long totalProperties;

    /** Tổng số khách hàng (role CUSTOMER) */
    private long totalCustomers;
}
