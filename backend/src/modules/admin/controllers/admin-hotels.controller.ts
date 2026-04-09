import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminHotelsService } from '../services/admin-hotels.service';

@Controller('api/v1/admin/hotels')
@UseGuards(AdminJwtGuard)
export class AdminHotelsController {
  constructor(private readonly hotelsService: AdminHotelsService) {}

  @Get()
  async list() {
    return this.hotelsService.list();
  }
}
