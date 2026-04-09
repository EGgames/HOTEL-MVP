import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RoomType } from '../../rooms/entities/room.entity';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty({ message: 'room_number es obligatorio' })
  @MaxLength(20)
  room_number: string;

  @IsUUID('4', { message: 'hotel_id debe ser un UUID válido' })
  hotel_id: string;

  @IsEnum(RoomType, { message: 'type debe ser SINGLE, DOUBLE o SUITE' })
  type: RoomType;

  @IsNumber({}, { message: 'price_per_night debe ser un número' })
  @IsPositive({ message: 'price_per_night debe ser mayor que cero' })
  price_per_night: number;

  @IsNumber({}, { message: 'capacity debe ser un número' })
  @Min(1)
  capacity: number;

  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  floor?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  wing?: string;

  @IsOptional()
  @IsUrl({}, { message: 'image_url debe ser una URL válida' })
  @MaxLength(500)
  image_url?: string;
}
