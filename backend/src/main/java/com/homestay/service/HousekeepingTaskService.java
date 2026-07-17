package com.homestay.service;



import com.homestay.dto.request.AssignHousekeepingTaskRequest;

import com.homestay.dto.request.CancelHousekeepingTaskRequest;

import com.homestay.dto.request.CreateHousekeepingTaskRequest;

import com.homestay.dto.response.HousekeepingScheduleResponse;

import com.homestay.dto.response.HousekeepingTaskSummaryResponse;

import com.homestay.dto.response.PageResponse;

import com.homestay.entity.Booking;

import com.homestay.entity.EmployeePropertyAssignment;

import com.homestay.entity.HousekeepingTask;

import com.homestay.entity.Room;

import com.homestay.entity.User;

import com.homestay.exception.BusinessException;

import com.homestay.exception.ConflictException;

import com.homestay.exception.ResourceNotFoundException;

import com.homestay.repository.EmployeePropertyAssignmentRepository;

import com.homestay.repository.HousekeepingTaskRepository;

import com.homestay.repository.RoomRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.PageRequest;

import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import java.time.LocalDate;

import java.time.LocalDateTime;

import java.time.ZoneId;

import java.util.ArrayList;

import java.util.LinkedHashMap;

import java.util.List;

import java.util.Map;

import java.util.UUID;



@Service

@RequiredArgsConstructor

public class HousekeepingTaskService {



    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final int DEFAULT_BOARD_DAYS = 7;

    private static final List<HousekeepingTask.Status> OPEN_TASK_STATUSES = List.of(
            HousekeepingTask.Status.PENDING,
            HousekeepingTask.Status.IN_PROGRESS
    );



    private final HousekeepingTaskRepository taskRepository;

    private final EmployeePropertyAssignmentRepository employeeAssignmentRepository;

    private final RoomRepository roomRepository;

    private final ReportPropertyScopeValidator scopeValidator;



    @Transactional

    public void onBookingCheckedOut(Booking booking) {

        if (booking == null || booking.getId() == null) {

            return;

        }

        if (taskRepository.existsByBooking_IdAndStatusIn(booking.getId(), OPEN_TASK_STATUSES)) {

            return;

        }



        HousekeepingTask task = new HousekeepingTask();

        task.setProperty(booking.getRoom().getProperty());

        task.setRoom(booking.getRoom());

        task.setBooking(booking);

        task.setStatus(HousekeepingTask.Status.PENDING);

        taskRepository.save(task);

    }



    @Transactional(readOnly = true)

    public PageResponse<HousekeepingTaskSummaryResponse> listTasksForManager(

            User manager,

            UUID propertyId,

            HousekeepingTask.Status status,

            LocalDate fromDate,

            LocalDate toDate,

            int page,

            int size) {

        scopeValidator.validateManagerAccess(manager, propertyId);



        LocalDate endDate = toDate != null ? toDate : LocalDate.now(ZONE);

        LocalDate startDate = fromDate != null ? fromDate : endDate.minusDays(DEFAULT_BOARD_DAYS - 1L);



        LocalDateTime from = startDate.atStartOfDay();

        LocalDateTime to = endDate.plusDays(1).atStartOfDay();



        Pageable pageable = PageRequest.of(page, size);

        Page<HousekeepingTask> result = taskRepository.findForManagerBoard(

                propertyId, status, from, to, pageable);



        List<HousekeepingTaskSummaryResponse> content = result.getContent().stream()

                .map(HousekeepingTaskSummaryResponse::fromEntity)

                .toList();



        return new PageResponse<>(

                content, page, size, result.getTotalElements(), result.getTotalPages());

    }



    @Transactional

