import { Module } from '@nestjs/common';
import { HoldsModule } from '../holds/holds.module';
import { HoldExpirationWorker } from './hold-expiration.worker';

@Module({
  imports: [HoldsModule],
  providers: [HoldExpirationWorker],
})
export class WorkersModule {}
