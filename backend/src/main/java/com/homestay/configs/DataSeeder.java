package com.homestay.configs;

import com.homestay.entity.*;
import com.homestay.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final ManagerPropertyAssignmentRepository assignmentRepository;

    public DataSeeder(UserRepository userRepository,
                      PropertyRepository propertyRepository,
                      FloorRepository floorRepository,
                      RoomRepository roomRepository,
                      BookingRepository bookingRepository,
                      PasswordEncoder passwordEncoder,
                      ManagerPropertyAssignmentRepository assignmentRepository) {
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.floorRepository = floorRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
        this.assignmentRepository = assignmentRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedUsers();
        seedMockData();
        seedManagerAssignments();
    }

    private void seedUsers() {
        if (!userRepository.existsByEmail("customer@dev.local")) {
            User user = new User();
            user.setFullName("Dev Customer");
            user.setEmail("customer@dev.local");
            user.setPhone("0987654321");
            user.setPasswordHash(passwordEncoder.encode("password123"));
            user.setRole(User.Role.CUSTOMER);
            user.setStatus(User.Status.ACTIVE);
            userRepository.save(user);
        }

        if (!userRepository.existsByEmail("manager@dev.local")) {
            User user = new User();
            user.setFullName("Dev Manager");
            user.setEmail("manager@dev.local");
            user.setPhone("0912345678");
            user.setPasswordHash(passwordEncoder.encode("password123"));
            user.setRole(User.Role.MANAGER);
            user.setStatus(User.Status.ACTIVE);
            userRepository.save(user);
        }

        if (!userRepository.existsByEmail("admin@dev.local")) {
            User user = new User();
            user.setFullName("Dev Admin");
            user.setEmail("admin@dev.local");
            user.setPhone("0988888888");
            user.setPasswordHash(passwordEncoder.encode("password123"));
            user.setRole(User.Role.ADMIN);
            user.setStatus(User.Status.ACTIVE);
            userRepository.save(user);
        }
    }

    private void seedManagerAssignments() {
        User manager = userRepository.findByEmail("manager@dev.local").orElse(null);
        User admin = userRepository.findByEmail("admin@dev.local").orElse(null);
        if (manager == null || admin == null) return;

        List<Property> properties = propertyRepository.findAll();
        for (Property property : properties) {
            boolean exists = assignmentRepository.existsByManagerIdAndPropertyIdAndStatus(
                manager.getId(), property.getId(), ManagerPropertyAssignment.Status.ACTIVE);
            if (!exists) {
                ManagerPropertyAssignment assignment = new ManagerPropertyAssignment();
                assignment.setManager(manager);
                assignment.setProperty(property);
                assignment.setAssignedBy(admin);
                assignment.setAssignedAt(LocalDateTime.now());
                assignment.setStatus(ManagerPropertyAssignment.Status.ACTIVE);
                assignmentRepository.save(assignment);
            }
        }
    }


    private void seedMockData() {
        User customer = userRepository.findByEmail("customer@dev.local").orElse(null);
        if (customer == null) return;

        // Mock 1: Sunset Resort Đà Nẵng
        seedMockBooking(
                UUID.fromString("b0010000-0000-0000-0000-000000000001"),
                "Sunset Resort Đà Nẵng",
                "123 Nguyễn Tất Thành, Đà Nẵng",
                "Villa 01",
                "Villa",
                new BigDecimal("2500000"),
                4,
                LocalDate.of(2026, 7, 10),
                LocalDate.of(2026, 7, 13),
                2,
                new BigDecimal("7500000"),
                Booking.Status.CONFIRMED,
                customer
        );

        // Mock 2: Mountain View Homestay
        seedMockBooking(
                UUID.fromString("b0020000-0000-0000-0000-000000000002"),
                "Mountain View Homestay",
                "456 Trần Phú, Đà Lạt",
                "Deluxe 05",
                "Deluxe",
                new BigDecimal("1200000"),
                2,
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 8, 3),
                1,
                new BigDecimal("2400000"),
                Booking.Status.PENDING_DEPOSIT,
                customer
        );

        // Mock 3: Hội An Garden Villa
        seedMockBooking(
                UUID.fromString("b0030000-0000-0000-0000-000000000003"),
                "Hội An Garden Villa",
                "78 Phan Bội Châu, Hội An",
                "Suite 03",
                "Suite",
                new BigDecimal("1800000"),
                2,
                LocalDate.of(2026, 4, 5),
                LocalDate.of(2026, 4, 8),
                2,
                new BigDecimal("5400000"),
                Booking.Status.CHECKED_OUT,
                customer
        );

        // Mock 4: Phú Quốc Beach House
        seedMockBooking(
                UUID.fromString("b0040000-0000-0000-0000-000000000004"),
                "Phú Quốc Beach House",
                "12 Trần Hưng Đạo, Phú Quốc",
                "Standard 12",
                "Standard",
                new BigDecimal("750000"),
                1,
                LocalDate.of(2026, 3, 15),
                LocalDate.of(2026, 3, 17),
                1,
                new BigDecimal("1500000"),
                Booking.Status.CANCELLED,
                customer
        );
    }

    private void seedMockBooking(UUID bookingId, String propName, String address, String roomNum, String roomType,
                                 BigDecimal price, int capacity, LocalDate checkIn, LocalDate checkOut, int guests,
                                 BigDecimal totalAmount, Booking.Status status, User customer) {
        if (bookingRepository.existsById(bookingId)) {
            return;
        }

        Property property = propertyRepository.findAll().stream()
                .filter(p -> p.getName().equalsIgnoreCase(propName))
                .findFirst().orElseGet(() -> {
                    Property p = new Property();
                    p.setName(propName);
                    p.setAddress(address);
                    p.setDescription(propName + " - Description");
                    p.setStatus(Property.Status.ACTIVE);
                    return propertyRepository.save(p);
                });

        Floor floor = floorRepository.findByPropertyOrderByFloorNumberAsc(property).stream().findFirst().orElseGet(() -> {
            Floor f = new Floor();
            f.setProperty(property);
            f.setFloorNumber(1);
            f.setDescription("Floor 1");
            return floorRepository.save(f);
        });

        Room room = roomRepository.findAll().stream()
                .filter(r -> r.getProperty().getId().equals(property.getId()) && r.getRoomNumber().equalsIgnoreCase(roomNum))
                .findFirst().orElseGet(() -> {
                    Room r = new Room();
                    r.setProperty(property);
                    r.setFloor(floor);
                    r.setRoomNumber(roomNum);
                    r.setRoomType(roomType);
                    r.setPricePerNight(price);
                    r.setCapacity(capacity);
                    r.setArea(new BigDecimal("50.0"));
                    r.setDescription("Room " + roomNum + " description");
                    r.setStatus(Room.Status.AVAILABLE);
                    return roomRepository.save(r);
                });

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setCustomer(customer);
        booking.setRoom(room);
        booking.setCheckInDate(checkIn);
        booking.setCheckOutDate(checkOut);
        booking.setGuestCount(guests);
        booking.setTotalAmount(totalAmount);
        booking.setDepositAmount(totalAmount.multiply(new BigDecimal("0.4")));
        booking.setRemainingAmount(totalAmount.multiply(new BigDecimal("0.6")));
        booking.setStatus(status);
        booking.setSpecialRequests("Special request for " + roomNum);
        bookingRepository.save(booking);
    }
}