    public HousekeepingTaskSummaryResponse createTaskForManager(

            User manager, CreateHousekeepingTaskRequest request) {

        Room room = roomRepository.findById(request.getRoomId())

                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng"));



        UUID propertyId = room.getProperty().getId();

        scopeValidator.validateManagerAccess(manager, propertyId);



        if (room.getStatus() != Room.Status.PENDING_CLEANING

                && room.getStatus() != Room.Status.CLEANING_IN_PROGRESS) {

            throw new BusinessException("Phòng phải ở trạng thái chờ dọn hoặc đang dọn");

        }



        taskRepository.findOpenByRoomId(room.getId(), OPEN_TASK_STATUSES).ifPresent(existing -> {

            throw new ConflictException("Phòng đã có tác vụ dọn phòng đang mở");

        });



        HousekeepingTask task = new HousekeepingTask();

        task.setProperty(room.getProperty());

        task.setRoom(room);

        task.setStatus(HousekeepingTask.Status.PENDING);



        if (request.getAssigneeId() != null) {

            User assignee = resolveAssignee(request.getAssigneeId(), propertyId);

            task.setAssignedEmployee(assignee);

        }



        taskRepository.save(task);

        return HousekeepingTaskSummaryResponse.fromEntity(task);

    }



    @Transactional

    public HousekeepingTaskSummaryResponse cancelTaskForManager(

            User manager, UUID taskId, CancelHousekeepingTaskRequest request) {

        HousekeepingTask task = taskRepository.findById(taskId)

                .orElseThrow(() -> new ResourceNotFoundException("Tác vụ dọn phòng không tồn tại"));



        scopeValidator.validateManagerAccess(manager, task.getProperty().getId());



        if (task.getStatus() != HousekeepingTask.Status.PENDING

                && task.getStatus() != HousekeepingTask.Status.IN_PROGRESS) {

            throw new ConflictException("Không thể hủy tác vụ đã hoàn tất hoặc đã hủy");

        }



        task.setStatus(HousekeepingTask.Status.CANCELLED);

        if (request != null && request.getNote() != null && !request.getNote().isBlank()) {

            task.setNote(request.getNote().trim());

        }



        Room room = task.getRoom();

        if (room.getStatus() == Room.Status.CLEANING_IN_PROGRESS) {

            room.setStatus(Room.Status.PENDING_CLEANING);

            roomRepository.save(room);

        }



        taskRepository.save(task);

        return HousekeepingTaskSummaryResponse.fromEntity(task);

    }



