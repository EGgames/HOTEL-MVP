import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { HoldsService } from './holds.service';

@Controller('api/v1/holds')
export class HoldsController {
  constructor(private readonly holdsService: HoldsService) {}

  @Get(':hold_id')
  async getHold(
    @Param('hold_id', new ParseUUIDPipe({ version: '4' })) holdId: string,
  ) {
    return this.holdsService.getHoldWithRemaining(holdId);
  }
}
