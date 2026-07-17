package com.homestay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** SCR-09 — month view availability (flat date lists). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthAvailabilityResponse {

    private List<String> bookedDates;
    private List<String> maintenanceDates;
}