    @Transactional(readOnly = true)
    public HousekeepingScheduleResponse getScheduleForManager(
            User manager, UUID propertyId, LocalDate date) {
        scopeValidator.validateManagerAccess(manager, propertyId);

        LocalDate scheduleDate = date != null ? date : LocalDate.now(ZONE);
        LocalDateTime start = scheduleDate.atStartOfDay(ZONE).toLocalDateTime();
        LocalDateTime end = scheduleDate.plusDays(1).atStartOfDay(ZONE).toLocalDateTime();

        List<HousekeepingTask.Status> statuses = List.of(
                HousekeepingTask.Status.PENDING,
                HousekeepingTask.Status.IN_PROGRESS,
                HousekeepingTask.Status.COMPLETED
        );

        List<HousekeepingTask> tasks = taskRepository.findScheduleTasks(
                propertyId, statuses, start, end);

        List<User> employees = employeeAssignmentRepository.findActiveEmployeesByPropertyId(
                propertyId, EmployeePropertyAssignment.Status.ACTIVE, User.Role.EMPLOYEE);

        List<HousekeepingScheduleResponse.ScheduleTask> unassigned = new ArrayList<>();
        Map<UUID, List<HousekeepingScheduleResponse.ScheduleTask>> byEmployee = new LinkedHashMap<>();
        for (User employee : employees) {
            byEmployee.put(employee.getId(), new ArrayList<>());
        }

        long pending = 0;
        long inProgress = 0;
        long completedToday = 0;

        for (HousekeepingTask task : tasks) {
            HousekeepingScheduleResponse.ScheduleTask card = toScheduleTask(task);
            switch (task.getStatus()) {
                case PENDING -> pending++;
                case IN_PROGRESS -> inProgress++;
                case COMPLETED -> completedToday++;
                default -> { }
            }

            if (task.getAssignedEmployee() == null) {
                unassigned.add(card);
            } else {
                byEmployee
                        .computeIfAbsent(task.getAssignedEmployee().getId(), k -> new ArrayList<>())
                        .add(card);
            }
        }

        List<HousekeepingScheduleResponse.Column> columns = new ArrayList<>();
        columns.add(new HousekeepingScheduleResponse.Column(null, "Unassigned", unassigned));

        for (User emp : employees) {
            columns.add(new HousekeepingScheduleResponse.Column(
                    emp.getId(),
                    emp.getFullName(),
                    byEmployee.getOrDefault(emp.getId(), List.of())));
        }

        // Orphan assignees (task assigned to employee no longer ACTIVE on property)
        byEmployee.forEach((employeeId, taskList) -> {
            if (taskList.isEmpty()) {
                return;
            }
            boolean alreadyColumn = columns.stream()
                    .anyMatch(c -> employeeId.equals(c.getAssigneeId()));
            if (!alreadyColumn) {
                String name = tasks.stream()
                        .filter(t -> t.getAssignedEmployee() != null
                                && employeeId.equals(t.getAssignedEmployee().getId()))
                        .map(t -> t.getAssignedEmployee().getFullName())
                        .findFirst()
                        .orElse("Nhân viên");
                columns.add(new HousekeepingScheduleResponse.Column(employeeId, name, taskList));
            }
        });

        HousekeepingScheduleResponse.Kpis kpis = new HousekeepingScheduleResponse.Kpis(
                pending, inProgress, completedToday, unassigned.size());

        return new HousekeepingScheduleResponse(scheduleDate, kpis, columns);
    }

    @Transactional
    public HousekeepingTaskSummaryResponse assignTaskForManager(
            User manager, UUID taskId, AssignHousekeepingTaskRequest request) {
        HousekeepingTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("Tác vụ dọn phòng không tồn tại"));

        scopeValidator.validateManagerAccess(manager, task.getProperty().getId());

        if (task.getStatus() != HousekeepingTask.Status.PENDING
                && task.getStatus() != HousekeepingTask.Status.IN_PROGRESS) {
            throw new ConflictException("Không thể gán lại tác vụ đã hoàn tất hoặc đã hủy");
        }

        UUID employeeId = request.resolveEmployeeId();
        if (employeeId == null) {
            throw new BusinessException("Cần chọn nhân viên");
        }

        User assignee = resolveAssignee(employeeId, task.getProperty().getId());
        task.setAssignedEmployee(assignee);
        taskRepository.save(task);

        return HousekeepingTaskSummaryResponse.fromEntity(task);
    }

    private static HousekeepingScheduleResponse.ScheduleTask toScheduleTask(HousekeepingTask task) {
        return new HousekeepingScheduleResponse.ScheduleTask(
                task.getId(),
                new HousekeepingScheduleResponse.RoomBrief(
                        task.getRoom().getId(),
                        task.getRoom().getRoomNumber()),
                task.getStatus().name(),
                task.getCreatedAt());
    }



    private User resolveAssignee(UUID assigneeId, UUID propertyId) {

        boolean assigned = employeeAssignmentRepository.existsByEmployeeIdAndPropertyIdAndStatus(

                assigneeId, propertyId, EmployeePropertyAssignment.Status.ACTIVE);

        if (!assigned) {

            throw new BusinessException("Nhân viên không thuộc homestay này");

        }



        return employeeAssignmentRepository.findActiveEmployeesByPropertyId(
                propertyId, EmployeePropertyAssignment.Status.ACTIVE, User.Role.EMPLOYEE).stream()

                .filter(e -> e.getId().equals(assigneeId))

                .findFirst()

                .orElseThrow(() -> new BusinessException("Nhân viên không hợp lệ"));

    }

}

