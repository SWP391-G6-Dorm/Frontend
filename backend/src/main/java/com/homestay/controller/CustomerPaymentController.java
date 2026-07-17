package com.homestay.controller;

import com.homestay.entity.Booking;
import com.homestay.entity.Payment;
import com.homestay.repository.BookingRepository;
import com.homestay.repository.PaymentRepository;
import com.homestay.service.ContractService;
import com.homestay.service.DamageFeeSettlementService;
import com.homestay.service.VNPayService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * VNPay browser return callback (permitAll).
 * Create payment URL: {@link PaymentV1Controller} POST /api/v1/payments/vnpay*.
 */
@RestController
@RequestMapping("/api/payments")
public class CustomerPaymentController {

    private final VNPayService vnPayService;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ContractService contractService;
    private final DamageFeeSettlementService damageFeeSettlementService;

    public CustomerPaymentController(
            VNPayService vnPayService,
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            ContractService contractService,
            DamageFeeSettlementService damageFeeSettlementService) {
        this.vnPayService = vnPayService;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.contractService = contractService;
        this.damageFeeSettlementService = damageFeeSettlementService;
    }

    @GetMapping("/vnpay/return")
    public void vnpayReturn(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
            String fieldName = params.nextElement();
            String fieldValue = request.getParameter(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty()) && fieldName.startsWith("vnp_")) {
                fields.put(fieldName, fieldValue);
            }
        }

        String paymentIdStr = request.getParameter("paymentId");
        String vnp_ResponseCode = request.getParameter("vnp_ResponseCode");
        String frontendRedirectUrl = "http://localhost:3000/customer/payments/vnpay-result";

        if (paymentIdStr == null) {
            response.sendRedirect(frontendRedirectUrl + "?status=failed&message=Missing_Payment_ID");
            return;
        }

        UUID paymentId;
        try {
            paymentId = UUID.fromString(paymentIdStr);
        } catch (IllegalArgumentException e) {
            response.sendRedirect(frontendRedirectUrl + "?status=failed&message=Invalid_Payment_ID");
            return;
        }

        if (vnPayService.verifySignature(fields)) {
            Payment payment = paymentRepository.findById(paymentId).orElse(null);
            if (payment == null) {
                response.sendRedirect(frontendRedirectUrl + "?status=failed&message=Payment_Not_Found");
                return;
            }

            if ("00".equals(vnp_ResponseCode)) {
                if (payment.getStatus() == Payment.Status.PENDING) {
                    payment.setStatus(Payment.Status.PAID);
                    payment.setPaidAt(LocalDateTime.now());

                    Booking booking = payment.getBooking();
                    if (payment.getType() == Payment.Type.DEPOSIT && booking.getStatus() == Booking.Status.PENDING_DEPOSIT) {
                        booking.setStatus(Booking.Status.CONFIRMED);
                        bookingRepository.save(booking);

                        try {
                            contractService.autoGenerateAndSendContract(booking.getId(), payment.getCustomer());
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    } else if (payment.getType() == Payment.Type.DAMAGE_FEE) {
                        damageFeeSettlementService.markDamageReportPaidForBooking(booking.getId());
                    }
                    paymentRepository.save(payment);
                }
                response.sendRedirect(frontendRedirectUrl + "?status=success&bookingId=" + payment.getBooking().getId());
            } else {
                payment.setStatus(Payment.Status.FAILED);
                paymentRepository.save(payment);
                response.sendRedirect(frontendRedirectUrl + "?status=failed&message=Payment_Failed");
            }
        } else {
            response.sendRedirect(frontendRedirectUrl + "?status=failed&message=Invalid_Signature");
        }
    }
}
