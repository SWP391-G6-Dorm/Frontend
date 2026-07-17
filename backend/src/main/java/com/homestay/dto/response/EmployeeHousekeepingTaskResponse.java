package com.homestay.dto.response;

import com.homestay.entity.Floor;
import com.homestay.entity.HousekeepingTask;
import com.homestay.entity.Room;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** SCR-60 - Employee housekeeping task list item. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeHousekeepingTaskResponse {

    private String id;
    private String roomNumber;
    private String roomName;
    private String floorName;
    private String status;
    private LocalDateTime assignedAt;

    public static EmployeeHousekeepingTaskResponse fromEntity(HousekeepingTask task) {
        Room room = task.getRoom();
        String roomNumber = room != null ? room.getRoomNumber() : null;
        Floor floor = room != null ? room.getFloor() : null;
        String floorName = null;
        if (floor != null) {
            floorName = floor.getFloorNumber() != null
                    ? "Floor " + floor.getFloorNumber()
                    : null;
        }
        return EmployeeHousekeepingTaskResponse.builder()
                .id(task.getId().toString())
                .roomNumber(roomNumber)
                .roomName(roomNumber)
                .floorName(floorName)
                .status(task.getStatus().name())
                .assignedAt(task.getCreatedAt())
                .build();
    }
}