import { Test } from '@nestjs/testing';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdminRoomsController } from './admin-rooms.controller';
import { AdminRoomsService } from '../services/admin-rooms.service';

describe('AdminRoomsController', () => {
  let controller: AdminRoomsController;
  const mockService = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminRoomsController],
      providers: [{ provide: AdminRoomsService, useValue: mockService }],
    }).compile();

    controller = module.get<AdminRoomsController>(AdminRoomsController);
    jest.clearAllMocks();
  });

  it('delegates list to roomsService.list', async () => {
    const expected = [{ id: 'r-1', room_number: '101' }];
    mockService.list.mockResolvedValue(expected);

    const result = await controller.list();

    expect(mockService.list).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('delegates create to roomsService.create', async () => {
    const dto = {
      room_number: '201',
      hotel_id: 'hotel-1',
      type: 'SINGLE',
      price_per_night: 100,
      capacity: 2,
      amenities: ['wifi'],
    };
    const expected = { id: 'r-new', ...dto };
    mockService.create.mockResolvedValue(expected);

    const result = await controller.create(dto as any);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('delegates update to roomsService.update', async () => {
    const dto = { price_per_night: 150 };
    const expected = { id: 'r-1', price_per_night: 150 };
    mockService.update.mockResolvedValue(expected);

    const result = await controller.update('r-1', dto);

    expect(mockService.update).toHaveBeenCalledWith('r-1', dto);
    expect(result).toEqual(expected);
  });

  it('delegates remove to roomsService.remove', async () => {
    mockService.remove.mockResolvedValue(undefined);

    await controller.remove('r-1');

    expect(mockService.remove).toHaveBeenCalledWith('r-1');
  });
});
