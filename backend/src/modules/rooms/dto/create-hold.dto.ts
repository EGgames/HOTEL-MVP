import { IsDateString, Validate } from 'class-validator';
import { IsAfterCheckin, IsNotInPast } from './availability-query.dto';

export class CreateHoldDto {
  @IsDateString({}, { message: 'checkin debe ser una fecha válida (YYYY-MM-DD)' })
  @Validate(IsNotInPast)
  checkin: string;

  @IsDateString({}, { message: 'checkout debe ser una fecha válida (YYYY-MM-DD)' })
  @Validate(IsAfterCheckin)
  checkout: string;
}
