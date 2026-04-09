import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HoldsService } from './holds.service';
import { Hold, HoldStatus } from './entities/hold.entity';

describe('HoldsService', () => {
  let service: HoldsService;

  const mockQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockHoldRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        HoldsService,
        { provide: getRepositoryToken(Hold), useValue: mockHoldRepository },
      ],
    }).compile();

    service = module.get<HoldsService>(HoldsService);
    jest.clearAllMocks();
    mockHoldRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('getHoldWithRemaining', () => {
    it('returns hold with remaining_seconds > 0 when expires in the future', async () => {
      const futureExpiry = new Date(Date.now() + 300_000);
      mockHoldRepository.findOne.mockResolvedValue({
        id: 'hold-1',
        status: HoldStatus.PENDING,
        expires_at: futureExpiry,
      });

      const result = await service.getHoldWithRemaining('hold-1');

      expect(result.id).toBe('hold-1');
      expect(result.remaining_seconds).toBeGreaterThan(0);
      expect(result.remaining_seconds).toBeLessThanOrEqual(300);
    });

    it('returns remaining_seconds as 0 when hold is already expired', async () => {
      const pastExpiry = new Date(Date.now() - 60_000);
      mockHoldRepository.findOne.mockResolvedValue({
        id: 'hold-1',
        status: HoldStatus.PENDING,
        expires_at: pastExpiry,
      });

      const result = await service.getHoldWithRemaining('hold-1');

      expect(result.remaining_seconds).toBe(0);
    });

    it('throws NotFoundException when hold does not exist', async () => {
      mockHoldRepository.findOne.mockResolvedValue(null);

      await expect(service.getHoldWithRemaining('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markExpiredBatch', () => {
    it('returns the number of updated holds', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 3 });

      const result = await service.markExpiredBatch();

      expect(result).toBe(3);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ status: HoldStatus.EXPIRED });
    });

    it('returns 0 when no holds were updated', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      const result = await service.markExpiredBatch();

      expect(result).toBe(0);
    });

    it('returns 0 when affected is undefined', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: undefined });

      const result = await service.markExpiredBatch();

      expect(result).toBe(0);
    });
  });
});
