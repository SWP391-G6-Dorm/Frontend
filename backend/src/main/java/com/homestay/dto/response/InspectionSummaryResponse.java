package com.homestay.dto.response;

import com.homestay.entity.RoomInspection;
import com.homestay.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/** SCR-42 — Manager inspection list/detail (api-spec). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InspectionSummaryResponse {

    private UUID id;
    private RoomBrief room;
    private UUID bookingId;
    private EmployeeBrief assignedEmployee;
    private EmployeeBrief inspectedBy;
    private String status;
    private String note;
    private LocalDateTime inspectedAt;
    private LocalDateTime createdAt;
    private Long inspectionDurationMinutes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomBrief {
        private UUID id;
        private String roomNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeBrief {
        private UUID id;
        private String fullName;
    }

    public static InspectionSummaryResponse fromEntity(RoomInspection ri) {
        Long durationMinutes = null;
        if (ri.getInspectedAt() != null && ri.getCreatedAt() != null) {
            durationMinutes = Duration.between(ri.getCreatedAt(), ri.getInspectedAt()).toMinutes();
        }
        return new InspectionSummaryResponse(
                ri.getId(),
                new RoomBrief(ri.getRoom().getId(), ri.getRoom().getRoomNumber()),
                ri.getBooking().getId(),
                toEmployee(ri.getAssignedEmployee()),
                toEmployee(ri.getInspectedBy()),
                ri.getStatus().name(),
                ri.getNote(),
                ri.getInspectedAt(),
                ri.getCreatedAt(),
                durationMinutes
        );
    }

    private static EmployeeBrief toEmployee(User user) {
        if (user == null) {
            return null;
        }
        return new EmployeeBrief(user.getId(), user.getFullName());
    }
}
