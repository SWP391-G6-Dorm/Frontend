package com.homestay.dto.response;

import com.homestay.entity.Booking;
import com.homestay.entity.RoomInspection;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManagerBookingDetailResponse {

    private UUID id;
    private UUID customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private String roomNumber;
    private String roomType;
    private String propertyName;

    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer guestCount;

    private BigDecimal totalAmount;
    private BigDecimal depositAmount;
    private BigDecimal remainingAmount;
    private BigDecimal damageFeeAmount;

    private String status;
    private String specialRequests;
    private LocalDateTime createdAt;
    private boolean isReviewed;

    private boolean canCheckIn;
    private boolean canCheckOut;
    private String checkOutBlockedReason;

    private List<BookingDetailResponse.PaymentInfo> payments;

    public static ManagerBookingDetailResponse fromBooking(
            Booking booking,
            boolean isReviewed,
            Optional<RoomInspection> inspection,
            List<BookingDetailResponse.PaymentInfo> payments) {

        ManagerBookingDetailResponse resp = new ManagerBookingDetailResponse(
                booking.getId(),
                booking.getCustomer().getId(),
                booking.getCustomer().getFullName(),
                booking.getCustomer().getEmail(),
                booking.getCustomer().getPhone(),
                booking.getRoom().getRoomNumber(),
                booking.getRoom().getRoomType(),
                booking.getRoom().getProperty().getName(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                booking.getGuestCount(),
                booking.getTotalAmount(),
                booking.getDepositAmount(),
                booking.getRemainingAmount(),
                booking.getDamageFeeAmount(),
                booking.getStatus().name(),
                booking.getSpecialRequests(),
                booking.getCreatedAt(),
                isReviewed,
                false,
                false,
                null,
                payments
        );
        applyActionFlags(resp, booking, inspection);
        return resp;
    }

    private static void applyActionFlags(
            ManagerBookingDetailResponse resp,
            Booking booking,
            Optional<RoomInspection> inspection) {

        LocalDate today = LocalDate.now();
        Booking.Status status = booking.getStatus();

        resp.setCanCheckIn(status == Booking.Status.CONFIRMED
                && !booking.getCheckInDate().isAfter(today));

        switch (status) {
            case CHECKED_IN -> {
                resp.setCanCheckOut(true);
                resp.setCheckOutBlockedReason(null);
            }
            case PENDING_INSPECTION -> {
                boolean passed = inspection
                        .map(i -> i.getStatus() == RoomInspection.Status.PASSED)
                        .orElse(false);
                resp.setCanCheckOut(passed);
                resp.setCheckOutBlockedReason(passed ? null : "Đang chờ kiểm tra phòng");
            }
            case PENDING_DAMAGE_PAYMENT -> {
                resp.setCanCheckOut(false);
                resp.setCheckOutBlockedReason("Khách chưa thanh toán phí thiệt hại");
            }
            default -> {
                resp.setCanCheckOut(false);
                resp.setCheckOutBlockedReason(null);
            }
        }
    }
}
