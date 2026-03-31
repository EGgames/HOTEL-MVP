import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HoldsService } from '../holds/holds.service';

@Injectable()
export class HoldExpirationWorker {
  private readonly logger = new Logger(HoldExpirationWorker.name);

  constructor(private readonly holdsService: HoldsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleHolds(): Promise<void> {
    try {
      const updated = await this.holdsService.markExpiredBatch();
      if (updated > 0) {
        this.logger.log(`Worker: ${updated} hold(s) marcados como EXPIRED`);
      }
    } catch (error) {
      this.logger.error('Worker: Error al expirar holds', error);
    }
  }
}
