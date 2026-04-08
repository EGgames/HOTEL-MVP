import axios from 'axios';
import { getAvailableRooms } from '../services/roomService';

vi.mock('axios');

describe('roomService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAvailableRooms sends GET with checkin/checkout params', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 'r1' }] });

    const result = await getAvailableRooms('2026-05-10', '2026-05-12');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/rooms/available'),
      { params: { checkin: '2026-05-10', checkout: '2026-05-12' } },
    );
    expect(result).toEqual([{ id: 'r1' }]);
  });

  it('getAvailableRooms includes hotel_id when provided', async () => {
    axios.get.mockResolvedValue({ data: [] });

    await getAvailableRooms('2026-05-10', '2026-05-12', 'hotel-1');

    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      { params: { checkin: '2026-05-10', checkout: '2026-05-12', hotel_id: 'hotel-1' } },
    );
  });
});
