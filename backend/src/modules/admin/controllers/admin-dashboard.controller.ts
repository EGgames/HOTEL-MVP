import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@Controller('api/v1/admin/dashboard')
@UseGuards(AdminJwtGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  async getStats() {
    return this.dashboardService.getStats();
  }
}
