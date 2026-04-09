import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsEmail({}, { message: 'email debe ser un email válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'name es obligatorio' })
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
