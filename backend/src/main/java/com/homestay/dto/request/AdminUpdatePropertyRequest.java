package com.homestay.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO cho SCR-48 — Admin cập nhật Property (partial update).
 * Cả 2 field OPTIONAL: chỉ cập nhật field được gửi lên.
 */
@Data
public class AdminUpdatePropertyRequest {

    @Size(max = 200, message = "Tên property tối đa 200 ký tự")
    private String name;

    /** ACTIVE | INACTIVE — parse ở service, giá trị không hợp lệ sẽ bị bỏ qua. */
    private String status;
}
