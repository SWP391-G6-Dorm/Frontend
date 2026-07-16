package com.homestay.service;

import com.homestay.dto.request.UpdateSystemSettingsRequest;
import com.homestay.dto.response.SystemSettingsResponse;
import com.homestay.entity.SystemSetting;
import com.homestay.entity.User;
import com.homestay.exception.BusinessException;
import com.homestay.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * SCR-56 - System Settings (Admin). GET + PUT only.
 * Logs / Content Moderation are FE mock — not implemented here.
 */
@Service
@RequiredArgsConstructor
public class AdminSettingsService {

    public static final String KEY_DEPOSIT = "DEPOSIT_PERCENTAGE";
    public static final String KEY_CANCEL = "CANCEL_TIMEOUT_HOURS";

    private static final int DEFAULT_DEPOSIT = 40;
    private static final int DEFAULT_CANCEL = 24;

    private final SystemSettingRepository systemSettingRepository;

    @Transactional(readOnly = true)
    public SystemSettingsResponse getSettings() {
        Map<String, String> map = loadKeyMap();
        return SystemSettingsResponse.builder()
                .depositPercentage(parseIntOrDefault(map.get(KEY_DEPOSIT), DEFAULT_DEPOSIT))
                .cancelTimeoutHours(parseIntOrDefault(map.get(KEY_CANCEL), DEFAULT_CANCEL))
                .build();
    }

    @Transactional
    public SystemSettingsResponse updateSettings(UpdateSystemSettingsRequest req, User admin) {
        if (req.getDepositPercentage() != null) {
            int v = req.getDepositPercentage();
            if (v < 10 || v > 100) {
                throw new BusinessException("depositPercentage khong hop le");
            }
            upsert(KEY_DEPOSIT, String.valueOf(v), "Deposit percentage for new bookings", admin);
        }
        if (req.getCancelTimeoutHours() != null) {
            int v = req.getCancelTimeoutHours();
            if (v < 1 || v > 168) {
                throw new BusinessException("cancelTimeoutHours khong hop le");
            }
            upsert(KEY_CANCEL, String.valueOf(v), "Hours allowed to cancel after booking created", admin);
        }
        return getSettings();
    }

    private Map<String, String> loadKeyMap() {
        List<SystemSetting> rows = systemSettingRepository.findByKeyIn(List.of(KEY_DEPOSIT, KEY_CANCEL));
        return rows.stream()
                .filter(s -> s.getKey() != null)
                .collect(Collectors.toMap(SystemSetting::getKey, s -> s.getValue() == null ? "" : s.getValue(), (a, b) -> a));
    }

    private void upsert(String key, String value, String description, User admin) {
        SystemSetting setting = systemSettingRepository.findByKey(key).orElseGet(() -> {
            SystemSetting s = new SystemSetting();
            s.setKey(key);
            s.setDescription(description);
            return s;
        });
        setting.setValue(value);
        setting.setUpdatedBy(admin);
        if (setting.getDescription() == null || setting.getDescription().isBlank()) {
            setting.setDescription(description);
        }
        systemSettingRepository.save(setting);
    }

    private int parseIntOrDefault(String raw, int defaultValue) {
        if (raw == null || raw.isBlank()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}