import { Test } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Hold, HoldStatus } from '../holds/entities/hold.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

jest.mock('../../common/utils/reservation-code.util', () => ({
  generateReservationCode: jest.fn(() => 'TESTCODE'),
}));

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockManager = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb: (m: typeof mockManager) => Promise<unknown>) =>
      cb(mockManager),
    ),
  };

  const mockPaymentRepository = { findOne: jest.fn() };
  const mockHoldRepository = { findOne: jest.fn() };
  const mockReservationRepository = {};

  const validHold = {
    id: 'hold-1',
    status: HoldStatus.PENDING,
    expires_at: new Date(Date.now() + 300_000),
    room_id: 'room-1',
    checkin: new Date('2026-05-10'),
    checkout: new Date('2026-05-12'),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
        { provide: getRepositoryToken(Hold), useValue: mockHoldRepository },
        { provide: getRepositoryToken(Reservation), useValue: mockReservationRepository },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
    mockManager.update.mockResolvedValue(undefined);
  });

  describe('processPayment — idempotency guard', () => {
    it('returns cached payment when idempotency_key already exists', async () => {
      const existing = { id: 'pay-cached', idempotency_key: 'key-1', status: PaymentStatus.SUCCESS };
      mockPaymentRepository.findOne.mockResolvedValue(existing);

      const result = await service.processPayment({
        hold_id: 'hold-1',
        idempotency_key: 'key-1',
        amount: 100,
      });

      expect(result._cached).toBe(true);
      expect(result.id).toBe('pay-cached');
      expect(mockHoldRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('processPayment — hold validation', () => {
    it('throws NotFoundException when hold does not exist', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);
      mockHoldRepository.findOne.mockResolvedValue(null);

      await expect(
        service.processPayment({ hold_id: 'bad-hold', idempotency_key: 'key-2', amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when hold status is not PENDING', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);
      mockHoldRepository.findOne.mockResolvedValue({
        ...validHold,
        status: HoldStatus.EXPIRED,
      });

      await expect(
        service.processPayment({ hold_id: 'hold-1', idempotency_key: 'key-3', amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when hold is expired', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);
      mockHoldRepository.findOne.mockResolvedValue({
        ...validHold,
        expires_at: new Date(Date.now() - 1000),
      });

      await expect(
        service.processPayment({ hold_id: 'hold-1', idempotency_key: 'key-4', amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processPayment — payment simulator', () => {
    it('creates reservation and returns payment on SUCCESS', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.9); // above decline rate → SUCCESS
      mockPaymentRepository.findOne.mockResolvedValue(null);
      mockHoldRepository.findOne.mockResolvedValue(validHold);

      const savedPayment = { id: 'pay-1', status: PaymentStatus.SUCCESS, hold_id: 'hold-1' };
      const savedReservation = { id: 'res-1', reservation_code: 'TESTCODE' };
      mockManager.create.mockReturnValueOnce(savedPayment).mockReturnValueOnce(savedReservation);
      mockManager.save.mockResolvedValueOnce(savedPayment).mockResolvedValueOnce(savedReservation);

      const result = await service.processPayment({
        hold_id: 'hold-1',
        idempotency_key: 'key-5',
        amount: 200,
      });

      expect(result.id).toBe('pay-1');
      expect(mockManager.save).toHaveBeenCalledTimes(2); // payment + reservation
      expect(mockManager.update).toHaveBeenCalledTimes(2); // hold CONFIRMED + reservation_id
    });

    it('throws HttpException 402 and releases hold when payment is DECLINED', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.05); // below decline rate → DECLINED
      mockPaymentRepository.findOne.mockResolvedValue(null);
      mockHoldRepository.findOne.mockResolvedValue(validHold);

      const savedPayment = { id: 'pay-2', status: PaymentStatus.DECLINED, hold_id: 'hold-1' };
      mockManager.create.mockReturnValue(savedPayment);
      mockManager.save.mockResolvedValue(savedPayment);

      await expect(
        service.processPayment({ hold_id: 'hold-1', idempotency_key: 'key-6', amount: 200 }),
      ).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.PAYMENT_REQUIRED }),
      );

      expect(mockManager.update).toHaveBeenCalledWith(
        Hold,
        { id: 'hold-1' },
        expect.objectContaining({ status: HoldStatus.RELEASED }),
      );
    });
  });
});
