import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminRoomsService } from './admin-rooms.service';
import { Room } from '../../rooms/entities/room.entity';
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';

describe('AdminRoomsService', () => {
  let service: AdminRoomsService;

  const mockRoomRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockHotelRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  };

  const mockReservationRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminRoomsService,
        { provide: getRepositoryToken(Room), useValue: mockRoomRepository },
        { provide: getRepositoryToken(Hotel), useValue: mockHotelRepository },
        { provide: getRepositoryToken(Reservation), useValue: mockReservationRepository },
      ],
    }).compile();

    service = module.get<AdminRoomsService>(AdminRoomsService);
    jest.clearAllMocks();
    mockReservationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('list', () => {
    it('returns rooms with hotel names', async () => {
      mockRoomRepository.find.mockResolvedValue([
        { id: 'r-1', room_number: '101', hotel_id: 'h-1', type: 'SINGLE', price_per_night: '100', capacity: 2, amenities: ['wifi'], floor: 1, wing: 'A', image_url: null, created_at: new Date() },
      ]);
      mockHotelRepository.find.mockResolvedValue([{ id: 'h-1', name: 'Hotel Test' }]);

      const result = await service.list();

      expect(result).toHaveLength(1);
      expect((result[0] as any).hotel_name).toBe('Hotel Test');
      expect((result[0] as any).price_per_night).toBe(100);
    });

    it('returns null hotel_name when hotel not found', async () => {
      mockRoomRepository.find.mockResolvedValue([
        { id: 'r-1', room_number: '101', hotel_id: 'unknown', type: 'SINGLE', price_per_night: '80', capacity: 1, amenities: [], floor: null, wing: null, image_url: null, created_at: new Date() },
      ]);
      mockHotelRepository.find.mockResolvedValue([]);

      const result = await service.list();

      expect((result[0] as any).hotel_name).toBeNull();
    });
  });

  describe('create', () => {
    const dto = {
      room_number: '201', hotel_id: 'h-1', type: 'DOUBLE' as any,
      price_per_night: 150, capacity: 3, amenities: ['wifi', 'tv'],
    };

    it('creates and returns room when hotel exists and number is unique', async () => {
      mockHotelRepository.findOne.mockResolvedValue({ id: 'h-1' });
      mockRoomRepository.findOne.mockResolvedValue(null);
      mockRoomRepository.create.mockReturnValue(dto);
      mockRoomRepository.save.mockResolvedValue({ id: 'r-new', ...dto });

      const result = await service.create(dto as any);

      expect(result.id).toBe('r-new');
    });

    it('throws NotFoundException when hotel not found', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when room number already exists in hotel', async () => {
      mockHotelRepository.findOne.mockResolvedValue({ id: 'h-1' });
      mockRoomRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('updates and returns room', async () => {
      const room = { id: 'r-1', room_number: '101', price_per_night: 100 };
      mockRoomRepository.findOne.mockResolvedValue(room);
      mockRoomRepository.save.mockResolvedValue({ ...room, price_per_night: 200 });

      const result = await service.update('r-1', { price_per_night: 200 });

      expect(result.price_per_night).toBe(200);
    });

    it('throws NotFoundException when room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', { price_per_night: 200 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes room with no active reservations', async () => {
      mockRoomRepository.findOne.mockResolvedValue({ id: 'r-1' });
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockRoomRepository.remove.mockResolvedValue(undefined);

      await service.remove('r-1');

      expect(mockRoomRepository.remove).toHaveBeenCalled();
    });

    it('throws NotFoundException when room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when room has active reservations', async () => {
      mockRoomRepository.findOne.mockResolvedValue({ id: 'r-1' });
      mockQueryBuilder.getCount.mockResolvedValue(3);

      await expect(service.remove('r-1')).rejects.toThrow(ConflictException);
    });
  });
});
