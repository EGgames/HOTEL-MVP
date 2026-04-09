import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { Room, RoomType } from '../rooms/entities/room.entity';

describe('ReservationsService', () => {
  let service: ReservationsService;

  const mockReservationRepository = {
    findOne: jest.fn(),
  };

  const mockRoomRepository = {
    findOne: jest.fn(),
  };

  const reservationBase = {
    id: 'res-1',
    reservation_code: 'ABC12345',
    room_id: 'room-1',
    hold_id: 'hold-1',
    payment_id: 'pay-1',
    checkin: new Date('2026-05-10'),
    checkout: new Date('2026-05-12'),
    status: ReservationStatus.CONFIRMED,
    created_at: new Date('2026-05-01T10:00:00.000Z'),
    updated_at: new Date('2026-05-01T10:00:00.000Z'),
  } as Reservation;

  const roomBase = {
    id: 'room-1',
    room_number: '101',
    hotel_id: 'hotel-1',
    type: RoomType.DOUBLE,
    price_per_night: 150.5,
    capacity: 2,
    amenities: ['wifi'],
    created_at: new Date('2026-01-01T10:00:00.000Z'),
    updated_at: new Date('2026-01-01T10:00:00.000Z'),
  } as Room;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getRepositoryToken(Reservation), useValue: mockReservationRepository },
        { provide: getRepositoryToken(Room), useValue: mockRoomRepository },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    jest.clearAllMocks();
  });

  describe('getReservationById', () => {
    it('test_getReservationById_happy_path_returns_response_with_room_data_nights_and_total_amount', async () => {
      // Arrange
      mockReservationRepository.findOne.mockResolvedValue(reservationBase);
      mockRoomRepository.findOne.mockResolvedValue(roomBase);

      // Act
      const result = await service.getReservationById('res-1');

      // Assert
      expect(mockReservationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'res-1' },
      });
      expect(result).toEqual({
        id: 'res-1',
        reservation_code: 'ABC12345',
        room_id: 'room-1',
        room_number: '101',
        hotel_id: 'hotel-1',
        checkin: new Date('2026-05-10'),
        checkout: new Date('2026-05-12'),
        status: ReservationStatus.CONFIRMED,
        price_per_night: 150.5,
        nights: 2,
        total_amount: 301,
        created_at: new Date('2026-05-01T10:00:00.000Z'),
      });
    });

    it('test_getReservationById_not_found_throws_not_found_exception', async () => {
      // Arrange
      mockReservationRepository.findOne.mockResolvedValue(null);

      // Act + Assert
      await expect(service.getReservationById('missing-id')).rejects.toThrow(NotFoundException);
      expect(mockReservationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'missing-id' },
      });
    });

    it('test_buildReservationResponse_with_null_room_returns_null_room_fields_and_total_amount', async () => {
      // Arrange
      mockReservationRepository.findOne.mockResolvedValue(reservationBase);
      mockRoomRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getReservationById('res-1');

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          room_number: null,
          hotel_id: null,
          price_per_night: null,
          total_amount: null,
          nights: 2,
        }),
      );
    });

    it('test_buildReservationResponse_nights_calculation_returns_two_nights_for_2026_05_10_to_2026_05_12', async () => {
      // Arrange
      mockReservationRepository.findOne.mockResolvedValue(reservationBase);
      mockRoomRepository.findOne.mockResolvedValue(roomBase);

      // Act
      const result = await service.getReservationById('res-1');

      // Assert
      expect(result).toEqual(expect.objectContaining({ nights: 2 }));
    });
  });

  describe('getReservationByCode', () => {
    it('test_getReservationByCode_happy_path_returns_response_with_reservation_code', async () => {
      // Arrange
      mockReservationRepository.findOne.mockResolvedValue(reservationBase);
      mockRoomRepository.findOne.mockResolvedValue(roomBase);

      // Act
      const result = await service.getReservationByCode('ABC12345');

      // Assert
      expect(mockReservationRepository.findOne).toHaveBeenCalledWith({
        where: { reservation_code: 'ABC12345' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          reservation_code: 'ABC12345',
        }),
      );
    });

    it('test_getReservationByCode_not_found_throws_not_found_exception', async () => {
      // Arrange
      mockReservationRepository.findOne.mockResolvedValue(null);

      // Act + Assert
      await expect(service.getReservationByCode('MISSING01')).rejects.toThrow(NotFoundException);
      expect(mockReservationRepository.findOne).toHaveBeenCalledWith({
        where: { reservation_code: 'MISSING01' },
      });
    });
  });
});
