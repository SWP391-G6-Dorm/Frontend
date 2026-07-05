import api from './axiosInstance';
import type { ApiResponse } from './authApi';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Params cho GET /api/reports/revenue (SCR-59) */
export interface RevenueReportParams {
  /** UUID property, undefined = tất cả */
  propertyId?: string;
  /** yyyy-MM-dd — ngày bắt đầu */
  from?: string;
  /** yyyy-MM-dd — ngày kết thúc */
  to?: string;
  /** "month" (default) | "week" */
  groupBy?: 'month' | 'week';
}

/** Doanh thu theo 1 kỳ (tháng: "2026-01" | tuần: "2026-W22") */
export interface PeriodRevenue {
  period: string;
  revenue: number;
  bookingCount: number;
}

/** Doanh thu tổng hợp theo property */
export interface PropertyRevenue {
  propertyId: string;
  propertyName: string;
  revenue: number;
  bookingCount: number;
}

/** Response data từ GET /api/reports/revenue */
export interface RevenueReportData {
  /** Tổng doanh thu (DEPOSIT + REMAINING_BALANCE, PAID) */
  totalRevenue: number;
  /** Doanh thu đặt cọc 40% */
  depositRevenue: number;
  /** Doanh thu phần còn lại 60% */
  balanceRevenue: number;
  /** Số booking phân biệt có payment PAID */
  totalBookingCount: number;
  /** Doanh thu theo kỳ — dùng cho Bar Chart */
  byPeriod: PeriodRevenue[];
  /** Doanh thu theo property — dùng cho Horizontal Bar */
  byProperty: PropertyRevenue[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const reportApi = {
  /**
   * GET /api/reports/revenue
   * SCR-59 — Báo cáo doanh thu cho Manager.
   * Yêu cầu role MANAGER.
   */
  getRevenue: async (params: RevenueReportParams = {}): Promise<ApiResponse<RevenueReportData>> => {
    // Loại bỏ các key có giá trị undefined để không gửi lên query string
    const cleanParams: Record<string, string> = {};
    if (params.propertyId) cleanParams.propertyId = params.propertyId;
    if (params.from)       cleanParams.from       = params.from;
    if (params.to)         cleanParams.to         = params.to;
    if (params.groupBy)    cleanParams.groupBy    = params.groupBy;

    const res = await api.get('/api/reports/revenue', { params: cleanParams });
    return res.data;
  },
};
