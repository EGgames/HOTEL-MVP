import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CreateHoldDto } from './dto/create-hold.dto';

@Controller('api/v1/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('available')
  async getAvailable(@Query() query: AvailabilityQueryDto) {
    return this.roomsService.getAvailableRooms(query);
  }

  @Post(':room_id/hold')
  @HttpCode(HttpStatus.CREATED)
  async createHold(
    @Param('room_id', new ParseUUIDPipe({ version: '4' })) roomId: string,
    @Body() dto: CreateHoldDto,
  ) {
    return this.roomsService.createHoldAtomic(roomId, dto);
  }
}
