package com.homestay.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/** SCR-42 — Assign / Reassign inspector. */
@Data
public class AssignInspectionRequest {

    @NotNull(message = "Cần chọn nhân viên")
    private UUID employeeId;
}
