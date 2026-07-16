package com.homestay.dto.request;



import jakarta.validation.constraints.Email;

import jakarta.validation.constraints.NotBlank;

import jakarta.validation.constraints.NotNull;

import jakarta.validation.constraints.Size;

import lombok.Data;



import java.util.UUID;



@Data

public class CreateEmployeeRequest {



    @NotBlank(message = "Họ tên không được để trống")

    @Size(max = 200)

    private String fullName;



    @NotBlank(message = "Email không được để trống")

    @Email(message = "Email không hợp lệ")

    private String email;



    @Size(max = 20)

    private String phone;



    @NotNull(message = "Cần chọn homestay")

    private UUID propertyId;

}

