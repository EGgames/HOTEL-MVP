import { Test } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminReservationsService } from './admin-reservations.service';
import { Reservation, ReservationStatus } from '../../reservations/entities/reservation.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { MailService } from './mail.service';

describe('AdminReservationsService', () => {
  let service: AdminReservationsService;

  const mockQueryBuilder = {
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  const mockReservationRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockRoomRepository = { find: jest.fn() };
  const mockHotelRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockManager = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb: (m: typeof mockManager) => Promise<unknown>) => cb(mockManager)),
  };

  const mockMailService = {
    sendReservationConfirmation: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminReservationsService,
        { provide: getRepositoryToken(Reservation), useValue: mockReservationRepository },
        { provide: getRepositoryToken(Room), useValue: mockRoomRepository },
        { provide: getRepositoryToken(Hotel), useValue: mockHotelRepository },
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AdminReservationsService>(AdminReservationsService);
    jest.clearAllMocks();
    mockReservationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('list', () => {
    it('returns enriched reservation list', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([
        {
          id: 'r-1', reservation_code: 'ABC', room_id: 'room-1',
          checkin: '2026-06-01', checkout: '2026-06-03', status: ReservationStatus.CONFIRMED,
          customer_email: 'a@b.com', customer_name: 'A', created_at: new Date(),
        },
      ]);
      mockRoomRepository.find.mockResolvedValue([
        { id: 'room-1', room_number: '101', hotel_id: 'h-1', price_per_night: '100' },
      ]);
      mockHotelRepository.find.mockResolvedValue([{ id: 'h-1', name: 'Hotel' }]);

      const result = await service.list();

      expect(result).toHaveLength(1);
      expect((result[0] as any).hotel_name).toBe('Hotel');
      expect((result[0] as any).nights).toBe(2);
      expect((result[0] as any).total_amount).toBe(200);
    });

    it('applies status filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockRoomRepository.find.mockResolvedValue([]);
      mockHotelRepository.find.mockResolvedValue([]);

      await service.list({ status: 'CONFIRMED' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'res.status = :status',
        { status: 'CONFIRMED' },
      );
    });

    it('applies from_date filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockRoomRepository.find.mockResolvedValue([]);
      mockHotelRepository.find.mockResolvedValue([]);

      await service.list({ from_date: '2026-01-01' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'res.checkin >= :from_date',
        { from_date: '2026-01-01' },
      );
    });

    it('applies to_date filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockRoomRepository.find.mockResolvedValue([]);
      mockHotelRepository.find.mockResolvedValue([]);

      await service.list({ to_date: '2026-12-31' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'res.checkout <= :to_date',
        { to_date: '2026-12-31' },
      );
    });
  });

  describe('create', () => {
    const dto = {
      room_id: 'room-1',
      checkin: '2026-06-01',
      checkout: '2026-06-03',
      customer_email: 'guest@test.com',
      customer_name: 'Guest',
    };

    const managerQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    beforeEach(() => {
      mockManager.createQueryBuilder.mockReturnValue(managerQb);
    });

    it('creates reservation and sends email', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 'room-1', room_number: '101', hotel_id: 'h-1', price_per_night: '100',
      });
      managerQb.getOne.mockResolvedValue(null);
      mockManager.create.mockReturnValue({
        id: 'res-new', reservation_code: 'XYZ', room_id: 'room-1',
        checkin: new Date('2026-06-01'), checkout: new Date('2026-06-03'),
        status: ReservationStatus.CONFIRMED, customer_email: 'guest@test.com',
        customer_name: 'Guest', created_at: new Date(),
      });
      mockManager.save.mockImplementation((_entity, obj) => Promise.resolve(obj));
      mockHotelRepository.findOne.mockResolvedValue({ id: 'h-1', name: 'Hotel' });

      const result = (await service.create(dto)) as any;

      expect(result.reservation_code).toBe('XYZ');
      expect(mockMailService.sendReservationConfirmation).toHaveBeenCalled();
    });

    it('throws NotFoundException when room not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when conflicting reservation exists', async () => {
      mockManager.findOne.mockResolvedValue({ id: 'room-1', room_number: '101' });
      managerQb.getOne.mockResolvedValue({ id: 'conflict' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('cancel', () => {
    it('cancels reservation and returns message', async () => {
      const reservation = { id: 'r-1', status: ReservationStatus.CONFIRMED };
      mockReservationRepository.findOne.mockResolvedValue(reservation);
      mockReservationRepository.save.mockResolvedValue({ ...reservation, status: ReservationStatus.CANCELLED });

      const result = await service.cancel('r-1');

      expect(result).toEqual({ message: 'Reserva cancelada' });
      expect(reservation.status).toBe(ReservationStatus.CANCELLED);
    });

    it('throws NotFoundException when reservation not found', async () => {
      mockReservationRepository.findOne.mockResolvedValue(null);

      await expect(service.cancel('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
