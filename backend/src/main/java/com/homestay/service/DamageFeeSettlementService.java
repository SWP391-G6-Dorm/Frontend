package com.homestay.service;

import com.homestay.entity.Booking;
import com.homestay.entity.DamageReport;
import com.homestay.entity.Payment;
import com.homestay.exception.BusinessException;
import com.homestay.repository.BookingRepository;
import com.homestay.repository.DamageReportRepository;
import com.homestay.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Shared: after damage fee is approved (Manager ≤5M or Admin co-approve),
 * snapshot fee on booking, move to PENDING_DAMAGE_PAYMENT, create PENDING DAMAGE_FEE payment.
 */
@Service
@RequiredArgsConstructor
public class DamageFeeSettlementService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final DamageReportRepository damageReportRepository;

    @Transactional
    public void applyApprovedFee(DamageReport dr, BigDecimal amount) {
        Booking booking = dr.getBooking();
        if (booking == null) {
            throw new BusinessException("Báo cáo hư hại thiếu booking liên kết");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Số tiền phí thiệt hại phải lớn hơn 0");
        }

        booking.setDamageFeeAmount(amount);
        if (booking.getStatus() == Booking.Status.PENDING_INSPECTION
                || booking.getStatus() == Booking.Status.CHECKED_IN) {
            booking.setStatus(Booking.Status.PENDING_DAMAGE_PAYMENT);
        }
        bookingRepository.save(booking);

        List<Payment> existing = paymentRepository.findByBookingIdOrderByCreatedAtDesc(booking.getId());
        boolean hasOpenDamage = existing.stream().anyMatch(p ->
                p.getType() == Payment.Type.DAMAGE_FEE
                        && (p.getStatus() == Payment.Status.PENDING || p.getStatus() == Payment.Status.PAID));
        if (!hasOpenDamage) {
            Payment payment = new Payment();
            payment.setBooking(booking);
            payment.setCustomer(booking.getCustomer());
            payment.setType(Payment.Type.DAMAGE_FEE);
            payment.setAmount(amount);
            // Customer pays via VNPay; Manager may later verify bank/cash if method changes.
            payment.setMethod(Payment.Method.VNPAY);
            payment.setStatus(Payment.Status.PENDING);
            paymentRepository.save(payment);
        }
    }

    /** After DAMAGE_FEE becomes PAID — mark linked DamageReport PAID when present. */
    @Transactional
    public void markDamageReportPaidForBooking(UUID bookingId) {
        damageReportRepository.findFirstByBooking_IdAndStatus(bookingId, DamageReport.Status.APPROVED)
                .ifPresent(dr -> {
                    dr.setStatus(DamageReport.Status.PAID);
                    damageReportRepository.save(dr);
                });
    }
}
