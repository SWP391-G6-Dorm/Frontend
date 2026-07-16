package com.homestay.dto.response;

import com.homestay.entity.RoomInspection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** SCR-62 - Employee room inspection list item. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeInspectionResponse {

    private String id;
    private String roomId;
    private String roomNumber;
    private String roomName;
    private String bookingId;
    private String status;
    private LocalDateTime createdAt;
    private String note;

    public static EmployeeInspectionResponse fromEntity(RoomInspection ri) {
        String roomNumber = ri.getRoom() != null ? ri.getRoom().getRoomNumber() : null;
        return EmployeeInspectionResponse.builder()
                .id(ri.getId().toString())
                .roomId(ri.getRoom() != null ? ri.getRoom().getId().toString() : null)
                .roomNumber(roomNumber)
                .roomName(roomNumber)
                .bookingId(ri.getBooking() != null ? ri.getBooking().getId().toString() : null)
                .status(ri.getStatus().name())
                .createdAt(ri.getCreatedAt())
                .note(ri.getNote())
                .build();
    }
}