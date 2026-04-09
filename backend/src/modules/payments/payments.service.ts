import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Hold, HoldStatus } from '../holds/entities/hold.entity';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { Customer } from '../admin/entities/customer.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { generateReservationCode } from '../../common/utils/reservation-code.util';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Hold)
    private readonly holdRepository: Repository<Hold>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async processPayment(dto: CreatePaymentDto): Promise<Payment & { _cached?: boolean }> {
    const existing = await this.paymentRepository.findOne({
      where: { idempotency_key: dto.idempotency_key },
    });

    if (existing) {
      return { ...existing, _cached: true };
    }

    const hold = await this.holdRepository.findOne({ where: { id: dto.hold_id } });

    if (!hold) {
      throw new NotFoundException(`Hold con id ${dto.hold_id} no encontrado`);
    }

    if (hold.status !== HoldStatus.PENDING) {
      throw new BadRequestException(
        `Hold con estado ${hold.status} no puede ser procesado para pago`,
      );
    }

    if (hold.expires_at < new Date()) {
      throw new BadRequestException('El hold ha expirado. Por favor inicia una nueva reserva');
    }

    const simulatorResult = this.runPaymentSimulator();

    return this.dataSource.transaction(async (manager) => {
      const payment = manager.create(Payment, {
        hold_id: dto.hold_id,
        idempotency_key: dto.idempotency_key,
        amount: dto.amount,
        currency: 'USD',
        status: simulatorResult.status,
        simulator_response: { status: simulatorResult.status, message: simulatorResult.message },
      });

      const savedPayment = await manager.save(Payment, payment);

      if (simulatorResult.status === PaymentStatus.SUCCESS) {
        await manager.update(Hold, { id: dto.hold_id }, {
          status: HoldStatus.CONFIRMED,
          payment_id: savedPayment.id,
        });

        const code = generateReservationCode();
        const reservation = manager.create(Reservation, {
          reservation_code: code,
          room_id: hold.room_id,
          hold_id: hold.id,
          payment_id: savedPayment.id,
          checkin: hold.checkin,
          checkout: hold.checkout,
          status: ReservationStatus.CONFIRMED,
          customer_email: dto.customer_email ?? null,
          customer_name: dto.customer_name ?? null,
        });
        const savedReservation = await manager.save(Reservation, reservation);

        // Auto-register customer if info provided
        if (dto.customer_email) {
          const existingCustomer = await manager.findOne(Customer, {
            where: { email: dto.customer_email },
          });
          if (!existingCustomer) {
            const customer = manager.create(Customer, {
              email: dto.customer_email,
              name: dto.customer_name ?? dto.customer_email,
            });
            await manager.save(Customer, customer);
          }
        }

        await manager.update(Hold, { id: dto.hold_id }, {
          reservation_id: savedReservation.id,
        });

        return savedPayment;
      }

      await manager.update(Hold, { id: dto.hold_id }, {
        status: HoldStatus.RELEASED,
        payment_id: savedPayment.id,
      });

      throw new HttpException(
        {
          id: savedPayment.id,
          hold_id: savedPayment.hold_id,
          status: PaymentStatus.DECLINED,
          detail: 'Pago rechazado por el banco',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    });
  }

  private runPaymentSimulator(): { status: PaymentStatus; message: string } {
    const declineRate = parseFloat(
      process.env.PAYMENT_SIMULATOR_DECLINE_RATE ?? '0.2',
    );

    if (Math.random() < declineRate) {
      return { status: PaymentStatus.DECLINED, message: 'Pago rechazado por el banco' };
    }

    return { status: PaymentStatus.SUCCESS, message: 'Pago aprobado' };
  }
}
