package com.homestay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO cho GET /api/manager/dashboard (SCR-32).
 * Chứa KPI, chart data và recent bookings.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private KpiData kpis;
    private List<RevenueDataPoint> revenueChartData;
    private OccupancyData occupancyData;
    private List<BookingTrendPoint> bookingTrendData;
    private List<RecentBooking> recentBookings;

    // ── KPI Counters ──────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiData {
        /** Tổng số property đang quản lý */
        private long totalProperties;

        /** Tổng số phòng trong toàn hệ thống */
        private long totalRooms;

        /** Số phòng đang AVAILABLE */
        private long availableRooms;

        /** Số phòng đang OCCUPIED */
        private long occupiedRooms;

        /** Tổng booking tạo trong tháng hiện tại */
        private long bookingsThisMonth;

        /** Số lượt check-in hôm nay */
        private long checkInsToday;

        /** Số lượt check-out hôm nay */
        private long checkOutsToday;

        /** Tổng doanh thu tháng hiện tại (từ payment đã PAID) */
        private BigDecimal monthlyRevenue;
    }

    // ── Revenue Chart ─────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueDataPoint {
        /** Format: "2026-01", "2026-02", ... */
        private String month;
        private BigDecimal revenue;
    }

    // ── Occupancy Donut ───────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OccupancyData {
        private long available;
        private long occupied;
        private long maintenance;
        private long pendingDeposit;
    }

    // ── Booking Trend ─────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingTrendPoint {
        /** Format: "2026-W22" (ISO week) */
        private String week;
        private long newBookings;
        private long cancellations;
    }

    // ── Recent Bookings Table ─────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentBooking {
        private UUID id;
        private String customerName;
        private String roomNumber;
        private String propertyName;
        private LocalDate checkInDate;
        private LocalDate checkOutDate;
        private BigDecimal totalAmount;
        private String status;
    }
}
