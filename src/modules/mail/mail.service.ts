import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { SendMailOptions, Transporter } from 'nodemailer';
import { renderVerificationEmail } from './templates/verification-email.template';
import { MailJobName } from './mail.types';

/**
 * SMTP transport + templates. Used by {@link MailProcessor} and available for
 * direct injection when a code path must send outside the queue (rare).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private resolveFromAddress(): string {
    const apiName = this.config.get<string>('api.appName', 'App');
    const configured = this.config.get<string>('mail.from', '');
    return configured || `"${apiName}" <noreply@localhost>`;
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.config.get<string>('mail.host', 'localhost');
    const port = this.config.get<number>('mail.port', 587);
    const secure = this.config.get<boolean>('mail.secure', false);
    const user = this.config.get<string>('mail.user', '');
    const pass = this.config.get<string>('mail.password', '');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
    return this.transporter;
  }

  /**
   * When `mail.user` is empty, SMTP is treated as disabled (development / missing secrets).
   */
  isMailDeferredToLog(): boolean {
    return !this.config.get<string>('mail.user', '');
  }

  /**
   * Generic send for transactional mail from any module (order receipts, alerts, …).
   */
  async send(options: SendMailOptions): Promise<void> {
    if (this.isMailDeferredToLog()) {
      this.logger.warn(
        `[mail] SMTP not configured — skipped send to=${String(options.to)} subject=${options.subject ?? ''}`,
      );
      return;
    }

    const from = options.from ?? this.resolveFromAddress();
    await this.getTransporter().sendMail({ ...options, from });
  }

  async sendVerificationEmail(to: string, name: string, code: string): Promise<void> {
    if (this.isMailDeferredToLog()) {
      this.logger.warn(
        `[mail] SMTP not configured — verification OTP for ${to}: ${code} (${MailJobName.VERIFICATION})`,
      );
      return;
    }

    const appName = this.config.get<string>('api.appName', 'App');
    const supportEmail = this.config.get<string>('api.supportEmail', '');
    const { subject, html, text } = renderVerificationEmail({
      appName,
      recipientName: name,
      code,
      supportEmail: supportEmail || undefined,
    });

    const from = this.resolveFromAddress();
    await this.getTransporter().sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  }
}
