import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RoomType } from '../../rooms/entities/room.entity';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  room_number?: string;

  @IsOptional()
  @IsEnum(RoomType, { message: 'type debe ser SINGLE, DOUBLE o SUITE' })
  type?: RoomType;

  @IsOptional()
  @IsNumber({}, { message: 'price_per_night debe ser un número' })
  @IsPositive({ message: 'price_per_night debe ser mayor que cero' })
  price_per_night?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

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
