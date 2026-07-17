package com.homestay.configs;

import com.homestay.entity.Floor;
import com.homestay.entity.Property;
import com.homestay.entity.Room;
import com.homestay.entity.RoomImage;
import com.homestay.repository.FloorRepository;
import com.homestay.repository.PropertyRepository;
import com.homestay.repository.RoomImageRepository;
import com.homestay.repository.RoomRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seed homestay/resort + phòng demo khi DB trống hoặc thiếu dữ liệu Hà Nội (SCR-07).
 */
@Component
@Order(15)
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = false)
public class HomestayDemoDataSeeder implements ApplicationRunner {

    private static final String IMG =
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop";

    private final PropertyRepository propertyRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;

    public HomestayDemoDataSeeder(
            PropertyRepository propertyRepository,
            FloorRepository floorRepository,
            RoomRepository roomRepository,
            RoomImageRepository roomImageRepository) {
        this.propertyRepository = propertyRepository;
        this.floorRepository = floorRepository;
        this.roomRepository = roomRepository;
        this.roomImageRepository = roomImageRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        syncKnownProperties();

        if (propertyRepository.count() == 0) {
            seedAll();
            System.out.println("[Seed] Created demo properties and rooms");
            return;
        }

        if (!hasKeyword("Hà Nội") && !hasKeyword("Old Quarter")) {
            seedProperty(
                    "Hà Nội Old Quarter Inn",
                    "25 Hàng Bạc, Hà Nội",
                    "Homestay phố cổ Hà Nội, đi bộ tới Hồ Hoàn Kiếm.",
                    List.of(
                            room("Standard 01", "Standard", 580_000, 2, 22),
                            room("Deluxe 02", "Deluxe", 920_000, 2, 30)
                    )
            );
            System.out.println("[Seed] Added Hà Nội Old Quarter Inn (missing from DB)");
        }
    }

    private boolean hasKeyword(String keyword) {
        return propertyRepository
                .searchByNameOrAddress(keyword, PageRequest.of(0, 1))
                .hasContent();
    }

    private void seedAll() {
        seedProperty(
                "Hà Nội Old Quarter Inn",
                "25 Hàng Bạc, Hà Nội",
                "Homestay phố cổ Hà Nội, đi bộ tới Hồ Hoàn Kiếm.",
                List.of(
                        room("Standard 01", "Standard", 580_000, 2, 22),
                        room("Deluxe 02", "Deluxe", 920_000, 2, 30)
                )
        );
        seedProperty(
                "Sunset Resort Đà Nẵng",
                "123 Nguyễn Tất Thành, Đà Nẵng",
                "Resort ven biển với hồ bơi và spa.",
                List.of(
                        room("Villa 01", "Villa", 2_500_000, 4, 80),
                        room("Deluxe 05", "Deluxe", 1_200_000, 2, 35)
                )
        );
        seedProperty(
                "Hội An Garden Villa",
                "78 Phan Bội Châu, Hội An",
                "Villa vườn phong cách Hội An cổ.",
                List.of(
                        room("Suite 03", "Suite", 1_800_000, 3, 55),
                        room("Standard 08", "Standard", 750_000, 2, 25)
                )
        );
        seedProperty(
                "Phú Quốc Beach House",
                "12 Trần Hưng Đạo, Phú Quốc",
                "Nhà nghỉ gần biển, view hoàng hôn.",
                List.of(
                        room("Standard 12", "Standard", 650_000, 2, 28),
                        room("Studio 04", "Studio", 890_000, 2, 32)
                )
        );
        seedProperty(
                "Mountain View Homestay",
                "456 Trần Phú, Đà Lạt",
                "Homestay view núi, không khí mát mẻ.",
                List.of(
                        room("Deluxe 07", "Deluxe", 980_000, 2, 30),
                        room("Standard 09", "Standard", 620_000, 2, 24)
                )
        );
    }

    private void seedProperty(String name, String address, String description, List<RoomSeed> rooms) {
        Property property = new Property();
        property.setName(name);
        property.setAddress(address);
        property.setDescription(description);
        property.setStatus(Property.Status.ACTIVE);
        propertyRepository.save(property);

        Floor floor = new Floor();
        floor.setProperty(property);
        floor.setFloorNumber(1);
        floor.setDescription("Tầng 1");
        floorRepository.save(floor);

        for (RoomSeed seed : rooms) {
            Room room = new Room();
            room.setProperty(property);
            room.setFloor(floor);
            room.setRoomNumber(seed.number);
            room.setRoomType(seed.type);
            room.setPricePerNight(BigDecimal.valueOf(seed.price));
            room.setCapacity(seed.capacity);
            room.setArea(BigDecimal.valueOf(seed.area));
            room.setDescription("Phòng " + seed.type + " tại " + name);
            room.setStatus(Room.Status.AVAILABLE);
            roomRepository.save(room);

            RoomImage image = new RoomImage();
            image.setRoom(room);
            image.setImageUrl(IMG);
            image.setIsPrimary(true);
            image.setSortOrder(0);
            roomImageRepository.save(image);
        }
    }

    private static RoomSeed room(String number, String type, long price, int capacity, int area) {
        return new RoomSeed(number, type, price, capacity, area);
    }

    private record RoomSeed(String number, String type, long price, int capacity, int area) {}

    /** Cập nhật tên/địa chỉ Unicode cho property demo đã tồn tại. */
    private void syncKnownProperties() {
        propertyRepository
                .searchByNameOrAddress("Old Quarter", PageRequest.of(0, 10))
                .forEach(p -> {
                    p.setName("Hà Nội Old Quarter Inn");
                    p.setAddress("25 Hàng Bạc, Hà Nội");
                    if (p.getDescription() == null || p.getDescription().isBlank()) {
                        p.setDescription("Homestay phố cổ Hà Nội, đi bộ tới Hồ Hoàn Kiếm.");
                    }
                    propertyRepository.save(p);
                });
    }
}
