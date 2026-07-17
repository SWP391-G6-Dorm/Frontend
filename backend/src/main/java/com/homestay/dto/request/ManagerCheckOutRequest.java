package com.homestay.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ManagerCheckOutRequest {

    /** Spec SCR-37 — settlement / refund acknowledgment when applicable. */
    private Boolean depositRefunded;

    /**
     * True = Manager thu phí thiệt hại (CASH) tại quầy khi check-out.
     * Backend ghi/ cập nhật Payment DAMAGE_FEE = PAID trong cùng transaction.
     */
    private Boolean damageFeeCollected;

    @NotNull(message = "Phải xác nhận đã thu lại chìa khóa")
    private Boolean keyReturned;

    @Size(max = 500)
    private String note;
}
