import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminCustomersService } from './admin-customers.service';
import { Customer } from '../entities/customer.entity';
import { Reservation, ReservationStatus } from '../../reservations/entities/reservation.entity';

describe('AdminCustomersService', () => {
  let service: AdminCustomersService;

  const mockCustomerRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockReservationRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminCustomersService,
        { provide: getRepositoryToken(Customer), useValue: mockCustomerRepository },
        { provide: getRepositoryToken(Reservation), useValue: mockReservationRepository },
      ],
    }).compile();

    service = module.get<AdminCustomersService>(AdminCustomersService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns customers with reservation counts', async () => {
      mockCustomerRepository.find.mockResolvedValue([
        { id: 'c-1', email: 'a@test.com', name: 'A', phone: null, created_at: new Date() },
      ]);
      mockReservationRepository.find.mockResolvedValue([{ id: 'r-1' }, { id: 'r-2' }]);

      const result = await service.list();

      expect(result).toHaveLength(1);
      expect((result[0] as any).total_reservations).toBe(2);
    });
  });

  describe('getById', () => {
    it('returns customer with reservations', async () => {
      mockCustomerRepository.findOne.mockResolvedValue({
        id: 'c-1', email: 'a@test.com', name: 'A', phone: null, created_at: new Date(),
      });
      mockReservationRepository.find.mockResolvedValue([
        { id: 'r-1', reservation_code: 'ABC', checkin: '2026-06-01', checkout: '2026-06-03', status: 'CONFIRMED' },
      ]);

      const result = (await service.getById('c-1')) as any;

      expect(result.id).toBe('c-1');
      expect(result.reservations).toHaveLength(1);
    });

    it('throws NotFoundException when customer not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.getById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a new customer', async () => {
      const dto = { email: 'new@test.com', name: 'New' };
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(dto);
      mockCustomerRepository.save.mockResolvedValue({ id: 'c-new', ...dto });

      const result = await service.create(dto);

      expect(result.id).toBe('c-new');
    });

    it('throws ConflictException when email already exists', async () => {
      mockCustomerRepository.findOne.mockResolvedValue({ id: 'c-1' });

      await expect(service.create({ email: 'dup@test.com', name: 'Dup' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('updates and returns customer', async () => {
      const customer = { id: 'c-1', name: 'Old', phone: null };
      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockCustomerRepository.save.mockResolvedValue({ ...customer, name: 'New' });

      const result = await service.update('c-1', { name: 'New' });

      expect(result.name).toBe('New');
    });

    it('throws NotFoundException when customer not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes customer with no active reservations', async () => {
      mockCustomerRepository.findOne.mockResolvedValue({ id: 'c-1', email: 'a@test.com' });
      mockReservationRepository.count.mockResolvedValue(0);
      mockCustomerRepository.remove.mockResolvedValue(undefined);

      await service.remove('c-1');

      expect(mockCustomerRepository.remove).toHaveBeenCalled();
    });

    it('throws NotFoundException when customer not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when customer has active reservations', async () => {
      mockCustomerRepository.findOne.mockResolvedValue({ id: 'c-1', email: 'a@test.com' });
      mockReservationRepository.count.mockResolvedValue(2);

      await expect(service.remove('c-1')).rejects.toThrow(ConflictException);
    });
  });
});
