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
    /** True when damage fee exists and DAMAGE_FEE payment is PAID (status may still be PENDING_DAMAGE_PAYMENT until check-out). */
    private boolean damageFeePaid;

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
                false,
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

        boolean remainingUnpaid = booking.getRemainingAmount() != null
                && booking.getRemainingAmount().compareTo(java.math.BigDecimal.ZERO) > 0
                && (resp.getPayments() == null || resp.getPayments().stream().noneMatch(p ->
                "REMAINING_BALANCE".equals(p.getType()) && "PAID".equals(p.getStatus())));

        boolean damageUnpaid = booking.getDamageFeeAmount() != null
                && booking.getDamageFeeAmount().compareTo(java.math.BigDecimal.ZERO) > 0
                && (resp.getPayments() == null || resp.getPayments().stream().noneMatch(p ->
                "DAMAGE_FEE".equals(p.getType()) && "PAID".equals(p.getStatus())));

        resp.setDamageFeePaid(booking.getDamageFeeAmount() != null
                && booking.getDamageFeeAmount().compareTo(java.math.BigDecimal.ZERO) > 0
                && !damageUnpaid);

        switch (status) {
            case CHECKED_IN -> {
                // First check-out action requests inspection (status → PENDING_INSPECTION)
                resp.setCanCheckOut(true);
                resp.setCheckOutBlockedReason(null);
            }
            case PENDING_INSPECTION -> {
                boolean passed = inspection
                        .map(i -> i.getStatus() == RoomInspection.Status.PASSED)
                        .orElse(false);
                if (!passed) {
                    resp.setCanCheckOut(false);
                    resp.setCheckOutBlockedReason("Đang chờ kiểm tra phòng");
                } else if (remainingUnpaid) {
                    resp.setCanCheckOut(false);
                    resp.setCheckOutBlockedReason("Còn khoản Remaining chưa thanh toán");
                } else if (damageUnpaid) {
                    resp.setCanCheckOut(false);
                    resp.setCheckOutBlockedReason("Còn phí thiệt hại chưa thanh toán");
                } else {
                    resp.setCanCheckOut(true);
                    resp.setCheckOutBlockedReason(null);
                }
            }
            case PENDING_DAMAGE_PAYMENT -> {
                // Cho phép check-out khi đã PAID online, hoặc Manager thu tại quầy (damageFeeCollected).
                if (remainingUnpaid) {
                    resp.setCanCheckOut(false);
                    resp.setCheckOutBlockedReason("Còn khoản Remaining chưa thanh toán");
                } else {
                    resp.setCanCheckOut(true);
                    resp.setCheckOutBlockedReason(damageUnpaid
                            ? "Cần thu phí thiệt hại tại quầy hoặc khách trả online trước khi Confirm Check-out"
                            : null);
                }
            }
            default -> {
                resp.setCanCheckOut(false);
                resp.setCheckOutBlockedReason(null);
            }
        }
    }
}
