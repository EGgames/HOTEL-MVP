import axios from 'axios';
import { processPayment } from '../services/paymentService';

vi.mock('axios');

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processPayment sends POST with hold_id, amount, idempotency_key', async () => {
    axios.post.mockResolvedValue({ data: { id: 'pay-1', status: 'SUCCESS' } });

    const result = await processPayment('hold-1', 200, 'key-1');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/payments'),
      { hold_id: 'hold-1', amount: 200, idempotency_key: 'key-1' },
    );
    expect(result).toEqual({ id: 'pay-1', status: 'SUCCESS' });
  });
});
