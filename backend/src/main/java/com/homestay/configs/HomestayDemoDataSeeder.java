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
import java.util.Set;

/**
 * Seed homestay/resort + phòng demo khi DB trống hoặc thiếu dữ liệu Hà Nội (SCR-07).
 */
@Component
@Order(15)
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = false)
public class HomestayDemoDataSeeder implements ApplicationRunner {

    /** Bộ ảnh giới thiệu cũ (đồng bộ mọi property) — dùng để phát hiện và thay thế. */
    private static final Set<String> LEGACY_GENERIC_GALLERY = Set.of(
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop"
    );

    private static final String[] HANOI_GALLERY = {
            "https://images.unsplash.com/photo-1559592413-7cec9d0193c3?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
    };

    private static final String[] DANANG_GALLERY = {
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1571008887538-b36bb930f578?w=800&h=600&fit=crop",
    };

    private static final String[] HOIAN_GALLERY = {
            "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1602002418082-8251774c8ef0?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1584132967334-10e146bdffe3?w=800&h=600&fit=crop",
    };

    private static final String[] PHUQUOC_GALLERY = {
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1473496162514-62a872171104?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1431540211162-84a671675558?w=800&h=600&fit=crop",
    };

    private static final String[] DALAT_GALLERY = {
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    };

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
        resyncPropertyGalleryImages();

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

        String[] gallery = galleryForProperty(name);

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

            saveGalleryImages(room, gallery);
        }
    }

    private void saveGalleryImages(Room room, String[] galleryUrls) {
        for (int i = 0; i < galleryUrls.length; i++) {
            RoomImage image = new RoomImage();
            image.setRoom(room);
            image.setImageUrl(galleryUrls[i]);
            image.setIsPrimary(i == 0);
            image.setSortOrder(i);
            roomImageRepository.save(image);
        }
    }

    /** Gán ảnh giới thiệu theo từng homestay/resort; thay bộ ảnh generic cũ. */
    private void resyncPropertyGalleryImages() {
        int roomsUpdated = 0;
        for (Room room : roomRepository.findAll()) {
            String propertyName = room.getProperty().getName();
            String[] expected = galleryForProperty(propertyName);
            List<RoomImage> existing = roomImageRepository.findByRoomIdOrderBySortOrderAsc(room.getId());

            if (!needsGalleryResync(existing, expected)) {
                if (existing.size() < expected.length) {
                    int start = existing.size();
                    for (int i = start; i < expected.length; i++) {
                        RoomImage image = new RoomImage();
                        image.setRoom(room);
                        image.setImageUrl(expected[i]);
                        image.setIsPrimary(false);
                        image.setSortOrder(i);
                        roomImageRepository.save(image);
                    }
                    roomsUpdated++;
                }
                continue;
            }

            roomImageRepository.deleteAllByRoomId(room.getId());
            saveGalleryImages(room, expected);
            roomsUpdated++;
        }
        if (roomsUpdated > 0) {
            System.out.println("[Seed] Synced property-specific gallery for " + roomsUpdated + " room(s)");
        }
    }

    private boolean needsGalleryResync(List<RoomImage> existing, String[] expected) {
        if (existing.isEmpty()) {
            return true;
        }
        if (existing.stream().anyMatch(img -> LEGACY_GENERIC_GALLERY.contains(img.getImageUrl()))) {
            return true;
        }
        if (existing.size() != expected.length) {
            return true;
        }
        for (int i = 0; i < expected.length; i++) {
            if (!expected[i].equals(existing.get(i).getImageUrl())) {
                return true;
            }
        }
        return false;
    }

    private String[] galleryForProperty(String propertyName) {
        String normalized = propertyName == null ? "" : propertyName.toLowerCase();
        if (containsAny(normalized, "hà nội", "ha noi", "old quarter", "hanoi")) {
            return HANOI_GALLERY;
        }
        if (containsAny(normalized, "đà nẵng", "da nang", "sunset resort")) {
            return DANANG_GALLERY;
        }
        if (containsAny(normalized, "hội an", "hoi an", "garden villa")) {
            return HOIAN_GALLERY;
        }
        if (containsAny(normalized, "phú quốc", "phu quoc", "beach house")) {
            return PHUQUOC_GALLERY;
        }
        if (containsAny(normalized, "đà lạt", "da lat", "mountain view")) {
            return DALAT_GALLERY;
        }
        return DANANG_GALLERY;
    }

    private static boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
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
