package com.homestay.dto.request;

import lombok.Data;

/** SCR-62 - Pass/Fail inspection body. Checklist is UI-only; optional for note summary. */
@Data
public class EmployeeInspectionResultRequest {

    private String notes;
    private Checklist checklist;

    @Data
    public static class Checklist {
        private Boolean tv;
        private Boolean minibar;
        private Boolean ac;
        private Boolean bathroom;
        private Boolean beds;
    }
}