package com.homestay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** SCR-56: System Settings response (khop FE SystemSettings). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsResponse {

    private int depositPercentage;
    private int cancelTimeoutHours;
}