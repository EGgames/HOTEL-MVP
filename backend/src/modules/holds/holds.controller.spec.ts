import { Test } from '@nestjs/testing';
import { HoldsController } from './holds.controller';
import { HoldsService } from './holds.service';

describe('HoldsController', () => {
  let controller: HoldsController;
  const mockHoldsService = {
    getHoldWithRemaining: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HoldsController],
      providers: [{ provide: HoldsService, useValue: mockHoldsService }],
    }).compile();

    controller = module.get<HoldsController>(HoldsController);
    jest.clearAllMocks();
  });

  it('delegates getHold to holdsService.getHoldWithRemaining', async () => {
    const expected = { id: 'hold-1', remaining_seconds: 120 };
    mockHoldsService.getHoldWithRemaining.mockResolvedValue(expected);

    const result = await controller.getHold('hold-1');

    expect(mockHoldsService.getHoldWithRemaining).toHaveBeenCalledWith('hold-1');
    expect(result).toEqual(expected);
  });
});
