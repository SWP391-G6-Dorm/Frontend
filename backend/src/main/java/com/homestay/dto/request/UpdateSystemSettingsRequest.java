package com.homestay.dto.request;

import lombok.Data;

/** SCR-56: partial update system settings. Validation in service. */
@Data
public class UpdateSystemSettingsRequest {

    private Integer depositPercentage;
    private Integer cancelTimeoutHours;
}