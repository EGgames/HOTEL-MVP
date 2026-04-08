import axios from 'axios';
import { createHold, getHoldState } from '../services/holdService';

vi.mock('axios');

describe('holdService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createHold sends POST with room, checkin, checkout', async () => {
    axios.post.mockResolvedValue({ data: { id: 'hold-1' } });

    const result = await createHold('room-1', '2026-05-10', '2026-05-12');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/rooms/room-1/hold'),
      { checkin: '2026-05-10', checkout: '2026-05-12' },
    );
    expect(result).toEqual({ id: 'hold-1' });
  });

  it('getHoldState sends GET with holdId', async () => {
    axios.get.mockResolvedValue({ data: { id: 'hold-1', remaining_seconds: 120 } });

    const result = await getHoldState('hold-1');

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/v1/holds/hold-1'));
    expect(result).toEqual({ id: 'hold-1', remaining_seconds: 120 });
  });
});
