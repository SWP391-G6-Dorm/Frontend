package com.homestay.controller;

import com.homestay.dto.request.CreateRoomRequest;
import com.homestay.dto.request.UpdateRoomRequest;
import com.homestay.dto.request.UpdateRoomStatusRequest;
import com.homestay.dto.response.ApiResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.RoomDetailResponse;
import com.homestay.dto.response.RoomSummaryResponse;
import com.homestay.entity.User;
import com.homestay.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** SCR-29/30/31/33 — Manager room CRUD + status v1. */
@RestController
@RequestMapping("/api/v1/manager/rooms")
@RequiredArgsConstructor
public class RoomV1Controller {

    private final RoomService roomService;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<RoomSummaryResponse>>> listRooms(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String propertyId,
            @RequestParam(required = false) String floorId,
            @RequestParam(required = false) String roomType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "roomNumber"));

        PageResponse<RoomSummaryResponse> data = roomService.getAllForManagerScoped(
                currentUser, search, status, propertyId, floorId, roomType, pageable);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<RoomDetailResponse>> create(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal User currentUser) {
        RoomDetailResponse data = roomService.createForManager(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo phòng thành công", data));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<RoomDetailResponse>> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser) {
        RoomDetailResponse data = roomService.getByIdForManager(currentUser, id);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<RoomDetailResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoomRequest request,
            @AuthenticationPrincipal User currentUser) {
        RoomDetailResponse data = roomService.updateForManager(currentUser, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật phòng thành công", data));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<RoomDetailResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoomStatusRequest request,
            @AuthenticationPrincipal User currentUser) {
        RoomDetailResponse data = roomService.updateStatusForManager(currentUser, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công", data));
    }
}
