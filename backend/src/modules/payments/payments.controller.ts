import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async processPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.processPayment(dto);
  }
}
