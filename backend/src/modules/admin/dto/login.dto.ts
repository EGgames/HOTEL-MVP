import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email debe ser un email válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password es obligatorio' })
  password: string;
}
