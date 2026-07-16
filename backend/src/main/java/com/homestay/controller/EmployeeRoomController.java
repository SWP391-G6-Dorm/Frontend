package com.homestay.controller;

import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.EmployeeRoomResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.User;
import com.homestay.service.EmployeeRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** SCR-65 - Property Room List. Resource /api/v1/employees/rooms. */
@RestController
@RequestMapping("/api/v1/employees/rooms")
@PreAuthorize("hasRole('EMPLOYEE')")
@RequiredArgsConstructor
public class EmployeeRoomController {

    private static final int MAX_PAGE_SIZE = 200;

    private final EmployeeRoomService employeeRoomService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<EmployeeRoomResponse>>> list(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, MAX_PAGE_SIZE);
        PageResponse<EmployeeRoomResponse> data =
                employeeRoomService.list(currentUser, PageRequest.of(safePage, safeSize));
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}