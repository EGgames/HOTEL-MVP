import { Test } from '@nestjs/testing';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from '../auth/admin-auth.service';

describe('AdminAuthController', () => {
  let controller: AdminAuthController;
  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [{ provide: AdminAuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AdminAuthController>(AdminAuthController);
    jest.clearAllMocks();
  });

  it('delegates login to adminAuthService.login', async () => {
    const dto = { email: 'admin@hotel.com', password: 'secret' };
    const expected = { access_token: 'jwt', admin: { id: '1', email: 'admin@hotel.com', name: 'Admin' } };
    mockAuthService.login.mockResolvedValue(expected);

    const result = await controller.login(dto);

    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });
});
