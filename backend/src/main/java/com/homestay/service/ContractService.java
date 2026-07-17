package com.homestay.service;

import com.homestay.dto.response.ContractDetailResponse;
import com.homestay.dto.response.ContractSummaryResponse;
import com.homestay.dto.response.PageResponse;
import com.homestay.entity.Contract;
import com.homestay.entity.User;
import com.homestay.exception.ForbiddenException;
import com.homestay.exception.ResourceNotFoundException;
import com.homestay.repository.ContractRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ContractService {

    private final ContractRepository contractRepository;
    private final com.homestay.repository.BookingRepository bookingRepository;
    private final PdfService pdfService;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public ContractService(ContractRepository contractRepository,
                           com.homestay.repository.BookingRepository bookingRepository,
                           PdfService pdfService, EmailService emailService,
                           NotificationService notificationService) {
        this.contractRepository = contractRepository;
        this.bookingRepository = bookingRepository;
        this.pdfService = pdfService;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ContractSummaryResponse> getAllContracts(int page, int size, String status, String search, String sort) {
        Pageable pageable = buildPageable(page, size, sort);
        Contract.Status contractStatus = parseStatus(status);

        Page<Contract> result = contractRepository.findAllWithFilters(contractStatus, search, pageable);

        return new PageResponse<>(
                result.getContent().stream().map(ContractSummaryResponse::fromEntity).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<ContractSummaryResponse> getMyContracts(User currentUser, int page, int size, String status, String search, String sort) {
        Pageable pageable = buildPageable(page, size, sort);
        Contract.Status contractStatus = parseStatus(status);
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Contract> result = contractRepository.findByCustomerWithFilters(currentUser.getId(), contractStatus, searchParam, pageable);

        return new PageResponse<>(
                result.getContent().stream().map(ContractSummaryResponse::fromEntity).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }


    @Transactional(readOnly = true)
    public ContractDetailResponse getContractDetail(UUID id, User currentUser) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract không tồn tại"));

        boolean isManager = currentUser.getRole() == User.Role.MANAGER;
        if (!isManager && !contract.getCustomer().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không có quyền xem hợp đồng này");
        }

        return ContractDetailResponse.fromEntity(contract);
    }

    @Transactional
    public ContractDetailResponse getOrCreateContractByBookingId(UUID bookingId, User currentUser) {
        com.homestay.entity.Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking không tồn tại"));

        boolean isManager = currentUser.getRole() == User.Role.MANAGER;
        if (!isManager && !booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không có quyền xem hợp đồng này");
        }

        Contract contract = contractRepository.findByBookingId(bookingId)
                .orElseGet(() -> {
                    if (booking.getStatus() == com.homestay.entity.Booking.Status.PENDING_DEPOSIT || 
                        booking.getStatus() == com.homestay.entity.Booking.Status.CANCELLED) {
                        throw new IllegalArgumentException("Booking chưa xác nhận (CONFIRMED), chưa thể có hợp đồng");
                    }
                    Contract newContract = new Contract();
                    newContract.setBooking(booking);
                    newContract.setCustomer(booking.getCustomer());
                    newContract.setRoom(booking.getRoom());
                    newContract.setDepositAmount(booking.getDepositAmount() != null ? booking.getDepositAmount() : java.math.BigDecimal.ZERO);
                    newContract.setTotalAmount(booking.getTotalAmount() != null ? booking.getTotalAmount() : java.math.BigDecimal.ZERO);
                    newContract.setCheckInDate(booking.getCheckInDate());
                    newContract.setCheckOutDate(booking.getCheckOutDate());
                    newContract.setStatus(Contract.Status.ACTIVE);
                    newContract.setGeneratedAt(LocalDateTime.now());
                    Contract saved = contractRepository.save(newContract);

                    // Gửi thông báo cho Customer khi tạo hợp đồng
                    notificationService.sendNotification(
                            booking.getCustomer().getId(),
                            com.homestay.entity.Notification.Type.CONTRACT_GENERATED,
                            "Contract Generated",
                            "Your accommodation contract for booking has been generated and sent to your email.",
                            saved.getId(), "Contract"
                    );

                    return saved;
                });

        return ContractDetailResponse.fromEntity(contract);
    }

    @Transactional(readOnly = true)
    public byte[] downloadContractPdf(UUID id, User currentUser) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract không tồn tại"));

        boolean isManager = currentUser.getRole() == User.Role.MANAGER;
        if (!isManager && !contract.getCustomer().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không có quyền tải hợp đồng này");
        }

        return pdfService.generateContractPdf(contract);
    }

    @Transactional
    public void resendContractEmail(UUID id, String targetEmail) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract không tồn tại"));

        byte[] pdfBytes = pdfService.generateContractPdf(contract);

        String email = targetEmail != null && !targetEmail.isBlank() ? targetEmail : contract.getCustomer().getEmail();
        String subject = "Accommodation Contract - Booking #" + contract.getBooking().getId();
        String text = "Dear " + (contract.getCustomer().getFullName() != null ? contract.getCustomer().getFullName() : "Customer") + ",\n\n" +
                "Please find attached your accommodation contract for your upcoming stay at " + 
                contract.getRoom().getProperty().getName() + ".\n\n" +
                "Thank you for choosing us!\n";

        emailService.sendEmailWithAttachment(email, subject, text, pdfBytes, "Contract_" + contract.getId() + ".pdf");

        contract.setSentAt(LocalDateTime.now());
        contractRepository.save(contract);
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

        return PageRequest.of(page, size, Sort.by(direction, field));
    }

    private Contract.Status parseStatus(String status) {
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) return null;
        try {
            return Contract.Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Transactional
    public void autoGenerateAndSendContract(UUID bookingId, User currentUser) {
        ContractDetailResponse contractResp = getOrCreateContractByBookingId(bookingId, currentUser);
        // Chạy việc gửi mail trên một luồng riêng để không block API (tránh Axios timeout)
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                resendContractEmail(contractResp.getId(), null);
            } catch (Exception e) {
                System.err.println("Lỗi khi gửi email hợp đồng (chưa cấu hình SMTP): " + e.getMessage());
            }
        });
    }
}

