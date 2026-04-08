import { Test } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';
import { Hold, HoldStatus } from '../holds/entities/hold.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Hotel } from '../hotels/entities/hotel.entity';

describe('RoomsService', () => {
  let service: RoomsService;

  const buildQb = (overrides: Record<string, unknown> = {}) => ({
    select: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    ...overrides,
  });

  let roomQb: ReturnType<typeof buildQb>;
  let holdQb: ReturnType<typeof buildQb>;
  let reservationQb: ReturnType<typeof buildQb>;

  const mockRoomRepository = { createQueryBuilder: jest.fn() };
  const mockHoldRepository = { createQueryBuilder: jest.fn() };
  const mockReservationRepository = { createQueryBuilder: jest.fn() };
  const mockHotelRepository = {};

  let mockManager: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getRepositoryToken(Room), useValue: mockRoomRepository },
        { provide: getRepositoryToken(Hold), useValue: mockHoldRepository },
        { provide: getRepositoryToken(Reservation), useValue: mockReservationRepository },
        { provide: getRepositoryToken(Hotel), useValue: mockHotelRepository },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    jest.clearAllMocks();

    roomQb = buildQb();
    holdQb = buildQb();
    reservationQb = buildQb();

    mockRoomRepository.createQueryBuilder.mockReturnValue(roomQb);
    mockHoldRepository.createQueryBuilder.mockReturnValue(holdQb);
    mockReservationRepository.createQueryBuilder.mockReturnValue(reservationQb);

    mockManager = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDataSource.transaction.mockImplementation(
      (cb: (m: typeof mockManager) => Promise<unknown>) => cb(mockManager),
    );
  });

  describe('getAvailableRooms', () => {
    it('returns all rooms when no blockedIds exist', async () => {
      const rooms = [{ id: 'r1' }, { id: 'r2' }];
      holdQb.getRawMany.mockResolvedValue([]);
      reservationQb.getRawMany.mockResolvedValue([]);
      roomQb.getMany.mockResolvedValue(rooms);

      const result = await service.getAvailableRooms({
        checkin: '2026-05-10',
        checkout: '2026-05-12',
      });

      expect(result).toEqual(rooms);
      expect(roomQb.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('NOT IN'),
        expect.anything(),
      );
    });

    it('excludes blocked rooms when holds and reservations exist', async () => {
      holdQb.getRawMany.mockResolvedValue([{ hold_room_id: 'room-blocked' }]);
      reservationQb.getRawMany.mockResolvedValue([]);
      roomQb.getMany.mockResolvedValue([{ id: 'room-free' }]);

      const result = await service.getAvailableRooms({
        checkin: '2026-05-10',
        checkout: '2026-05-12',
      });

      expect(roomQb.andWhere).toHaveBeenCalledWith(
        'room.id NOT IN (:...blockedIds)',
        { blockedIds: ['room-blocked'] },
      );
      expect(result).toEqual([{ id: 'room-free' }]);
    });

    it('filters by hotel_id when provided', async () => {
      holdQb.getRawMany.mockResolvedValue([]);
      reservationQb.getRawMany.mockResolvedValue([]);
      roomQb.getMany.mockResolvedValue([]);

      await service.getAvailableRooms({
        checkin: '2026-05-10',
        checkout: '2026-05-12',
        hotel_id: 'hotel-1',
      });

      expect(roomQb.andWhere).toHaveBeenCalledWith('room.hotel_id = :hotel_id', {
        hotel_id: 'hotel-1',
      });
    });
  });

  describe('createHoldAtomic', () => {
    const managerRoomQb = buildQb();
    const managerHoldQb = buildQb();
    const managerResQb = buildQb();

    beforeEach(() => {
      mockManager.createQueryBuilder
        .mockReturnValueOnce(managerRoomQb)
        .mockReturnValueOnce(managerHoldQb)
        .mockReturnValueOnce(managerResQb);
    });

    it('throws NotFoundException when room does not exist', async () => {
      managerRoomQb.getOne.mockResolvedValue(null);

      await expect(
        service.createHoldAtomic('bad-room', {
          checkin: '2026-05-10',
          checkout: '2026-05-12',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when a conflicting hold exists', async () => {
      managerRoomQb.getOne.mockResolvedValue({ id: 'room-1' });
      managerHoldQb.getOne.mockResolvedValue({ id: 'existing-hold' });

      await expect(
        service.createHoldAtomic('room-1', {
          checkin: '2026-05-10',
          checkout: '2026-05-12',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when a conflicting reservation exists', async () => {
      managerRoomQb.getOne.mockResolvedValue({ id: 'room-1' });
      managerHoldQb.getOne.mockResolvedValue(null);
      managerResQb.getOne.mockResolvedValue({ id: 'existing-res' });

      await expect(
        service.createHoldAtomic('room-1', {
          checkin: '2026-05-10',
          checkout: '2026-05-12',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates and returns hold when no conflicts exist', async () => {
      managerRoomQb.getOne.mockResolvedValue({ id: 'room-1' });
      managerHoldQb.getOne.mockResolvedValue(null);
      managerResQb.getOne.mockResolvedValue(null);

      const newHold = {
        id: 'hold-new',
        room_id: 'room-1',
        status: HoldStatus.PENDING,
      };
      mockManager.create.mockReturnValue(newHold);
      mockManager.save.mockResolvedValue(newHold);

      const result = await service.createHoldAtomic('room-1', {
        checkin: '2026-05-10',
        checkout: '2026-05-12',
      });

      expect(result.id).toBe('hold-new');
      expect(mockManager.save).toHaveBeenCalledWith(Hold, newHold);
    });
  });
});
