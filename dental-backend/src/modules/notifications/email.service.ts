import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  clinicName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  chiefComplaint?: string;
  tokenNumber?: number;
  clinicAddress?: string;
  clinicPhone?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      const portNum = Number(port);
      this.transporter = nodemailer.createTransport({
        host,
        port: portNum,
        secure: portNum === 465, // true for 465, false for other ports
        auth: { user, pass },
      });
      this.logger.log('Email service initialized with SMTP configuration');
    } else {
      this.logger.warn(
        'SMTP not configured. Email notifications will be logged only.',
      );
    }
  }

  async sendAppointmentConfirmation(data: AppointmentEmailData): Promise<void> {
    const { patientName, patientEmail, doctorName, clinicName, appointmentDate, appointmentTime, appointmentType, chiefComplaint, tokenNumber, clinicAddress, clinicPhone } = data;

    const subject = `Appointment Confirmation - ${clinicName}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${clinicName}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Dental Clinic</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #0D9488; margin-top: 0;">Appointment Confirmed! ✅</h2>
          
          <p>Dear <strong>${patientName}</strong>,</p>
          
          <p>Your appointment has been successfully booked at <strong>${clinicName}</strong>. Here are your appointment details:</p>
          
          <div style="background: #f0fdfa; border-left: 4px solid #0D9488; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
                <td style="padding: 8px 0;"><strong>${appointmentDate}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
                <td style="padding: 8px 0;"><strong>${appointmentTime}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Doctor:</strong></td>
                <td style="padding: 8px 0;">Dr. ${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Type:</strong></td>
                <td style="padding: 8px 0;">${appointmentType}</td>
              </tr>
              ${tokenNumber ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Token #:</strong></td>
                <td style="padding: 8px 0;"><span style="background: #0D9488; color: white; padding: 2px 10px; border-radius: 15px;">${tokenNumber}</span></td>
              </tr>
              ` : ''}
              ${chiefComplaint ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Reason:</strong></td>
                <td style="padding: 8px 0;">${chiefComplaint}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <p><strong>Please arrive 10 minutes before your scheduled time.</strong></p>
          
          ${clinicAddress ? `<p style="color: #666; font-size: 14px;">📍 ${clinicAddress}</p>` : ''}
          ${clinicPhone ? `<p style="color: #666; font-size: 14px;">📞 ${clinicPhone}</p>` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated confirmation email. Please do not reply to this email.
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
              If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Appointment Confirmation - ${clinicName}

Dear ${patientName},

Your appointment has been successfully booked at ${clinicName}.

APPOINTMENT DETAILS:
- Date: ${appointmentDate}
- Time: ${appointmentTime}  
- Doctor: ${doctorName}
- Type: ${appointmentType}
${tokenNumber ? `- Token #: ${tokenNumber}` : ''}
${chiefComplaint ? `- Reason: ${chiefComplaint}` : ''}

Please arrive 10 minutes before your scheduled time.

${clinicAddress ? `Address: ${clinicAddress}` : ''}
${clinicPhone ? `Phone: ${clinicPhone}` : ''}

If you need to reschedule or cancel, please contact us at least 24 hours in advance.

© ${new Date().getFullYear()} ${clinicName}
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || '"Dental Clinic" <noreply@clinic.com>',
          to: patientEmail,
          subject,
          html: htmlContent,
          text: textContent,
        });
        this.logger.log(`Appointment confirmation email sent to ${patientEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${patientEmail}: ${error.message}`);
      }
    } else {
      this.logger.log(`[EMAIL] Would send to ${patientEmail}: ${subject}`);
      this.logger.log(`[EMAIL] Content: ${textContent}`);
    }
  }

  async sendAppointmentReminder(data: AppointmentEmailData): Promise<void> {
    const { patientName, patientEmail, doctorName, clinicName, appointmentDate, appointmentTime, tokenNumber } = data;

    const subject = `Appointment Reminder - ${clinicName}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #FEF3C7; padding: 20px; border-radius: 10px; text-align: center;">
          <h2 style="color: #92400E; margin: 0;">⏰ Appointment Reminder</h2>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Dear <strong>${patientName}</strong>,</p>
          
          <p>This is a friendly reminder about your upcoming appointment:</p>
          
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
                <td style="padding: 8px 0;"><strong>${appointmentDate}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
                <td style="padding: 8px 0;"><strong>${appointmentTime}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Doctor:</strong></td>
                <td style="padding: 8px 0;">Doctor: ${doctorName}</td>
              </tr>
              ${tokenNumber ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Token #:</strong></td>
                <td style="padding: 8px 0;"><span style="background: #0D9488; color: white; padding: 2px 10px; border-radius: 15px;">${tokenNumber}</span></td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <p><strong>Please arrive 10 minutes before your scheduled time.</strong></p>
          
          <p style="color: #666; font-size: 14px;">If you need to reschedule, please contact us.</p>
        </div>
      </body>
      </html>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || '"Dental Clinic" <noreply@clinic.com>',
          to: patientEmail,
          subject,
          html: htmlContent,
        });
        this.logger.log(`Reminder email sent to ${patientEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send reminder to ${patientEmail}: ${error.message}`);
      }
    } else {
      this.logger.log(`[EMAIL] Would send reminder to ${patientEmail}: ${subject}`);
    }
  }

  async sendInvoiceEmail(data: {
    patientName: string;
    patientEmail: string;
    clinicName: string;
    invoiceNumber: string;
    invoiceDate: string;
    grandTotal: number;
    pdfUrl: string;
    lineItems: any[];
  }): Promise<void> {
    const { patientName, patientEmail, clinicName, invoiceNumber, invoiceDate, grandTotal, pdfUrl, lineItems } = data;

    const subject = `Invoice #${invoiceNumber} from ${clinicName}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0D9488; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${clinicName}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Medical Invoice</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #0D9488; margin-top: 0;">New Invoice Issued</h2>
          
          <p>Dear <strong>${patientName}</strong>,</p>
          
          <p>A new invoice has been generated for your recent visit at <strong>${clinicName}</strong>.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px;">Invoice Number:</td>
                <td style="padding: 5px 0; font-weight: bold; text-align: right;">#${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b; font-size: 14px;">Date:</td>
                <td style="padding: 5px 0; font-weight: bold; text-align: right;">${invoiceDate}</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 15px 0 5px 0; font-weight: bold; color: #0D9488; font-size: 18px;">Total Amount:</td>
                <td style="padding: 15px 0 5px 0; font-weight: bold; color: #0D9488; font-size: 22px; text-align: right;">₹${grandTotal.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" style="background-color: #0D9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Download PDF Invoice
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b;">
            If you have any questions regarding this invoice, please don't hesitate to contact our billing department.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || '"Dental Clinic" <noreply@clinic.com>',
          to: patientEmail,
          subject,
          html: htmlContent,
        });
        this.logger.log(`Invoice email sent to ${patientEmail} for #${invoiceNumber}`);
      } catch (error) {
        this.logger.error(`Failed to send invoice email to ${patientEmail}: ${error.message}`);
      }
    } else {
      this.logger.log(`[EMAIL] Would send Invoice #${invoiceNumber} to ${patientEmail}`);
    }
  }
}
