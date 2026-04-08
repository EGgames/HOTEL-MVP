import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminReservationsService } from '../services/admin-reservations.service';
import { CreateAdminReservationDto } from '../dto/create-admin-reservation.dto';

@Controller('api/v1/admin/reservations')
@UseGuards(AdminJwtGuard)
export class AdminReservationsController {
  constructor(private readonly reservationsService: AdminReservationsService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string,
  ) {
    return this.reservationsService.list({ status, from_date, to_date });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAdminReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.reservationsService.cancel(id);
  }
}
