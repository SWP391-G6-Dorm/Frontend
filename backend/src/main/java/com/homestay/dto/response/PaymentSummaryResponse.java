package com.homestay.dto.response;

import com.homestay.entity.Payment;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentSummaryResponse {
    private UUID id;
    private UUID bookingId;
    private String customerName;
    private Payment.Type type;
    private Payment.Method method;
    private BigDecimal amount;
    private Payment.Status status;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    /** Present when a PaymentReceipt is attached (api-spec SCR-36). */
    private ReceiptInfo receipt;

    @Data
    @Builder
    public static class ReceiptInfo {
        private String fileUrl;
    }

    public static PaymentSummaryResponse fromEntity(Payment payment) {
        ReceiptInfo receipt = null;
        if (payment.getReceipt() != null && payment.getReceipt().getFileUrl() != null) {
            receipt = ReceiptInfo.builder().fileUrl(payment.getReceipt().getFileUrl()).build();
        }
        return PaymentSummaryResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking().getId())
                .customerName(payment.getCustomer().getFullName())
                .type(payment.getType())
                .method(payment.getMethod())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .receipt(receipt)
                .build();
    }
}
