import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private readonly adminAuthService: AdminAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'hotel-admin-secret-dev',
    });
  }

  async validate(payload: { sub: string; email: string }): Promise<{ id: string; email: string }> {
    const admin = await this.adminAuthService.validateAdmin(payload.sub);
    if (!admin) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    return { id: admin.id, email: admin.email };
  }
}
