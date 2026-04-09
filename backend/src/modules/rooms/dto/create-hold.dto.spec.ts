import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateHoldDto } from './create-hold.dto';

describe('CreateHoldDto', () => {
  function toDto(data: Partial<CreateHoldDto>): CreateHoldDto {
    return plainToInstance(CreateHoldDto, data);
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

  it('fails when checkout is before checkin', async () => {
    const dto = toDto({ checkin: '2099-01-05', checkout: '2099-01-03' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
