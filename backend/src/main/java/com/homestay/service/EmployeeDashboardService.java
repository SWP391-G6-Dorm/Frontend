package com.homestay.service;

import com.homestay.dto.response.EmployeeKpisResponse;
import com.homestay.entity.EmployeePropertyAssignment;
import com.homestay.entity.HousekeepingTask;
import com.homestay.entity.MaintenanceTicket;
import com.homestay.entity.RoomInspection;
import com.homestay.entity.User;
import com.homestay.repository.EmployeePropertyAssignmentRepository;
import com.homestay.repository.HousekeepingTaskRepository;
import com.homestay.repository.MaintenanceTicketRepository;
import com.homestay.repository.RoomInspectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * SCR-59 - Employee Dashboard KPIs.
 * pendingHousekeeping = HK assigned to employee with PENDING or IN_PROGRESS.
 * pendingMaintenance = Maint assigned with ASSIGNED or IN_PROGRESS.
 * pendingInspections = RoomInspection PENDING/IN_PROGRESS in employee ACTIVE properties.
 */
@Service
@RequiredArgsConstructor
public class EmployeeDashboardService {

    private final HousekeepingTaskRepository housekeepingTaskRepository;
    private final MaintenanceTicketRepository maintenanceTicketRepository;
    private final RoomInspectionRepository roomInspectionRepository;
    private final EmployeePropertyAssignmentRepository employeePropertyAssignmentRepository;

    @Transactional(readOnly = true)
    public EmployeeKpisResponse getKpis(User employee) {
        UUID employeeId = employee.getId();

        long pendingHk = housekeepingTaskRepository.countByAssignedEmployeeIdAndStatusIn(
                employeeId,
                List.of(HousekeepingTask.Status.PENDING, HousekeepingTask.Status.IN_PROGRESS));

        long pendingMaint = maintenanceTicketRepository.countByAssignedEmployeeIdAndStatusIn(
                employeeId,
                List.of(MaintenanceTicket.Status.ASSIGNED, MaintenanceTicket.Status.IN_PROGRESS));

        List<UUID> propertyIds = employeePropertyAssignmentRepository
                .findPropertyIdsByEmployeeIdAndStatus(employeeId, EmployeePropertyAssignment.Status.ACTIVE);

        long pendingInspections = 0L;
        if (!propertyIds.isEmpty()) {
            pendingInspections = roomInspectionRepository.countPendingForProperties(
                    List.of(RoomInspection.Status.PENDING, RoomInspection.Status.IN_PROGRESS),
                    propertyIds);
        }

        return EmployeeKpisResponse.builder()
                .pendingHousekeeping(pendingHk)
                .pendingMaintenance(pendingMaint)
                .pendingInspections(pendingInspections)
                .build();
    }
}