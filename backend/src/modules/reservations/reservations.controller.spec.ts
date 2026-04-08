import { Test } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  const mockReservationsService = {
    getReservationByCode: jest.fn(),
    getReservationById: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [{ provide: ReservationsService, useValue: mockReservationsService }],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
    jest.clearAllMocks();
  });

  it('delegates getByCode to reservationsService.getReservationByCode', async () => {
    const expected = { id: 'res-1', reservation_code: 'ABC12345' };
    mockReservationsService.getReservationByCode.mockResolvedValue(expected);

    const result = await controller.getByCode('ABC12345');

    expect(mockReservationsService.getReservationByCode).toHaveBeenCalledWith('ABC12345');
    expect(result).toEqual(expected);
  });

  it('delegates getById to reservationsService.getReservationById', async () => {
    const expected = { id: 'res-1' };
    mockReservationsService.getReservationById.mockResolvedValue(expected);

    const result = await controller.getById('res-1');

    expect(mockReservationsService.getReservationById).toHaveBeenCalledWith('res-1');
    expect(result).toEqual(expected);
  });
});
