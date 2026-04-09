import axios from 'axios';
import { getReservation, getReservationByCode } from '../services/reservationService';

vi.mock('axios');

describe('reservationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getReservation sends GET with reservationId', async () => {
    axios.get.mockResolvedValue({ data: { id: 'res-1' } });

    const result = await getReservation('res-1');

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/v1/reservations/res-1'));
    expect(result).toEqual({ id: 'res-1' });
  });

  it('getReservationByCode sends GET with reservation_code param', async () => {
    axios.get.mockResolvedValue({ data: { reservation_code: 'ABC12345' } });

    const result = await getReservationByCode('ABC12345');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/reservations'),
      { params: { reservation_code: 'ABC12345' } },
    );
    expect(result).toEqual({ reservation_code: 'ABC12345' });
  });
});
