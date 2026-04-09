import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminAuthService } from './admin-auth.service';
import { Admin } from '../entities/admin.entity';

jest.mock('bcrypt');

describe('AdminAuthService', () => {
  let service: AdminAuthService;

  const mockAdminRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        { provide: getRepositoryToken(Admin), useValue: mockAdminRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    const dto = { email: 'admin@hotel.com', password: 'secret123' };
    const admin = {
      id: 'admin-1',
      email: 'admin@hotel.com',
      name: 'Admin',
      password_hash: 'hashed',
    };

    it('returns access_token and admin info on valid credentials', async () => {
      mockAdminRepository.findOne.mockResolvedValue(admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(dto);

      expect(result.access_token).toBe('jwt-token');
      expect(result.admin).toEqual({ id: 'admin-1', email: 'admin@hotel.com', name: 'Admin' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 'admin-1', email: 'admin@hotel.com' });
    });

    it('throws UnauthorizedException when admin not found', async () => {
      mockAdminRepository.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is invalid', async () => {
      mockAdminRepository.findOne.mockResolvedValue(admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateAdmin', () => {
    it('returns admin when found', async () => {
      const admin = { id: 'admin-1', email: 'admin@hotel.com' };
      mockAdminRepository.findOne.mockResolvedValue(admin);

      const result = await service.validateAdmin('admin-1');

      expect(result).toEqual(admin);
      expect(mockAdminRepository.findOne).toHaveBeenCalledWith({ where: { id: 'admin-1' } });
    });

    it('returns null when admin not found', async () => {
      mockAdminRepository.findOne.mockResolvedValue(null);

      const result = await service.validateAdmin('non-existent');

      expect(result).toBeNull();
    });
  });
});
