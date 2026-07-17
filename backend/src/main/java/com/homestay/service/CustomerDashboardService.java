package com.homestay.service;

import com.homestay.dto.response.BookingSummaryResponse;
import com.homestay.dto.response.CustomerDashboardResponse;
import com.homestay.entity.Booking;
import com.homestay.entity.Notification;
import com.homestay.entity.Payment;
import com.homestay.entity.User;
import com.homestay.exception.ForbiddenException;
import com.homestay.repository.BookingRepository;
import com.homestay.repository.MaintenanceTicketRepository;
import com.homestay.repository.NotificationRepository;
import com.homestay.repository.PaymentRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class CustomerDashboardService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final MaintenanceTicketRepository maintenanceTicketRepository;

    public CustomerDashboardService(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            NotificationRepository notificationRepository,
            MaintenanceTicketRepository maintenanceTicketRepository) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.notificationRepository = notificationRepository;
        this.maintenanceTicketRepository = maintenanceTicketRepository;
    }

    @Transactional(readOnly = true)
    public CustomerDashboardResponse getDashboard(User currentUser) {
        if (currentUser.getRole() != User.Role.CUSTOMER) {
            throw new ForbiddenException("Chỉ khách hàng mới truy cập dashboard này");
        }

        LocalDate today = LocalDate.now();
        var customerId = currentUser.getId();

        long activeCount = bookingRepository.countActiveByCustomerId(customerId);
        long pendingDepositBookings = bookingRepository.findUpcomingByCustomerId(customerId, today).stream()
                .filter(b -> b.getStatus() == Booking.Status.PENDING_DEPOSIT)
                .count();
        long pendingPaymentRecords = paymentRepository.countByCustomerIdAndStatus(
                customerId, Payment.Status.PENDING);
        int pendingPayments = (int) (pendingDepositBookings + pendingPaymentRecords);

        long openTickets = maintenanceTicketRepository.countByCustomerIdAndStatusIn(
                customerId,
                List.of(
                        com.homestay.entity.MaintenanceTicket.Status.OPEN,
                        com.homestay.entity.MaintenanceTicket.Status.IN_PROGRESS
                ));

        long unread = notificationRepository.countByUserIdAndIsReadFalse(customerId);

        CustomerDashboardResponse.UpcomingEvent checkIn = bookingRepository
                .findFirstByCustomerIdAndStatusAndCheckInDateGreaterThanEqualOrderByCheckInDateAsc(
                        customerId, Booking.Status.CONFIRMED, today)
                .map(b -> toEvent(b, b.getCheckInDate()))
                .orElse(null);

        CustomerDashboardResponse.UpcomingEvent checkOut = bookingRepository
                .findFirstByCustomerIdAndStatusAndCheckOutDateGreaterThanEqualOrderByCheckOutDateAsc(
                        customerId, Booking.Status.CHECKED_IN, today)
                .map(b -> toEvent(b, b.getCheckOutDate()))
                .orElse(null);

        List<BookingSummaryResponse> upcoming = bookingRepository
                .findUpcomingByCustomerId(customerId, today)
                .stream()
                .map(BookingSummaryResponse::fromEntity)
                .toList();

        List<CustomerDashboardResponse.PaymentSummary> recentPayments = paymentRepository
                .findByCustomerIdOrderByCreatedAtDesc(customerId, PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(p -> new CustomerDashboardResponse.PaymentSummary(
                        p.getId(),
                        p.getType().name(),
                        p.getAmount(),
                        p.getStatus().name(),
                        p.getCreatedAt()))
                .toList();

        List<CustomerDashboardResponse.NotificationSummary> recentNotifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(customerId, PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(this::toNotifSummary)
                .toList();

        return new CustomerDashboardResponse(
                (int) activeCount,
                pendingPayments,
                (int) openTickets,
                (int) unread,
                checkIn,
                checkOut,
                upcoming,
                recentPayments,
                recentNotifications
        );
    }

    private CustomerDashboardResponse.UpcomingEvent toEvent(Booking b, LocalDate date) {
        long days = ChronoUnit.DAYS.between(LocalDate.now(), date);
        return new CustomerDashboardResponse.UpcomingEvent(
                b.getId(),
                b.getRoom().getRoomNumber(),
                b.getRoom().getProperty().getName(),
                date,
                Math.max(0, days)
        );
    }

    private CustomerDashboardResponse.NotificationSummary toNotifSummary(Notification n) {
        return new CustomerDashboardResponse.NotificationSummary(
                n.getId(),
                n.getTitle(),
                n.getContent(),
                n.getType().name(),
                Boolean.TRUE.equals(n.getIsRead()),
                n.getCreatedAt()
        );
    }
}
