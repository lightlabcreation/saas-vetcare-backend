const https = require('https');
const nodemailer = require('nodemailer');

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
        const senderEmail = process.env.SMTP_FROM_EMAIL || 'lightlabcreation@gmail.com';
        const senderName = process.env.SMTP_FROM_NAME || 'Kiaan Technology Pvt Ltd';

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

    async sendPasswordResetEmail({ email, name, resetUrl }) {
        const subject = '🔒 Reset Your PetCare Pro Password';
        const html = `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 2.5rem; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #334155;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <h1 style="color: #2dd4bf; margin: 0; font-size: 24px;">PetCare <span style="color:#ffffff;">Pro</span></h1>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Clinic Management SaaS</p>
            </div>
            <div style="background-color: #1e293b; padding: 1.75rem; border-radius: 8px; border: 1px solid #475569;">
                <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                    Hello <strong>${name || 'Doctor/Admin'}</strong>,
                </p>
                <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                    We received a request to reset the password for your PetCare Pro account (${email}). Click the secure button below to set a new password:
                </p>
                <div style="text-align: center; margin: 2rem 0;">
                    <a href="${resetUrl}" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4);">
                        Reset Password
                    </a>
                </div>
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
                    ⚠️ This link will expire in <strong>15 minutes</strong>. If you did not request this password reset, you can safely ignore this email.
                </p>
            </div>
            <div style="text-align: center; margin-top: 2rem; color: #64748b; font-size: 12px;">
                © ${new Date().getFullYear()} PetCare Pro SaaS. All rights reserved.
            </div>
        </div>
        `;

        const text = `Hello ${name || 'User'},\n\nWe received a request to reset your password. Click this link to set a new password (valid for 15 mins):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

        return this.sendEmail({ to: email, subject, text, html });
    }

    async sendWelcomeEmail({ email, name, clinicName, loginUrl }) {
        const subject = '🎉 Welcome to PetCare Pro Clinic ERP!';
        const html = `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 2.5rem; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #334155;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <h1 style="color: #2dd4bf; margin: 0; font-size: 26px;">PetCare <span style="color:#ffffff;">Pro</span></h1>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Next-Gen Veterinary SaaS</p>
            </div>
            <div style="background-color: #1e293b; padding: 2rem; border-radius: 8px; border: 1px solid #475569;">
                <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Welcome aboard, ${name}! 🐾</h2>
                <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                    Your 7-Day Free Trial for <strong>${clinicName}</strong> is now active. You have complete access to all enterprise features.
                </p>
                <div style="background: rgba(20, 184, 166, 0.1); border-left: 4px solid #14b8a6; padding: 12px; margin: 1.5rem 0; border-radius: 4px;">
                    <p style="margin: 0; color: #2dd4bf; font-weight: bold; font-size: 13px;">Quick Start Checklist:</p>
                    <ul style="color: #cbd5e1; font-size: 13px; margin: 6px 0 0 16px; padding: 0;">
                        <li>1. Set up your Clinic Profile & Logo</li>
                        <li>2. Add Doctors, Nurses & Staff Members</li>
                        <li>3. Register your First Patient / Pet</li>
                        <li>4. Schedule Appointments & Send Digital Prescriptions</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 2rem 0 1rem 0;">
                    <a href="${loginUrl || 'http://localhost:5174/login'}" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
                        Access Clinic Dashboard →
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 2rem; color: #64748b; font-size: 12px;">
                Need help? Contact support@petcarepro.com | © ${new Date().getFullYear()} PetCare Pro
            </div>
        </div>
        `;

        const text = `Welcome to PetCare Pro, ${name}!\n\nYour 7-day trial for ${clinicName} is now active. Login here: ${loginUrl || 'http://localhost:5174/login'}`;

        return this.sendEmail({ to: email, subject, text, html });
    }
}

module.exports = new EmailService();


