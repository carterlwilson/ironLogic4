import type { ApiResponse } from '@ironlogic4/shared/types/api';
import type {
  AttendanceGroupBy,
  IAttendanceSummaryResponse,
  IClientAttendanceHistory,
} from '@ironlogic4/shared';
import { authenticatedRequest } from './tokenRefresh';

export interface AttendanceRangeParams {
  from: string;
  to: string;
  groupBy: AttendanceGroupBy;
}

export interface AttendanceSummaryParams extends AttendanceRangeParams {
  page: number;
  limit: number;
  search?: string;
}

export const attendanceApi = {
  /**
   * Per-client attendance counts for the gym over a date range
   */
  async getSummary({ search, page, limit, ...range }: AttendanceSummaryParams): Promise<ApiResponse<IAttendanceSummaryResponse>> {
    const query = new URLSearchParams({ ...range, page: String(page), limit: String(limit) });
    if (search) {
      query.set('search', search);
    }
    return authenticatedRequest<ApiResponse<IAttendanceSummaryResponse>>(`/api/gym/attendance/summary?${query}`);
  },

  /**
   * One client's attendance records and counts over a date range
   */
  async getClientHistory(
    clientId: string,
    params: AttendanceRangeParams
  ): Promise<ApiResponse<IClientAttendanceHistory>> {
    const query = new URLSearchParams({ ...params });
    return authenticatedRequest<ApiResponse<IClientAttendanceHistory>>(
      `/api/gym/attendance/clients/${clientId}?${query}`
    );
  },
};
