import { Test } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

describe('RoomsController', () => {
  let controller: RoomsController;
  const mockRoomsService = {
    getAvailableRooms: jest.fn(),
    createHoldAtomic: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: mockRoomsService }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    jest.clearAllMocks();
  });

  it('delegates getAvailable to roomsService.getAvailableRooms', async () => {
    const query = { checkin: '2026-05-10', checkout: '2026-05-12' };
    const rooms = [{ id: 'r1' }];
    mockRoomsService.getAvailableRooms.mockResolvedValue(rooms);

    const result = await controller.getAvailable(query);

    expect(mockRoomsService.getAvailableRooms).toHaveBeenCalledWith(query);
    expect(result).toEqual(rooms);
  });

  it('delegates createHold to roomsService.createHoldAtomic', async () => {
    const dto = { checkin: '2026-05-10', checkout: '2026-05-12' };
    const hold = { id: 'hold-1', room_id: 'room-1' };
    mockRoomsService.createHoldAtomic.mockResolvedValue(hold);

    const result = await controller.createHold('room-1', dto);

    expect(mockRoomsService.createHoldAtomic).toHaveBeenCalledWith('room-1', dto);
    expect(result).toEqual(hold);
  });
});
