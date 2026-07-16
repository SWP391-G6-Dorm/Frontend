package com.homestay.service;

import com.homestay.config.VNPayConfig;
import com.homestay.dto.request.PaymentVerificationRequest;
import com.homestay.dto.response.PageResponse;
import com.homestay.dto.response.PaymentDetailResponse;
import com.homestay.dto.response.PaymentSummaryResponse;
import com.homestay.entity.Booking;
import com.homestay.entity.Payment;
import com.homestay.entity.Property;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.exception.ForbiddenException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.BookingRepository;
import com.homestay.repository.ManagerPropertyAssignmentRepository;
import com.homestay.repository.PaymentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final ContractService contractService;
    private final VNPayService vnPayService;
    private final VNPayConfig vnPayConfig;
    private final ReportPropertyScopeValidator scopeValidator;
    private final ManagerPropertyAssignmentRepository assignmentRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          ContractService contractService,
                          VNPayService vnPayService,
                          VNPayConfig vnPayConfig,
                          ReportPropertyScopeValidator scopeValidator,
                          ManagerPropertyAssignmentRepository assignmentRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.contractService = contractService;
        this.vnPayService = vnPayService;
        this.vnPayConfig = vnPayConfig;
        this.scopeValidator = scopeValidator;
        this.assignmentRepository = assignmentRepository;
    }

    @Transactional
    public Map<String, String> createVnpayPaymentUrl(UUID bookingId, String type, User currentUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking không tồn tại"));

        if (!booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Bạn không có quyền thanh toán cho booking này");
        }

        if ("DEPOSIT".equals(type)) {
            if (booking.getStatus() != Booking.Status.PENDING_DEPOSIT) {
                throw new BusinessException("Booking này không ở trạng thái chờ đặt cọc");
            }
            if (booking.getHoldExpiresAt() != null
                    && booking.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
                throw new BusinessException("Payment window expired");
            }
        } else if ("REMAINING_BALANCE".equals(type)) {
            if (booking.getStatus() != Booking.Status.CONFIRMED
                    && booking.getStatus() != Booking.Status.CHECKED_IN) {
                throw new BusinessException("Booking không đủ điều kiện thanh toán phần còn lại");
            }
        } else {
            throw new IllegalArgumentException("Loại thanh toán không hợp lệ");
        }

        // Use snapshot amounts on booking — do not recalculate from current room price
        BigDecimal amountBd;
        if ("DEPOSIT".equals(type)) {
            amountBd = booking.getDepositAmount();
        } else {
            amountBd = booking.getRemainingAmount();
        }
        if (amountBd == null || amountBd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Số tiền thanh toán không hợp lệ");
        }
        long amount = amountBd.setScale(0, java.math.RoundingMode.HALF_UP).longValue();

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setCustomer(currentUser);
        payment.setType(Payment.Type.valueOf(type));
        payment.setMethod(Payment.Method.VNPAY);
        payment.setAmount(amountBd);
        payment.setStatus(Payment.Status.PENDING);
        paymentRepository.save(payment);

        String orderInfo = "Thanh toan " + type + " cho Booking " + booking.getId();
        String paymentUrl = vnPayService.createOrder(
                amount, orderInfo, vnPayConfig.getVnp_ReturnUrl(), payment.getId().toString());

        Map<String, String> result = new HashMap<>();
        result.put("paymentUrl", paymentUrl);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentSummaryResponse> getMyPayments(User currentUser, int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size);
        Payment.Status paymentStatus = parseStatus(status);
        Page<Payment> result = paymentStatus == null
                ? paymentRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.getId(), pageable)
                : paymentRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(
                        currentUser.getId(), paymentStatus, pageable);

        return new PageResponse<>(
                result.getContent().stream().map(PaymentSummaryResponse::fromEntity).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentSummaryResponse> getAllPayments(int page, int size, String status, String search, String sort) {
        Pageable pageable = buildPageable(page, size, sort);
        Payment.Status paymentStatus = parseStatus(status);
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Payment> result = paymentRepository.findAllWithFilters(paymentStatus, searchParam, pageable);

        return new PageResponse<>(
                result.getContent().stream().map(PaymentSummaryResponse::fromEntity).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    /** SCR-36 — Manager payment list scoped to assigned properties (v1). */
    @Transactional(readOnly = true)
    public PageResponse<PaymentSummaryResponse> getPaymentsForManagerScoped(
            User manager,
            String propertyIdStr,
            String status,
            String type,
            String method,
            String search,
            int page,
            int size,
            String sort
    ) {
        Pageable pageable = buildPageable(page, size, sort);

        List<UUID> propertyIds;
        if (propertyIdStr != null && !propertyIdStr.isBlank()) {
            UUID propertyId = UUID.fromString(propertyIdStr.trim());
            scopeValidator.validateManagerAccess(manager, propertyId);
            propertyIds = List.of(propertyId);
        } else {
            propertyIds = assignmentRepository.findActivePropertiesByManagerId(manager.getId())
                    .stream()
                    .map(Property::getId)
                    .toList();
        }

        if (propertyIds.isEmpty()) {
            return new PageResponse<>(List.of(), page, size, 0, 0);
        }

        Payment.Status paymentStatus = parseStatus(status);
        Payment.Type paymentType = parseType(type);
        Payment.Method paymentMethod = parseMethod(method);
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Payment> result = paymentRepository.findForManagerWithFilters(
                propertyIds, paymentStatus, paymentType, paymentMethod, cleanSearch, pageable);

        return new PageResponse<>(
                result.getContent().stream().map(PaymentSummaryResponse::fromEntity).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public PaymentDetailResponse getPaymentDetail(UUID id, User currentUser) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment không tồn tại"));

        boolean isManager = currentUser.getRole() == User.Role.MANAGER;
        if (!isManager && !payment.getCustomer().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không có quyền xem thanh toán này");
        }

        return PaymentDetailResponse.fromEntity(payment);
    }

    @Transactional
    public PaymentDetailResponse verifyPayment(UUID id, PaymentVerificationRequest request, User currentUser) {
        if (currentUser.getRole() != User.Role.MANAGER) {
            throw new ForbiddenException("Chỉ Manager mới có quyền duyệt thanh toán");
        }

        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment không tồn tại"));

        if (payment.getStatus() != Payment.Status.PENDING) {
            throw new IllegalArgumentException("Chỉ có thể duyệt thanh toán đang ở trạng thái PENDING");
        }

        payment.setStatus(request.getStatus());
        payment.setVerificationNote(request.getNote());
        payment.setVerifiedBy(currentUser);
        payment.setVerifiedAt(LocalDateTime.now());
        
        if (request.getStatus() == Payment.Status.PAID) {
            payment.setPaidAt(LocalDateTime.now());
            Booking booking = payment.getBooking();
            
            // Theo AGENTS.md: Deposit xong thì Booking -> CONFIRMED và sinh Hợp đồng
            if (payment.getType() == Payment.Type.DEPOSIT) {
                if (booking.getStatus() == Booking.Status.PENDING_DEPOSIT) {
                    booking.setStatus(Booking.Status.CONFIRMED);
                    bookingRepository.save(booking);
                }
                paymentRepository.save(payment);
                
                // Tự động sinh PDF và gửi Email hợp đồng
                try {
                    contractService.autoGenerateAndSendContract(booking.getId(), currentUser);
                } catch (Exception e) {
                    // Log error if needed, but don't rollback payment verification
                    e.printStackTrace();
                }
            } else {
                paymentRepository.save(payment);
            }
        } else {
            paymentRepository.save(payment);
        }

        return PaymentDetailResponse.fromEntity(payment);
    }

    private Pageable buildPageable(int page, int size, String sort) {
        if (sort == null || sort.isBlank()) {
            return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        List<String> allowed = Arrays.asList("createdAt", "amount", "status", "type");
        if (!allowed.contains(field)) {
            field = "createdAt";
        }
        return PageRequest.of(page, size, Sort.by(direction, field));
    }

    private Payment.Status parseStatus(String status) {
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) return null;
        try {
            return Payment.Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static Payment.Type parseType(String type) {
        if (type == null || type.isBlank()) return null;
        try {
            return Payment.Type.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static Payment.Method parseMethod(String method) {
        if (method == null || method.isBlank()) return null;
        try {
            return Payment.Method.valueOf(method.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
