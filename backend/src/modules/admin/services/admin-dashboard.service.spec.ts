import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminDashboardService } from './admin-dashboard.service';
import { Reservation, ReservationStatus } from '../../reservations/entities/reservation.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Payment } from '../../payments/entities/payment.entity';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;

  const mockReservationRepository = { find: jest.fn() };
  const mockRoomRepository = { find: jest.fn() };
  const mockHotelRepository = { find: jest.fn() };
  const mockPaymentRepository = {};

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        { provide: getRepositoryToken(Reservation), useValue: mockReservationRepository },
        { provide: getRepositoryToken(Room), useValue: mockRoomRepository },
        { provide: getRepositoryToken(Hotel), useValue: mockHotelRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
      ],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('returns stats with zero revenue when no confirmed reservations', async () => {
      mockReservationRepository.find.mockResolvedValue([]);
      mockRoomRepository.find.mockResolvedValue([]);
      mockHotelRepository.find.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result).toEqual({
        total_revenue: 0,
        total_reservations: 0,
        top_rooms: [],
        top_customers: [],
        all_rooms_stats: [],
        all_customers_stats: [],
      });
    });

    it('calculates revenue and rankings correctly', async () => {
      mockReservationRepository.find.mockResolvedValue([
        {
          id: 'r1',
          room_id: 'room-1',
          checkin: '2026-06-01',
          checkout: '2026-06-03',
          status: ReservationStatus.CONFIRMED,
          customer_email: 'guest@test.com',
          customer_name: 'Guest',
        },
      ]);
      mockRoomRepository.find.mockResolvedValue([
        { id: 'room-1', room_number: '101', hotel_id: 'hotel-1', price_per_night: '100' },
      ]);
      mockHotelRepository.find.mockResolvedValue([
        { id: 'hotel-1', name: 'Hotel Test' },
      ]);

      const result = (await service.getStats()) as any;

      expect(result.total_revenue).toBe(200);
      expect(result.total_reservations).toBe(1);
      expect(result.top_rooms).toHaveLength(1);
      expect(result.top_rooms[0].room_number).toBe('101');
      expect(result.top_rooms[0].hotel_name).toBe('Hotel Test');
      expect(result.top_customers).toHaveLength(1);
      expect(result.top_customers[0].email).toBe('guest@test.com');
    });

    it('skips reservations when room is not found', async () => {
      mockReservationRepository.find.mockResolvedValue([
        {
          id: 'r1',
          room_id: 'non-existent',
          checkin: '2026-06-01',
          checkout: '2026-06-03',
          status: ReservationStatus.CONFIRMED,
          customer_email: 'guest@test.com',
          customer_name: 'Guest',
        },
      ]);
      mockRoomRepository.find.mockResolvedValue([]);
      mockHotelRepository.find.mockResolvedValue([]);

      const result = (await service.getStats()) as any;

      expect(result.total_revenue).toBe(0);
      expect(result.total_reservations).toBe(1);
      expect(result.top_rooms).toHaveLength(0);
    });

    it('limits top lists to 5 items', async () => {
      const reservations = Array.from({ length: 7 }, (_, i) => ({
        id: `r${i}`,
        room_id: `room-${i}`,
        checkin: '2026-06-01',
        checkout: '2026-06-02',
        status: ReservationStatus.CONFIRMED,
        customer_email: `guest${i}@test.com`,
        customer_name: `Guest ${i}`,
      }));
      const rooms = Array.from({ length: 7 }, (_, i) => ({
        id: `room-${i}`,
        room_number: `${100 + i}`,
        hotel_id: 'hotel-1',
        price_per_night: '50',
      }));
      mockReservationRepository.find.mockResolvedValue(reservations);
      mockRoomRepository.find.mockResolvedValue(rooms);
      mockHotelRepository.find.mockResolvedValue([{ id: 'hotel-1', name: 'Hotel' }]);

      const result = (await service.getStats()) as any;

      expect(result.top_rooms).toHaveLength(5);
      expect(result.top_customers).toHaveLength(5);
      expect(result.all_rooms_stats).toHaveLength(7);
      expect(result.all_customers_stats).toHaveLength(7);
    });
  });
});
