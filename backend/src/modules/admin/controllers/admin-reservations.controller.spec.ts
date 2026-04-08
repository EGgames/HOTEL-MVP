import { Test } from '@nestjs/testing';
import { AdminReservationsController } from './admin-reservations.controller';
import { AdminReservationsService } from '../services/admin-reservations.service';

describe('AdminReservationsController', () => {
  let controller: AdminReservationsController;
  const mockService = {
    list: jest.fn(),
    create: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminReservationsController],
      providers: [{ provide: AdminReservationsService, useValue: mockService }],
    }).compile();

    controller = module.get<AdminReservationsController>(AdminReservationsController);
    jest.clearAllMocks();
  });

  it('delegates list to reservationsService.list with filters', async () => {
    const expected = [{ id: 'res-1' }];
    mockService.list.mockResolvedValue(expected);

    const result = await controller.list('CONFIRMED', '2026-01-01', '2026-12-31');

    expect(mockService.list).toHaveBeenCalledWith({
      status: 'CONFIRMED',
      from_date: '2026-01-01',
      to_date: '2026-12-31',
    });
    expect(result).toEqual(expected);
  });

  it('delegates create to reservationsService.create', async () => {
    const dto = {
      room_id: 'room-1',
      checkin: '2026-06-01',
      checkout: '2026-06-03',
      customer_email: 'guest@test.com',
      customer_name: 'Guest',
    };
    const expected = { id: 'res-new', reservation_code: 'ABC123' };
    mockService.create.mockResolvedValue(expected);

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('delegates cancel to reservationsService.cancel', async () => {
    const expected = { message: 'Reserva cancelada' };
    mockService.cancel.mockResolvedValue(expected);

    const result = await controller.cancel('res-1');

    expect(mockService.cancel).toHaveBeenCalledWith('res-1');
    expect(result).toEqual(expected);
  });
});
