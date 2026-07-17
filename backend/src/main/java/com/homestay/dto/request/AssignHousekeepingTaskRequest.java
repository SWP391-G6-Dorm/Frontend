package com.homestay.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

import java.util.UUID;

/**
 * Assign body for SCR-40 / SCR-66.
 * Docs: {@code employeeId}. Legacy FE: {@code assigneeId}.
 */
@Data
public class AssignHousekeepingTaskRequest {

    private UUID employeeId;
    private UUID assigneeId;

    @JsonIgnore
    public UUID resolveEmployeeId() {
        return employeeId != null ? employeeId : assigneeId;
    }

    @AssertTrue(message = "Cần chọn nhân viên")
    @JsonIgnore
    public boolean isEmployeePresent() {
        return resolveEmployeeId() != null;
    }
}
