package com.homestay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** SCR-66 — schedule board response (api-spec-by-screen). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HousekeepingScheduleResponse {

    private LocalDate date;
    private Kpis kpis;
    private List<Column> columns;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Kpis {
        private long pending;
        private long inProgress;
        private long completedToday;
        private long unassigned;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Column {
        private UUID assigneeId;
        private String assigneeName;
        private List<ScheduleTask> tasks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleTask {
        private UUID id;
        private RoomBrief room;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomBrief {
        private UUID id;
        private String roomNumber;
    }
}
