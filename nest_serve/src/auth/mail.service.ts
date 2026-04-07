import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter {
    if (this.transporter)
      return this.transporter;
    const host = this.config.get<string>('SMTP_HOST', 'smtp.163.com');
    const port = Number(this.config.get<string>('SMTP_PORT', '465'));
    const secure =
      String(this.config.get<string>('SMTP_SECURE', 'true')).toLowerCase() ===
      'true';
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (!user || !pass) {
      throw new Error('SMTP_USER/SMTP_PASS not configured');
    }
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    return this.transporter;
  }

  isConfigured(): boolean {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    return Boolean(user && pass);
  }

  async sendPasswordResetCode(
    to: string,
    code: string,
    lang: string,
  ): Promise<void> {
    const from =
      this.config.get<string>('SMTP_FROM') ||
      this.config.get<string>('SMTP_USER');
    if (!from)
      throw new Error('SMTP_FROM or SMTP_USER required');

    const isEn = lang === 'en-US';
    const subject = isEn
      ? 'Your password reset code'
      : '您的密码重置验证码';
    const text = isEn
      ? `Your verification code is: ${code}\nIt expires in 10 minutes. If you did not request this, ignore this email.`
      : `您的验证码为：${code}\n10 分钟内有效。如非本人操作，请忽略本邮件。`;

    const html = isEn
      ? `<p>Your verification code is:</p><p style="font-size:22px;font-weight:bold;letter-spacing:4px">${code}</p><p>It expires in 10 minutes. If you did not request this, ignore this email.</p>`
      : `<p>您的验证码为：</p><p style="font-size:22px;font-weight:bold;letter-spacing:4px">${code}</p><p>10 分钟内有效。如非本人操作，请忽略本邮件。</p>`;

    await this.getTransporter().sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  }
}
