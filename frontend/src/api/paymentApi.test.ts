import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('./axiosInstance', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from './axiosInstance';
import { paymentApi } from './paymentApi';

describe('paymentApi.verifyPayment', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it('posts status and note then returns envelope', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        data: { id: 'pay-1', status: 'PAID', verificationNote: 'Bank receipt OK' },
      },
    });
    const res = await paymentApi.verifyPayment('pay-1', 'PAID', 'Bank receipt OK');
    expect(api.post).toHaveBeenCalledWith('/api/manager/payments/pay-1/verify', {
      status: 'PAID',
      note: 'Bank receipt OK',
    });
    expect(res.success).toBe(true);
    expect(res.data.verificationNote).toBe('Bank receipt OK');
  });
});
