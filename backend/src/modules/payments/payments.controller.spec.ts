import { Test } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  const mockPaymentsService = {
    processPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockPaymentsService }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    jest.clearAllMocks();
  });

  it('delegates processPayment to paymentsService', async () => {
    const dto = { hold_id: 'h-1', amount: 200, idempotency_key: 'key-1' };
    const expected = { id: 'pay-1', status: 'SUCCESS' };
    mockPaymentsService.processPayment.mockResolvedValue(expected);

    const result = await controller.processPayment(dto);

    expect(mockPaymentsService.processPayment).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });
});
