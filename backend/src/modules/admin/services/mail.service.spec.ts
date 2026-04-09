import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let service: MailService;
  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    jest.clearAllMocks();
  });

  describe('sendReservationConfirmation', () => {
    const data = {
      to: 'guest@test.com',
      reservationCode: 'ABC123',
      hotelName: 'Hotel Test',
      roomNumber: '101',
      checkin: '2026-06-01',
      checkout: '2026-06-03',
      totalAmount: 200,
    };

    it('sends email with correct parameters', async () => {
      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.sendReservationConfirmation(data);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'guest@test.com',
          subject: 'Confirmación de Reserva - ABC123',
        }),
      );
    });

    it('includes reservation details in HTML body', async () => {
      mockMailerService.sendMail.mockResolvedValue(undefined);

      await service.sendReservationConfirmation(data);

      const call = mockMailerService.sendMail.mock.calls[0][0];
      expect(call.html).toContain('ABC123');
      expect(call.html).toContain('Hotel Test');
      expect(call.html).toContain('#101');
      expect(call.html).toContain('200.00');
    });

    it('throws when mailer fails', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendReservationConfirmation(data)).rejects.toThrow('SMTP error');
    });
  });
});
