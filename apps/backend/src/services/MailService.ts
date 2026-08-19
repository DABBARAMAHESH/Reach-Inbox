import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { Sender } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { SenderRepository } from '../repositories/SenderRepository';

// Cache active transporters by sender ID
const transporterCache = new Map<string, nodemailer.Transporter>();

export class MailService {
  static async createEtherealAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      return {
        etherealUser: testAccount.user,
        etherealPassword: testAccount.pass,
        smtpHost: testAccount.smtp.host,
        smtpPort: testAccount.smtp.port
      };
    } catch (error) {
      logger.error({ error }, 'Failed to create Ethereal test account');
      throw error;
    }
  }

  /**
   * Helper to build a Google OAuth2 client loaded with the sender's credentials.
   */
  private static getOAuth2Client(sender: Sender) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set for OAuth2 sending');
    }

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      refresh_token: sender.oauth2RefreshToken || undefined,
      access_token: sender.oauth2AccessToken || undefined
    });

    return oauth2Client;
  }

  private static getPasswordTransporter(sender: Sender): nodemailer.Transporter {
    if (transporterCache.has(sender.id)) {
      return transporterCache.get(sender.id)!;
    }

    const password = SenderRepository.getDecryptedPassword(sender);

    const transporter = nodemailer.createTransport({
      host: sender.smtpHost || env.SMTP_HOST,
      port: sender.smtpPort || env.SMTP_PORT,
      secure: sender.smtpPort === 465,
      auth: {
        user: sender.smtpUser || sender.etherealUser || env.SMTP_USER,
        pass: password || env.SMTP_PASSWORD
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    transporterCache.set(sender.id, transporter);
    return transporter;
  }

  private static isOAuth2Sender(sender: Sender): boolean {
    return !!(sender.oauth2RefreshToken || sender.oauth2AccessToken);
  }

  static async verifySender(sender: Sender): Promise<boolean> {
    if (env.EMAIL_SEND_MODE === 'mock') {
      return true;
    }

    if (this.isOAuth2Sender(sender)) {
      // Verifying by building client is sufficient
      this.getOAuth2Client(sender);
      return true;
    }

    try {
      const transporter = this.getPasswordTransporter(sender);
      await transporter.verify();
      return true;
    } catch (e: any) {
      // If user SMTP verification fails, but we have system fallback credentials configured,
      // we allow them to pass since we will seamlessly send their emails via the system mailer.
      if (env.SYSTEM_SMTP_USER && env.SYSTEM_SMTP_PASSWORD) {
        logger.info(
          { email: sender.email, error: e.message || e },
          'Custom SMTP validation failed. Using system SMTP fallback instead.'
        );
        return true;
      }
      throw e;
    }
  }

  /**
   * Send email via Gmail REST API for OAuth2 senders (doesn't require SMTP scope)
   * or via nodemailer SMTP for Ethereal / Custom password senders.
   */
  static async sendEmail(opts: {
    sender: Sender;
    recipient: string;
    subject: string;
    body: string;
    attachments?: { filename: string; content: string; contentType: string }[];
  }): Promise<{ messageId: string; etherealPreviewUrl?: string }> {
    const { sender, recipient, subject, body, attachments } = opts;

    if (env.EMAIL_SEND_MODE === 'mock') {
      logger.info({ recipient, subject }, '[MOCK MODE] Email sent successfully');
      const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        messageId: mockId,
        etherealPreviewUrl: `https://ethereal.email/message/${mockId}`
      };
    }

    const htmlBody = `<div style="font-family: sans-serif; line-height: 1.5;">${body.replace(/\n/g, '<br/>')}</div>`;

    if (this.isOAuth2Sender(sender)) {
      // Use the Gmail REST API (much safer scope-wise & avoids EADDR/login block issues)
      const oauth2Client = this.getOAuth2Client(sender);
      
      // Auto-refresh the access token if expired
      const { token: freshAccessToken } = await oauth2Client.getAccessToken();
      if (!freshAccessToken) {
        throw new Error(`Failed to obtain fresh access token for sender ${sender.email}`);
      }
      oauth2Client.setCredentials({ access_token: freshAccessToken });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Construct RFC 2822 formatted raw MIME message
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      let message = '';

      if (attachments && attachments.length > 0) {
        const boundary = `reachinbox_boundary_${Date.now()}`;
        const headers = [
          `From: "${sender.displayName}" <${sender.email}>`,
          `To: ${recipient}`,
          `Subject: ${utf8Subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          ``,
          `--${boundary}`,
          `Content-Type: text/html; charset=utf-8`,
          `Content-Transfer-Encoding: 7bit`,
          ``,
          htmlBody,
          ``
        ];

        const parts = [headers.join('\r\n')];

        for (const att of attachments) {
          const attHeader = [
            `--${boundary}`,
            `Content-Type: ${att.contentType}; name="${att.filename}"`,
            `Content-Transfer-Encoding: base64`,
            `Content-Disposition: attachment; filename="${att.filename}"`,
            ``,
            att.content,
            ``
          ];
          parts.push(attHeader.join('\r\n'));
        }

        parts.push(`--${boundary}--`);
        message = parts.join('\r\n');
      } else {
        const messageParts = [
          `From: "${sender.displayName}" <${sender.email}>`,
          `To: ${recipient}`,
          `Content-Type: text/html; charset=utf-8`,
          `MIME-Version: 1.0`,
          `Subject: ${utf8Subject}`,
          ``,
          htmlBody
        ];
        message = messageParts.join('\r\n');
      }
      
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      logger.info(
        {
          messageId: res.data.id,
          recipient,
          mode: 'oauth2-rest-api'
        },
        'Email sent via Gmail REST API'
      );

      return {
        messageId: res.data.id || `api-${Date.now()}`
      };
    }

    // Default to password SMTP transport (Ethereal / Custom)
    let transporter: nodemailer.Transporter;
    let fromHeader = `"${sender.displayName}" <${sender.email}>`;
    let replyToHeader: string | undefined = undefined;
    let fallbackUsed = false;

    try {
      transporter = this.getPasswordTransporter(sender);
      // Verify connection to catch credential issues early
      await transporter.verify();
    } catch (e: any) {
      if (env.SYSTEM_SMTP_USER && env.SYSTEM_SMTP_PASSWORD) {
        logger.info(
          { email: sender.email, error: e.message || e },
          'Custom SMTP authentication failed. Falling back to system SMTP sender.'
        );
        transporter = nodemailer.createTransport({
          host: env.SYSTEM_SMTP_HOST || 'smtp.gmail.com',
          port: env.SYSTEM_SMTP_PORT || 587,
          secure: env.SYSTEM_SMTP_PORT === 465,
          auth: {
            user: env.SYSTEM_SMTP_USER,
            pass: env.SYSTEM_SMTP_PASSWORD
          }
        });
        fromHeader = `"${sender.displayName} (via ReachInbox)" <${env.SYSTEM_SMTP_USER}>`;
        replyToHeader = sender.email;
        fallbackUsed = true;
      } else {
        throw e;
      }
    }

    // Map attachments to Nodemailer format
    const nodemailerAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.contentType
    }));

    // Attempt to send email
    let info;
    try {
      info = await transporter.sendMail({
        from: fromHeader,
        to: recipient,
        replyTo: replyToHeader,
        subject,
        text: body,
        html: htmlBody,
        attachments: nodemailerAttachments
      });
    } catch (e: any) {
      // If sending fails (e.g. SMTP rejected sending at runtime) and we haven't already fallen back, try fallback now!
      if (!fallbackUsed && env.SYSTEM_SMTP_USER && env.SYSTEM_SMTP_PASSWORD) {
        logger.info(
          { email: sender.email, error: e.message || e },
          'Custom SMTP send failed. Retrying with system SMTP fallback.'
        );
        const fallbackTransporter = nodemailer.createTransport({
          host: env.SYSTEM_SMTP_HOST || 'smtp.gmail.com',
          port: env.SYSTEM_SMTP_PORT || 587,
          secure: env.SYSTEM_SMTP_PORT === 465,
          auth: {
            user: env.SYSTEM_SMTP_USER,
            pass: env.SYSTEM_SMTP_PASSWORD
          }
        });
        info = await fallbackTransporter.sendMail({
          from: `"${sender.displayName} (via ReachInbox)" <${env.SYSTEM_SMTP_USER}>`,
          to: recipient,
          replyTo: sender.email,
          subject,
          text: body,
          html: htmlBody,
          attachments: nodemailerAttachments
        });
      } else {
        throw e;
      }
    }

    const previewUrl = nodemailer.getTestMessageUrl(info);
    const etherealUrl = previewUrl ? previewUrl.toString() : undefined;

    logger.info(
      {
        messageId: info.messageId,
        etherealPreviewUrl: etherealUrl,
        recipient,
        mode: fallbackUsed ? 'system-smtp-fallback' : 'smtp-password'
      },
      'Email sent successfully via SMTP'
    );

    return {
      messageId: info.messageId,
      etherealPreviewUrl: etherealUrl
    };
  }

  /**
   * Sends a 6-digit verification OTP to the user's email.
   * Uses an auto-generated Ethereal account if no system SMTP is configured.
   */
  static async sendVerificationOtp(email: string, otp: string): Promise<string> {
    try {
      let transporter: nodemailer.Transporter;
      let fromAddress = '"ReachInbox System" <verification@reachinbox.test>';

      // If a real system SMTP credential is set, use it to send real email to user's device!
      if (env.SYSTEM_SMTP_USER && env.SYSTEM_SMTP_PASSWORD) {
        transporter = nodemailer.createTransport({
          host: env.SYSTEM_SMTP_HOST || 'smtp.gmail.com',
          port: env.SYSTEM_SMTP_PORT || 587,
          secure: env.SYSTEM_SMTP_PORT === 465,
          auth: {
            user: env.SYSTEM_SMTP_USER,
            pass: env.SYSTEM_SMTP_PASSWORD
          }
        });
        fromAddress = `"${env.SYSTEM_SMTP_USER}" <${env.SYSTEM_SMTP_USER}>`;
      } else {
        // Fall back to auto-generated Ethereal mailer for local testing
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      const info = await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `Your ReachInbox Verification Code: ${otp}`,
        text: `Welcome to ReachInbox! Your 6-digit email verification code is: ${otp}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h2 style="color: #0ea5e9; text-align: center; margin-bottom: 5px;">Verify Your Email</h2>
            <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 0;">Welcome to ReachInbox!</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Use the following 6-digit verification code to complete your signup:</p>
            <div style="background-color: #f8fafc; padding: 18px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0ea5e9; border: 1px dashed #cbd5e1; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; margin-top: 25px;">
              This code will expire shortly. If you did not sign up for ReachInbox, you can safely ignore this email.
            </p>
          </div>
        `
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info({ previewUrl }, 'Verification OTP Ethereal Mail sent. Check link to see the OTP!');
        return previewUrl.toString();
      }

      logger.info({ email }, 'Verification OTP sent successfully via System SMTP to user device!');
      return '';
    } catch (e) {
      logger.error({ error: e, email }, 'Failed to send verification OTP');
      throw e;
    }
  }
}

