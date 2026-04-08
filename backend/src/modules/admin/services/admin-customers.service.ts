import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Reservation, ReservationStatus } from '../../reservations/entities/reservation.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

@Injectable()
export class AdminCustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async list(): Promise<object[]> {
    const customers = await this.customerRepository.find({ order: { created_at: 'DESC' } });

    const result = [];
    for (const customer of customers) {
      const reservations = await this.reservationRepository.find({
        where: { customer_email: customer.email, status: ReservationStatus.CONFIRMED },
      });

      result.push({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        total_reservations: reservations.length,
        created_at: customer.created_at,
      });
    }

    return result;
  }

  async getById(id: string): Promise<object> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const reservations = await this.reservationRepository.find({
      where: { customer_email: customer.email },
      order: { created_at: 'DESC' },
    });

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      reservations: reservations.map((r) => ({
        id: r.id,
        reservation_code: r.reservation_code,
        checkin: r.checkin,
        checkout: r.checkout,
        status: r.status,
      })),
      created_at: customer.created_at,
    };
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.customerRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Ya existe un cliente con ese email');
    }

    const customer = this.customerRepository.create(dto);
    return this.customerRepository.save(customer);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const activeReservations = await this.reservationRepository.count({
      where: { customer_email: customer.email, status: ReservationStatus.CONFIRMED },
    });

    if (activeReservations > 0) {
      throw new ConflictException('No se puede eliminar un cliente con reservas activas');
    }

    await this.customerRepository.remove(customer);
  }
}
