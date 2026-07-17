package com.homestay.service;

import com.homestay.dto.response.DashboardResponse;
import com.homestay.dto.response.DashboardResponse.KpiData;
import com.homestay.dto.response.DashboardResponse.OccupancyData;
import com.homestay.entity.Room;
import com.homestay.repository.PropertyRepository;
import com.homestay.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service tổng hợp dữ liệu cho SCR-32 Manager Dashboard.
 *
 * NOTE: Các KPI liên quan đến Booking/Payment (bookingsThisMonth, checkInsToday,
 * checkOutsToday, monthlyRevenue) hiện trả về 0 vì entity Booking/Payment
 * chưa được implement. Sẽ được bổ sung khi build SCR-17 (Booking) + SCR-47 (Payment).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;

    public DashboardResponse getDashboardData() {

        // ── KPI: Properties & Rooms (có data thực) ───────────────────────────

        long totalProperties  = propertyRepository.count();
        long totalRooms       = roomRepository.count();
        long availableRooms   = roomRepository.countByStatus(Room.Status.AVAILABLE);
        long occupiedRooms    = roomRepository.countByStatus(Room.Status.OCCUPIED);
        long maintenanceRooms = roomRepository.countByStatus(Room.Status.MAINTENANCE);
        long pendingRooms     = roomRepository.countByStatus(Room.Status.PENDING_DEPOSIT);

        KpiData kpis = KpiData.builder()
                .totalProperties(totalProperties)
                .totalRooms(totalRooms)
                .availableRooms(availableRooms)
                .occupiedRooms(occupiedRooms)
                // LATER: inject BookingRepository khi entity Booking được tạo (SCR-17)
                .bookingsThisMonth(0L)
                .checkInsToday(0L)
                .checkOutsToday(0L)
                // LATER: inject PaymentRepository khi entity Payment được tạo (SCR-47)
                .monthlyRevenue(BigDecimal.ZERO)
                .build();

        // ── Occupancy Distribution (có data thực từ Room status) ─────────────

        OccupancyData occupancyData = OccupancyData.builder()
                .available(availableRooms)
                .occupied(occupiedRooms)
                .maintenance(maintenanceRooms)
                .pendingDeposit(pendingRooms)
                .build();

        // ── Chart data (LATER khi có Booking/Payment) ──────────────────────────

        return DashboardResponse.builder()
                .kpis(kpis)
                .occupancyData(occupancyData)
                .revenueChartData(List.of())       // LATER: SCR-47
                .bookingTrendData(List.of())         // LATER: SCR-17
                .recentBookings(List.of())           // LATER: SCR-47
                .build();
    }
}
