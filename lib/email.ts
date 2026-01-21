import nodemailer from 'nodemailer';
import juice from 'juice';
import { convert } from 'html-to-text';

interface EmailSender {
  username: string;
  email: string;
  password: string;
  host: string;
  port: number;
}

interface EmailReceiver {
  username: string;
  email: string;
}

interface Attachment {
  filename: string;
  content: Buffer;
}

export class Email {
  private sender: EmailSender;
  private receiver: EmailReceiver;

  constructor(sender: EmailSender, receiver: EmailReceiver) {
    this.sender = sender;
    this.receiver = receiver;
  }

  private createTransport() {
    return nodemailer.createTransport({
      host: this.sender.host,
      port: this.sender.port,
      auth: {
        user: this.sender.email,
        pass: this.sender.password,
      },
    });
  }

  async send(templateHTML: string, subject: string, attachment?: Attachment) {
    // Inline CSS for email compatibility
    const inlinedHTML = juice(templateHTML);

    // Define email options
    const mailOptions: any = {
      from: `"${this.sender.username}" <${this.sender.email}>`,
      to: this.receiver.email,
      subject: subject,
      html: inlinedHTML,
      text: convert(inlinedHTML),
    };

    if (attachment) {
      mailOptions.attachments = [
        {
          filename: attachment.filename,
          content: attachment.content,
        },
      ];
    }

    // Create transport and send email
    await this.createTransport().sendMail(mailOptions);
  }
}

export function createEmailTemplate(
  senderName: string,
  senderEmail: string,
  subject: string,
  message: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .message-box {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .sender-info {
          background: #eff6ff;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📬 New Contact Form Message</h1>
      </div>
      <div class="content">
        <p>You have received a new message from your portfolio website.</p>
        
        <div class="sender-info">
          <p><strong>From:</strong> ${senderName}</p>
          <p><strong>Email:</strong> <a href="mailto:${senderEmail}">${senderEmail}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        
        <div class="message-box">
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div class="footer">
          <p>This email was sent from your portfolio contact form.</p>
          <p>Reply directly to this email to respond to ${senderName}.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
