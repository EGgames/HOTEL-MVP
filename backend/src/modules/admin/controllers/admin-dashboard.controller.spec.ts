import { Test } from '@nestjs/testing';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from '../services/admin-dashboard.service';

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;
  const mockDashboardService = {
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminDashboardController],
      providers: [{ provide: AdminDashboardService, useValue: mockDashboardService }],
    }).compile();

    controller = module.get<AdminDashboardController>(AdminDashboardController);
    jest.clearAllMocks();
  });

  it('delegates getStats to dashboardService.getStats', async () => {
    const expected = { total_revenue: 1000, total_reservations: 5 };
    mockDashboardService.getStats.mockResolvedValue(expected);

    const result = await controller.getStats();

    expect(mockDashboardService.getStats).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });
});
