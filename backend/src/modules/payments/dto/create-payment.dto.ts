import { IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID('4', { message: 'hold_id debe ser un UUID válido' })
  hold_id: string;

  @IsNumber({}, { message: 'amount debe ser un número' })
  @IsPositive({ message: 'amount debe ser mayor que cero' })
  amount: number;

  @IsNotEmpty({ message: 'idempotency_key es obligatorio' })
  idempotency_key: string;
}
