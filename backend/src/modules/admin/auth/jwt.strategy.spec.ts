import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AdminAuthService } from './admin-auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const mockAdminAuthService = {
    validateAdmin: jest.fn(),
  } as unknown as AdminAuthService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    strategy = new JwtStrategy(mockAdminAuthService);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('returns admin id and email when admin exists', async () => {
      const admin = { id: 'admin-1', email: 'admin@hotel.com', name: 'Admin' };
      (mockAdminAuthService.validateAdmin as jest.Mock).mockResolvedValue(admin);

      const result = await strategy.validate({ sub: 'admin-1', email: 'admin@hotel.com' });

      expect(result).toEqual({ id: 'admin-1', email: 'admin@hotel.com' });
    });

    it('throws UnauthorizedException when admin not found', async () => {
      (mockAdminAuthService.validateAdmin as jest.Mock).mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'non-existent', email: 'bad@hotel.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
