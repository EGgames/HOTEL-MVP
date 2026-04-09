import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HoldExpirationWorker } from './hold-expiration.worker';
import { HoldsService } from '../holds/holds.service';

describe('HoldExpirationWorker', () => {
  let worker: HoldExpirationWorker;

  const mockHoldsService = {
    markExpiredBatch: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        HoldExpirationWorker,
        { provide: HoldsService, useValue: mockHoldsService },
      ],
    }).compile();

    worker = module.get<HoldExpirationWorker>(HoldExpirationWorker);
    jest.clearAllMocks();
  });

  describe('expireStaleHolds', () => {
    it('test_expireStaleHolds_calls_markExpiredBatch', async () => {
      // Arrange
      mockHoldsService.markExpiredBatch.mockResolvedValue(0);

      // Act
      await worker.expireStaleHolds();

      // Assert
      expect(mockHoldsService.markExpiredBatch).toHaveBeenCalledTimes(1);
    });

    it('test_expireStaleHolds_logs_when_updated_greater_than_zero', async () => {
      // Arrange
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      mockHoldsService.markExpiredBatch.mockResolvedValue(3);

      // Act
      await worker.expireStaleHolds();

      // Assert
      expect(logSpy).toHaveBeenCalledWith('Worker: 3 hold(s) marcados como EXPIRED');
      logSpy.mockRestore();
    });

    it('test_expireStaleHolds_does_not_log_when_updated_is_zero', async () => {
      // Arrange
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      mockHoldsService.markExpiredBatch.mockResolvedValue(0);

      // Act
      await worker.expireStaleHolds();

      // Assert
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it('test_expireStaleHolds_does_not_throw_when_markExpiredBatch_throws', async () => {
      // Arrange
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      const error = new Error('batch failure');
      mockHoldsService.markExpiredBatch.mockRejectedValue(error);

      // Act + Assert
      await expect(worker.expireStaleHolds()).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith('Worker: Error al expirar holds', error);
      errorSpy.mockRestore();
    });
  });
});
