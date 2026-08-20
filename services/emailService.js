const https = require('https');
const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');

class EmailService {
    constructor() {
        // Create transporter only if SMTP config exists (as fallback)
        this.transporter = null;
        if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS || ''
                }
            });
            console.log('Nodemailer SMTP Transporter configured successfully.');
        }
    }

    async sendEmail({ to, bcc, subject, text, html }) {
        if (!to) {
            throw new Error('Email recipient address (to) is required.');
        }

        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = emailConfig.SENDER_EMAIL;
        const senderName = emailConfig.SENDER_NAME;

        // 1. If Brevo API Key is configured, use Brevo HTTP API directly
        if (apiKey) {
            return new Promise((resolve, reject) => {
                const payload = {
                    sender: {
                        name: senderName,
                        email: senderEmail
                    },
                    to: [
                        { email: to }
                    ],
                    subject: subject,
                    htmlContent: html || text.replace(/\n/g, '<br>'),
                    textContent: text
                };
                
                if (bcc) {
                    payload.bcc = [{ email: bcc }];
                }

                const postData = JSON.stringify(payload);

                const options = {
                    hostname: 'api.brevo.com',
                    port: 443,
                    path: '/v3/smtp/email',
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': apiKey,
                        'content-type': 'application/json',
                        'content-length': Buffer.byteLength(postData)
                    }
                };

                const req = https.request(options, (res) => {
                    let body = '';
                    res.on('data', (chunk) => body += chunk);
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            try {
                                const parsed = JSON.parse(body);
                                console.log(`Email sent successfully to ${to} via Brevo API. MessageId: ${parsed.messageId}`);
                                resolve({ success: true, messageId: parsed.messageId });
                            } catch (e) {
                                resolve({ success: true, messageId: 'unknown' });
                            }
                        } else {
                            console.error(`Brevo API Error: Status Code ${res.statusCode}. Body: ${body}`);
                            reject(new Error(`Failed to send email via Brevo API: ${body}`));
                        }
                    });
                });

                req.on('error', (err) => {
                    console.error(`Network Error sending email to ${to} via Brevo API:`, err);
                    reject(err);
                });

                req.write(postData);
                req.end();
            });
        }

        // 2. Fallback to Nodemailer SMTP Transporter if configured
        if (this.transporter) {
            const mailOptions = {
                from: `"${senderName}" <${senderEmail}>`,
                to,
                subject,
                text,
                html: html || text.replace(/\n/g, '<br>')
            };
            
            if (bcc) {
                mailOptions.bcc = bcc;
            }

            try {
                const info = await this.transporter.sendMail(mailOptions);
                console.log(`Email sent successfully to ${to} via SMTP. MessageId: ${info.messageId}`);
                return { success: true, messageId: info.messageId };
            } catch (err) {
                console.error(`SMTP Error sending email to ${to}:`, err);
                throw err;
            }
        }

        // 3. Fallback: Simulator Mode (Console Log)
        console.log('\n==================================================');
        console.log('📨 [SIMULATED EMAIL DISPATCH]');
        console.log(`TO:      ${to}`);
        console.log(`FROM:    "${senderName}" <${senderEmail}>`);
        console.log(`SUBJECT: ${subject}`);
        console.log('--------------------------------------------------');
        console.log(text);
        console.log('==================================================\n');
        return { success: true, simulated: true, messageId: 'sim-' + Math.random().toString(36).substring(2, 9) };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Welcome Email
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Send standardized Welcome Email to newly registered Clinic Admin.
     * BCC is automatically sent to the SuperAdmin.
     */
    async sendWelcomeEmail(options) {
        const { generateWelcomeEmail } = require('../templates/welcomeEmail');
        const { subject, html, text } = generateWelcomeEmail(options);

        return await this.sendEmail({
            to: options.email,
            bcc: emailConfig.SUPERADMIN_EMAIL,
            subject,
            html,
            text
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Plan Purchase Emails
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Send payment receipt to the Admin after successful plan purchase.
     */
    async sendPlanPurchaseEmail(options) {
        const { generatePlanPurchaseEmail } = require('../templates/planPurchaseEmail');
        const { subject, html, text } = generatePlanPurchaseEmail(options);

        return await this.sendEmail({
            to: options.email,
            subject,
            html,
            text
        });
    }

    /**
     * Send plan purchase alert to SuperAdmin.
     */
    async sendSuperAdminPurchaseNotification(options) {
        const { generateSuperAdminPurchaseEmail } = require('../templates/planPurchaseEmail');
        const { subject, html, text } = generateSuperAdminPurchaseEmail(options);

        return await this.sendEmail({
            to: emailConfig.SUPERADMIN_EMAIL,
            subject,
            html,
            text
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Support Ticket Emails
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Notify the support team of a newly created ticket.
     */
    async sendSupportTicketCreatedEmail(options) {
        const { generateSupportTicketCreatedEmail } = require('../templates/supportTicketEmail');
        const { subject, html, text } = generateSupportTicketCreatedEmail(options);

        return await this.sendEmail({
            to: emailConfig.SUPPORT_EMAIL,
            subject,
            html,
            text
        });
    }

    /**
     * Send ticket-created confirmation to the Admin who opened the ticket.
     */
    async sendSupportTicketConfirmationEmail(options) {
        const { generateSupportTicketConfirmationEmail } = require('../templates/supportTicketEmail');
        const { subject, html, text } = generateSupportTicketConfirmationEmail(options);

        return await this.sendEmail({
            to: options.email,
            subject,
            html,
            text
        });
    }

    /**
     * Notify Admin that their ticket has been closed.
     */
    async sendSupportTicketClosedEmail(options) {
        const { generateSupportTicketClosedEmail } = require('../templates/supportTicketEmail');
        const { subject, html, text } = generateSupportTicketClosedEmail(options);

        return await this.sendEmail({
            to: options.email,
            subject,
            html,
            text
        });
    }

    /**
     * Notify Admin of a ticket status change (Replied, In Progress, Resolved, etc.)
     */
    async sendSupportTicketStatusEmail(options) {
        const { generateSupportTicketStatusEmail } = require('../templates/supportTicketEmail');
        const { subject, html, text } = generateSupportTicketStatusEmail(options);

        return await this.sendEmail({
            to: options.email,
            subject,
            html,
            text
        });
    }
}

module.exports = new EmailService();



