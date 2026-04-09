import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '../entities/admin.entity';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string; admin: { id: string; email: string; name: string } }> {
    const admin = await this.adminRepository.findOne({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, admin.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: admin.id, email: admin.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    };
  }

  async validateAdmin(adminId: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { id: adminId } });
  }
}
