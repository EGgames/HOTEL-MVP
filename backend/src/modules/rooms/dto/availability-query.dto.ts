import { IsDateString, IsOptional, IsUUID, Validate } from 'class-validator';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isAfterCheckin', async: false })
export class IsAfterCheckin implements ValidatorConstraintInterface {
  validate(checkout: string, args: ValidationArguments): boolean {
    const object = args.object as AvailabilityQueryDto;
    if (!object.checkin || !checkout) return false;
    return new Date(checkout) > new Date(object.checkin);
  }

  defaultMessage(): string {
    return 'checkout debe ser posterior a checkin';
  }
}

@ValidatorConstraint({ name: 'isNotInPast', async: false })
export class IsNotInPast implements ValidatorConstraintInterface {
  validate(checkin: string): boolean {
    if (!checkin) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(checkin) >= today;
  }

  defaultMessage(): string {
    return 'checkin debe ser hoy o posterior';
  }
}

export class AvailabilityQueryDto {
  @IsDateString({}, { message: 'checkin debe ser una fecha válida (YYYY-MM-DD)' })
  @Validate(IsNotInPast)
  checkin: string;

  @IsDateString({}, { message: 'checkout debe ser una fecha válida (YYYY-MM-DD)' })
  @Validate(IsAfterCheckin)
  checkout: string;

  @IsOptional()
  @IsUUID('4', { message: 'hotel_id debe ser un UUID válido' })
  hotel_id?: string;
}
