package com.homestay.service;

import com.homestay.dto.response.EmployeeRoomResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.EmployeePropertyAssignment;
import com.homestay.entity.Room;
import com.homestay.entity.User;
import com.homestay.repository.EmployeePropertyAssignmentRepository;
import com.homestay.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** SCR-65 - Property Room List. Read-only, scope = ACTIVE property assignments of employee. */
@Service
@RequiredArgsConstructor
public class EmployeeRoomService {

    private final RoomRepository roomRepository;
    private final EmployeePropertyAssignmentRepository employeePropertyAssignmentRepository;

    @Transactional(readOnly = true)
    public PageResponse<EmployeeRoomResponse> list(User employee, Pageable pageable) {
        List<UUID> propertyIds = employeePropertyAssignmentRepository
                .findPropertyIdsByEmployeeIdAndStatus(
                        employee.getId(),
                        EmployeePropertyAssignment.Status.ACTIVE);

        if (propertyIds.isEmpty()) {
            return new PageResponse<>(
                    List.of(),
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    0L,
                    0);
        }

        Page<Room> page = roomRepository.findWithFiltersInProperties(
                null, null, propertyIds, null, null, pageable);

        List<EmployeeRoomResponse> content = page.getContent().stream()
                .map(EmployeeRoomResponse::fromEntity)
                .toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}