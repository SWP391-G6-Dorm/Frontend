package com.homestay.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateReviewRequest {
    @NotNull(message = "Số sao đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu là 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa là 5 sao")
    private Integer rating;

    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(min = 20, max = 200, message = "Bình luận phải từ 20 đến 200 ký tự")
    private String comment;
}
