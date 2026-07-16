package com.homestay.service;

import com.homestay.dto.response.RevenueReportResponse;
import com.homestay.dto.response.RevenueReportResponse.PeriodRevenue;
import com.homestay.dto.response.RevenueReportResponse.PropertyRevenue;
import com.homestay.entity.Payment;
import com.homestay.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.*;

/**
 * Service xử lý các báo cáo thống kê cho Manager.
 * Hiện tại: SCR-59 Revenue Report.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final PaymentRepository paymentRepository;

    // ── SCR-59: Revenue Report ──────────────────────────────────────────────────

    /**
     * Tổng hợp báo cáo doanh thu theo kỳ.
     *
     * @param propertyId UUID của property, null = tất cả
     * @param from       Ngày bắt đầu (bao gồm), null = không giới hạn
     * @param to         Ngày kết thúc (bao gồm), null = không giới hạn
     * @param groupBy    "month" (default) hoặc "week"
     * @return RevenueReportResponse đầy đủ KPI + chart data
     */
    @Transactional(readOnly = true)
    public RevenueReportResponse getRevenueReport(UUID propertyId,
                                                   LocalDate from,
                                                   LocalDate to,
                                                   String groupBy) {
        // Convert LocalDate → LocalDateTime (bao gồm đầu ngày / cuối ngày)
        LocalDateTime fromDt = (from != null) ? from.atStartOfDay()         : null;
        LocalDateTime toDt   = (to   != null) ? to.atTime(23, 59, 59, 999_999_999) : null;

        // 1. KPI sums
        BigDecimal totalRevenue   = paymentRepository.sumRevenueByType(fromDt, toDt, propertyId, null);
        BigDecimal depositRevenue = paymentRepository.sumRevenueByType(fromDt, toDt, propertyId, Payment.Type.DEPOSIT);
        BigDecimal balanceRevenue = paymentRepository.sumRevenueByType(fromDt, toDt, propertyId, Payment.Type.REMAINING_BALANCE);
        long       totalBookings  = paymentRepository.countDistinctBookings(fromDt, toDt, propertyId);

        // 2. Raw data để group
        List<Object[]> raw = paymentRepository.findRevenueRawData(fromDt, toDt, propertyId);

        // 3. Group by period
        List<PeriodRevenue> byPeriod = groupByPeriod(raw, groupBy);

        // 4. Group by property
        List<PropertyRevenue> byProperty = groupByProperty(raw);

        return RevenueReportResponse.builder()
                .totalRevenue(totalRevenue)
                .depositRevenue(depositRevenue)
                .balanceRevenue(balanceRevenue)
                .totalBookingCount(totalBookings)
                .byPeriod(byPeriod)
                .byProperty(byProperty)
                .build();
    }

    // ── Private helpers ─────────────────────────────────────────────────────────

    /**
     * Group raw payment data by month hoặc week.
     * raw[i] = [paidAt(LocalDateTime), amount(BigDecimal), type(Payment.Type),
     *           propertyId(UUID), propertyName(String), bookingId(UUID)]
     */
    private List<PeriodRevenue> groupByPeriod(List<Object[]> raw, String groupBy) {
        boolean isWeek = "week".equalsIgnoreCase(groupBy);

        // LinkedHashMap để giữ thứ tự sắp xếp theo key
        LinkedHashMap<String, PeriodAccum> map = new LinkedHashMap<>();

        for (Object[] row : raw) {
            LocalDateTime paidAt    = (LocalDateTime) row[0];
            BigDecimal    amount    = (BigDecimal)    row[1];
            UUID          bookingId = (UUID)           row[5];

            String key = isWeek ? toWeekKey(paidAt) : toMonthKey(paidAt);

            map.computeIfAbsent(key, k -> new PeriodAccum())
               .add(amount, bookingId);
        }

        // Sort by period key (lexicographic = chronological for yyyy-MM and yyyy-Www)
        return map.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> PeriodRevenue.builder()
                        .period(e.getKey())
                        .revenue(e.getValue().revenue)
                        .bookingCount(e.getValue().bookingIds.size())
                        .build())
                .toList();
    }

    /**
     * Group raw payment data by property.
     */
    private List<PropertyRevenue> groupByProperty(List<Object[]> raw) {
        // key = propertyId string
        LinkedHashMap<String, PropAccum> map = new LinkedHashMap<>();

        for (Object[] row : raw) {
            BigDecimal amount      = (BigDecimal) row[1];
            UUID       propId      = (UUID)        row[3];
            String     propName    = (String)       row[4];
            UUID       bookingId   = (UUID)          row[5];

            String key = propId.toString();
            map.computeIfAbsent(key, k -> new PropAccum(propId, propName))
               .add(amount, bookingId);
        }

        // Sort by revenue descending
        return map.values().stream()
                .sorted((a, b) -> b.revenue.compareTo(a.revenue))
                .map(p -> PropertyRevenue.builder()
                        .propertyId(p.propertyId.toString())
                        .propertyName(p.propertyName)
                        .revenue(p.revenue)
                        .bookingCount(p.bookingIds.size())
                        .build())
                .toList();
    }

    /** "2026-01" format */
    private String toMonthKey(LocalDateTime dt) {
        return dt.format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }

    /** "2026-W22" format */
    private String toWeekKey(LocalDateTime dt) {
        int year = dt.getYear();
        int week = dt.get(WeekFields.ISO.weekOfWeekBasedYear());
        return String.format("%d-W%02d", year, week);
    }

    // ── Accumulators ────────────────────────────────────────────────────────────

    private static class PeriodAccum {
        BigDecimal revenue = BigDecimal.ZERO;
        Set<UUID>  bookingIds = new LinkedHashSet<>();

        void add(BigDecimal amount, UUID bookingId) {
            revenue = revenue.add(amount);
            bookingIds.add(bookingId);
        }
    }

    private static class PropAccum {
        final UUID   propertyId;
        final String propertyName;
        BigDecimal   revenue    = BigDecimal.ZERO;
        Set<UUID>    bookingIds = new LinkedHashSet<>();

        PropAccum(UUID propertyId, String propertyName) {
            this.propertyId   = propertyId;
            this.propertyName = propertyName;
        }

        void add(BigDecimal amount, UUID bookingId) {
            revenue = revenue.add(amount);
            bookingIds.add(bookingId);
        }
    }
}
