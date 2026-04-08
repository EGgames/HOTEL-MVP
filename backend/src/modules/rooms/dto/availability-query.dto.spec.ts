import 'reflect-metadata';
import { validate, ValidationArguments } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AvailabilityQueryDto, IsAfterCheckin, IsNotInPast } from './availability-query.dto';

describe('AvailabilityQueryDto', () => {
  function toDto(data: Partial<AvailabilityQueryDto>): AvailabilityQueryDto {
    return plainToInstance(AvailabilityQueryDto, data);
  }

  it('passes validation with valid future dates', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const dto = toDto({
      checkin: tomorrow.toISOString().split('T')[0],
      checkout: dayAfter.toISOString().split('T')[0],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when checkin is missing', async () => {
    const dto = toDto({ checkout: '2099-01-02' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails when checkout is before checkin', async () => {
    const dto = toDto({ checkin: '2099-01-05', checkout: '2099-01-03' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts optional hotel_id as valid UUID', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const dto = toDto({
      checkin: tomorrow.toISOString().split('T')[0],
      checkout: dayAfter.toISOString().split('T')[0],
      hotel_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails with invalid hotel_id', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const dto = toDto({
      checkin: tomorrow.toISOString().split('T')[0],
      checkout: dayAfter.toISOString().split('T')[0],
      hotel_id: 'not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('IsNotInPast', () => {
  const validator = new IsNotInPast();

  it('returns true for a future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    expect(validator.validate(tomorrowStr)).toBe(true);
  });

  it('returns false for past date', () => {
    expect(validator.validate('2020-01-01')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validator.validate('')).toBe(false);
  });

  it('has a default message', () => {
    expect(validator.defaultMessage()).toBe('checkin debe ser hoy o posterior');
  });
});

describe('IsAfterCheckin', () => {
  const validator = new IsAfterCheckin();

  it('returns true when checkout is after checkin', () => {
    const args = { object: { checkin: '2099-01-01' } } as ValidationArguments;
    expect(validator.validate('2099-01-02', args)).toBe(true);
  });

  it('returns false when checkout is before checkin', () => {
    const args = { object: { checkin: '2099-01-05' } } as ValidationArguments;
    expect(validator.validate('2099-01-01', args)).toBe(false);
  });

  it('returns false when checkout is empty', () => {
    const args = { object: { checkin: '2099-01-01' } } as ValidationArguments;
    expect(validator.validate('', args)).toBe(false);
  });

  it('returns false when checkin is missing', () => {
    const args = { object: {} } as ValidationArguments;
    expect(validator.validate('2099-01-02', args)).toBe(false);
  });

  it('has a default message', () => {
    expect(validator.defaultMessage()).toBe('checkout debe ser posterior a checkin');
  });
});
