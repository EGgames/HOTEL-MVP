import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hold, HoldStatus } from './entities/hold.entity';

@Injectable()
export class HoldsService {
  constructor(
    @InjectRepository(Hold)
    private readonly holdRepository: Repository<Hold>,
  ) {}

  async getHoldWithRemaining(holdId: string): Promise<Hold & { remaining_seconds: number }> {
    const hold = await this.holdRepository.findOne({ where: { id: holdId } });

    if (!hold) {
      throw new NotFoundException(`Hold con id ${holdId} no encontrado`);
    }

    const now = Date.now();
    const expiresAt = hold.expires_at.getTime();
    const remaining_seconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

    return { ...hold, remaining_seconds };
  }

  async markExpiredBatch(): Promise<number> {
    const result = await this.holdRepository
      .createQueryBuilder()
      .update(Hold)
      .set({ status: HoldStatus.EXPIRED })
      .where('status = :status', { status: HoldStatus.PENDING })
      .andWhere('expires_at < NOW()')
      .execute();

    return result.affected ?? 0;
  }
}
