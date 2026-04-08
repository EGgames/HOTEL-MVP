import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator';
import {
  IsAfterCheckin,
  IsNotInPast,
} from '../../rooms/dto/availability-query.dto';

export class CreateAdminReservationDto {
  @IsUUID('4', { message: 'room_id debe ser un UUID válido' })
  room_id: string;

  @IsDateString({}, { message: 'checkin debe ser una fecha válida (YYYY-MM-DD)' })
  @Validate(IsNotInPast)
  checkin: string;

  @IsDateString({}, { message: 'checkout debe ser una fecha válida (YYYY-MM-DD)' })
  @Validate(IsAfterCheckin)
  checkout: string;

  @IsEmail({}, { message: 'customer_email debe ser un email válido' })
  customer_email: string;

  @IsString()
  @IsNotEmpty({ message: 'customer_name es obligatorio' })
  customer_name: string;
}
