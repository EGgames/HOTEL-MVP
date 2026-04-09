import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePaymentDto } from './create-payment.dto';

describe('CreatePaymentDto', () => {
  function toDto(data: Partial<CreatePaymentDto>): CreatePaymentDto {
    return plainToInstance(CreatePaymentDto, data);
  }

  it('passes validation with valid data', async () => {
    const dto = toDto({
      hold_id: '550e8400-e29b-41d4-a716-446655440000',
      amount: 200,
      idempotency_key: 'key-123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails with invalid UUID for hold_id', async () => {
    const dto = toDto({
      hold_id: 'not-a-uuid',
      amount: 200,
      idempotency_key: 'key-123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails with negative amount', async () => {
    const dto = toDto({
      hold_id: '550e8400-e29b-41d4-a716-446655440000',
      amount: -10,
      idempotency_key: 'key-123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails with empty idempotency_key', async () => {
    const dto = toDto({
      hold_id: '550e8400-e29b-41d4-a716-446655440000',
      amount: 100,
      idempotency_key: '',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
