import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

@Controller('api/v1/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  async getByCode(@Query('reservation_code') code: string) {
    return this.reservationsService.getReservationByCode(code);
  }

  @Get(':reservation_id')
  async getById(
    @Param('reservation_id', new ParseUUIDPipe({ version: '4' })) reservationId: string,
  ) {
    return this.reservationsService.getReservationById(reservationId);
  }
}
