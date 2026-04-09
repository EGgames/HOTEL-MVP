import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hold } from './entities/hold.entity';
import { HoldsService } from './holds.service';
import { HoldsController } from './holds.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hold])],
  controllers: [HoldsController],
  providers: [HoldsService],
  exports: [HoldsService, TypeOrmModule],
})
export class HoldsModule {}
