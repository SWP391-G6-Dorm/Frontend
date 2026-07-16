package com.homestay.service;

import com.homestay.dto.request.CreatePropertyRequest;
import com.homestay.dto.request.UpdatePropertyRequest;
import com.homestay.dto.response.FeaturedPropertyResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.PropertyDetailResponse;
import com.homestay.dto.response.PropertyResponse;
import com.homestay.entity.Property;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.PropertyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PropertyService {

    private final PropertyRepository propertyRepository;

    public PropertyService(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    // Lấy danh sách property nổi bật cho Landing Page — SCR-01
    @Transactional(readOnly = true)
    public List<FeaturedPropertyResponse> getFeatured(int limit) {
        PageRequest pageable = PageRequest.of(0, Math.min(limit, 20), Sort.by("createdAt").descending());
        return propertyRepository.findByStatus(Property.Status.ACTIVE, pageable)
                .getContent().stream()
                .map(FeaturedPropertyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Lấy danh sách property (có thể lọc theo tên/địa chỉ và status) — SCR-33
    public PageResponse<PropertyResponse> getAll(String search, String status, Pageable pageable) {
        Page<Property> page;

        if (search != null && !search.isBlank() && status != null && !status.isBlank()) {
            Property.Status s = Property.Status.valueOf(status.toUpperCase());
            page = propertyRepository.searchByNameOrAddressAndStatus(search, s, pageable);
        } else if (search != null && !search.isBlank()) {
            page = propertyRepository.searchByNameOrAddress(search, pageable);
        } else if (status != null && !status.isBlank()) {
            Property.Status s = Property.Status.valueOf(status.toUpperCase());
            page = propertyRepository.findByStatus(s, pageable);
        } else {
            page = propertyRepository.findAll(pageable);
        }

        return new PageResponse<>(
                page.getContent().stream().map(PropertyResponse::fromEntity).collect(Collectors.toList()),
                page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }

    // Lấy chi tiết 1 property
    public PropertyResponse getById(UUID id) {
        Property property = findById(id);
        return PropertyResponse.fromEntity(property);
    }

    // Lấy chi tiết đầy đủ 1 property — SCR-34 (stats + floors)
    public PropertyDetailResponse getDetail(UUID id) {
        Property property = findById(id);
        return PropertyDetailResponse.fromEntity(property);
    }

    // Tạo property mới (Manager)
    @Transactional
    public PropertyResponse create(CreatePropertyRequest request) {
        Property property = new Property();
        property.setName(request.getName());
        property.setAddress(request.getAddress());
        property.setDescription(request.getDescription());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                property.setStatus(Property.Status.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Status không hợp lệ. Dùng ACTIVE hoặc INACTIVE");
            }
        } else {
            property.setStatus(Property.Status.ACTIVE);
        }
        propertyRepository.save(property);
        return PropertyResponse.fromEntity(property);
    }

    // Cập nhật property (Manager)
    @Transactional
    public PropertyResponse update(UUID id, UpdatePropertyRequest request) {
        Property property = findById(id);

        if (request.getName() != null)
            property.setName(request.getName());
        if (request.getAddress() != null)
            property.setAddress(request.getAddress());
        if (request.getDescription() != null)
            property.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            try {
                property.setStatus(Property.Status.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Status không hợp lệ. Dùng ACTIVE hoặc INACTIVE");
            }
        }

        propertyRepository.save(property);
        return PropertyResponse.fromEntity(property);
    }

    // Xóa property (Manager) - chỉ xóa được khi không có phòng
    @Transactional
    public void delete(UUID id) {
        Property property = findById(id);
        if (property.getRooms() != null && !property.getRooms().isEmpty()) {
            throw new BusinessException("Không thể xóa property đang có phòng. Vui lòng xóa phòng trước.");
        }
        propertyRepository.delete(property);
    }

    private Property findById(UUID id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy property với ID: " + id));
    }
}
