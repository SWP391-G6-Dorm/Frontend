package com.homestay.service;

import com.homestay.dto.response.GlobalKpisResponse;
import com.homestay.dto.response.GlobalRevenueReportResponse;
import com.homestay.dto.response.GlobalRevenueReportResponse.MonthlyRevenue;
import com.homestay.dto.response.RevenueReportResponse;
import com.homestay.entity.User;
import com.homestay.repository.BookingRepository;
import com.homestay.repository.PaymentRepository;
import com.homestay.repository.PropertyRepository;
import com.homestay.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * SCR-45 — Admin Dashboard: KPI toàn hệ thống + doanh thu theo tháng (view-only).
 * Tái dùng {@link ReportService} và các repository sẵn có; không sửa ReportService.
 */
@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ReportService reportService;

    @Transactional(readOnly = true)
    public GlobalKpisResponse getGlobalKpis() {
        BigDecimal totalRevenue = paymentRepository.sumRevenueByType(null, null, null, null);

        return GlobalKpisResponse.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue.longValue() : 0L)
                .totalBookings(bookingRepository.count())
                .totalProperties(propertyRepository.count())
                .totalCustomers(userRepository.countByRole(User.Role.CUSTOMER))
                .build();
    }

    @Transactional(readOnly = true)
    public GlobalRevenueReportResponse getGlobalRevenueReport(int year) {
        RevenueReportResponse report = reportService.getRevenueReport(
                null,
                LocalDate.of(year, 1, 1),
                LocalDate.of(year, 12, 31),
                "month");

        // Map "yyyy-MM" -> revenue (long)
        Map<Integer, Long> revenueByMonth = new LinkedHashMap<>();
        if (report.getByPeriod() != null) {
            for (RevenueReportResponse.PeriodRevenue pr : report.getByPeriod()) {
                int month = parseMonth(pr.getPeriod());
                if (month >= 1 && month <= 12) {
                    long revenue = pr.getRevenue() != null ? pr.getRevenue().longValue() : 0L;
                    revenueByMonth.merge(month, revenue, Long::sum);
                }
            }
        }

        // Điền đủ 12 tháng, tháng thiếu = 0
        List<MonthlyRevenue> monthlyData = new ArrayList<>(12);
        for (int m = 1; m <= 12; m++) {
            monthlyData.add(MonthlyRevenue.builder()
                    .month(m)
                    .revenue(revenueByMonth.getOrDefault(m, 0L))
                    .build());
        }

        return GlobalRevenueReportResponse.builder()
                .monthlyData(monthlyData)
                .build();
    }

    /** "2026-01" -> 1. Trả -1 nếu không parse được. */
    private int parseMonth(String period) {
        if (period == null || period.length() < 7) return -1;
        try {
            return Integer.parseInt(period.substring(5, 7));
        } catch (NumberFormatException e) {
            return -1;
        }
    }
}
