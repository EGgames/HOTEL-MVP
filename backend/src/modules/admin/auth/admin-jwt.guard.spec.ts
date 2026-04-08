import { AdminJwtGuard } from './admin-jwt.guard';
import { AuthGuard } from '@nestjs/passport';

describe('AdminJwtGuard', () => {
  it('should be defined', () => {
    const guard = new AdminJwtGuard();
    expect(guard).toBeDefined();
  });

  it('extends AuthGuard with admin-jwt strategy', () => {
    const guard = new AdminJwtGuard();
    expect(guard).toBeInstanceOf(AuthGuard('admin-jwt'));
  });
});
