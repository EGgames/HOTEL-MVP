import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface ReservationEmailData {
  to: string;
  reservationCode: string;
  hotelName: string;
  roomNumber: string;
  checkin: string;
  checkout: string;
  totalAmount: number;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendReservationConfirmation(data: ReservationEmailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.to,
        subject: `Confirmación de Reserva - ${data.reservationCode}`,
        html: `
          <h2>¡Reserva Confirmada!</h2>
          <p>Tu reserva ha sido confirmada con los siguientes datos:</p>
          <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Código</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.reservationCode}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Hotel</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.hotelName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Habitación</strong></td><td style="padding: 8px; border: 1px solid #ddd;">#${data.roomNumber}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Check-in</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.checkin}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Check-out</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.checkout}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #ddd;">U$${data.totalAmount.toFixed(2)}</td></tr>
          </table>
          <p style="margin-top: 16px;">¡Gracias por tu reserva!</p>
        `,
      });
      this.logger.log(`Email de confirmación enviado a ${data.to}`);
    } catch (error) {
      this.logger.error(`Error enviando email a ${data.to}`, error);
      throw error;
    }
  }
}
