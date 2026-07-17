package com.homestay.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

/**
 * SCR-43: Manager từ chối báo cáo hư hại.
 * Docs: body `{ "note": "..." }`. Giữ alias `reason` để tương thích client cũ.
 */
@Data
public class RejectDamageReportRequest {

    private String note;

    /** Prefer {@link #note}; kept for existing FE callers. */
    @Deprecated
    private String reason;

    @JsonIgnore
    public String resolvedNote() {
        if (note != null && !note.isBlank()) {
            return note.trim();
        }
        if (reason != null && !reason.isBlank()) {
            return reason.trim();
        }
        return null;
    }

    @AssertTrue(message = "Cần nhập lý do từ chối (note)")
    @JsonIgnore
    public boolean isNotePresent() {
        return resolvedNote() != null;
    }
}
