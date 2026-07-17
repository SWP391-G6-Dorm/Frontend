package com.homestay.dto.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;

/**
 * SCR-53: Admin co-approve damage report.
 * Docs list body as {@code { "note" }}; {@code approvedFee} is the final fee Admin confirms
 * (defaults to Manager-proposed approvedAmount when omitted).
 */
@Data
public class CoApproveDamageRequest {

    @DecimalMin(value = "0", inclusive = false, message = "approvedFee phải lớn hơn 0")
    private BigDecimal approvedFee;

    private String note;
}
