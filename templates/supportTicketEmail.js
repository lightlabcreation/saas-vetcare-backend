/**
 * PetCare Pro — Support Ticket Email Templates
 *
 * Covers:
 *  - Support team notification (new ticket raised with exact dark screenshot aesthetic)
 *  - Admin confirmation (ticket created notification for clinic admin)
 *  - Admin ticket-closed notification (proper formatted closed receipt with resolution)
 *  - Admin ticket-status-changed notification (reply / in-progress updates)
 */

'use strict';

const { resolveTicketUrl, resolveLoginUrl } = require('../config/emailConfig');

// ─────────────────────────────────────────────────────────────────────────────
// Shared styling & formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

const priorityPill = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high') {
        return '<span style="background: #450a0a; color: #f87171; border: 1px solid #991b1b; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: Georgia, serif; font-style: italic;">High</span>';
    }
    if (p === 'low') {
        return '<span style="background: #052e16; color: #4ade80; border: 1px solid #166534; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: Georgia, serif; font-style: italic;">Low</span>';
    }
    // Default Medium (Amber/Brown like screenshot)
    return '<span style="background: #351c07; color: #f59e0b; border: 1px solid #78350f; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: Georgia, serif; font-style: italic;">Medium</span>';
};

const statusPill = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'closed') {
        return '<span style="background: #1e293b; color: #94a3b8; border: 1px solid #475569; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: Georgia, serif; font-style: italic;">Closed</span>';
    }
    if (s === 'resolved') {
        return '<span style="background: #052e16; color: #4ade80; border: 1px solid #166534; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: Georgia, serif; font-style: italic;">Resolved</span>';
    }
    if (s === 'replied') {
        return '<span style="background: #2e1065; color: #c084fc; border: 1px solid #6b21a8; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: Georgia, serif; font-style: italic;">Replied</span>';
    }
    return '<span style="background: #082f49; color: #38bdf8; border: 1px solid #0369a1; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: Georgia, serif; font-style: italic;">Open</span>';
};

const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    } catch { return 'N/A'; }
};

const formatDateTime = (d) => {
    try {
        const dt = d ? new Date(d) : new Date();
        return dt.toLocaleString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch { return String(d || new Date()); }
};

const safe = (v, fallback = '—') => (v !== null && v !== undefined && String(v).trim() !== '') ? String(v).trim() : fallback;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Support Team Notification — New Ticket Raised (Exact User Screenshot Style)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.ticketId
 * @param {string} opts.adminName
 * @param {string} opts.clinicName
 * @param {string} opts.email
 * @param {string} [opts.phone]
 * @param {string} opts.subject
 * @param {string} opts.description
 * @param {string} [opts.priority='Medium']
 * @param {string} [opts.category='Feature Request']
 * @param {string} [opts.planName]
 * @param {string} [opts.subscriptionStatus]
 * @param {Date|string} [opts.createdAt]
 * @param {string} [opts.ticketUrl]
 * @returns {{ subject: string, html: string, text: string }}
 */
function generateSupportTicketCreatedEmail({
    ticketId,
    adminName,
    clinicName,
    email,
    phone,
    subject,
    description,
    priority = 'Medium',
    category = 'Technical',
    planName,
    subscriptionStatus,
    createdAt,
    ticketUrl
}) {
    const safeTicketId = safe(ticketId);
    const safeSubject = safe(subject);
    const safeAdminName = safe(adminName, 'Admin');
    const safeClinicName = safe(clinicName, 'Veterinary Clinic');
    const safeEmail = safe(email, '');
    const safeCategory = safe(category, 'Technical');
    const safeDescription = safe(description, '');
    const createdStr = formatDateTime(createdAt);
    const finalTicketUrl = ticketUrl || resolveTicketUrl(ticketId, true);

    const emailSubject = `New Support Ticket: ${safeSubject}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 24px 8px;">
    <tr>
      <td align="center">
        <!-- Main Card (Max 580px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 26px 24px; text-align: center; border-bottom: 1px solid #1f2937;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                SUPPORT <span style="color: #38bdf8; font-style: italic;">TICKET</span>
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              
              <!-- Subheading -->
              <h2 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin: 0 0 10px 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                New Support Request
              </h2>
              <p style="color: #94a3b8; font-size: 15px; margin: 0 0 28px 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic; line-height: 1.5;">
                A new support ticket has been submitted. Here are the details:
              </p>

              <!-- Details Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin-bottom: 24px;">
                
                <!-- Ticket ID -->
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; width: 34%; border-bottom: 1px solid #1f2937; vertical-align: top;">
                    Ticket ID
                  </td>
                  <td style="padding: 14px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; font-weight: 700;">
                    #${safeTicketId}
                  </td>
                </tr>

                <!-- Clinic Name -->
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; vertical-align: top;">
                    Clinic Name
                  </td>
                  <td style="padding: 14px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${safeClinicName}
                  </td>
                </tr>

                <!-- Admin Name -->
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; vertical-align: top;">
                    Admin Name
                  </td>
                  <td style="padding: 14px 0; color: #38bdf8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${safeAdminName}
                  </td>
                </tr>

                <!-- Email Address -->
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; vertical-align: top;">
                    Email Address
                  </td>
                  <td style="padding: 14px 0; border-bottom: 1px solid #1f2937; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px;">
                    <a href="mailto:${safeEmail}" style="color: #38bdf8; text-decoration: none;">${safeEmail}</a>
                  </td>
                </tr>

                <!-- Subject -->
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; vertical-align: top;">
                    Subject
                  </td>
                  <td style="padding: 14px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${safeSubject}
                  </td>
                </tr>

                <!-- Category -->
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; vertical-align: top;">
                    Category
                  </td>
                  <td style="padding: 14px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${safeCategory}
                  </td>
                </tr>

                <!-- Priority -->
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; vertical-align: middle;">
                    Priority
                  </td>
                  <td style="padding: 14px 0; border-bottom: 1px solid #1f2937;">
                    ${priorityPill(priority)}
                  </td>
                </tr>

                ${phone ? `
                <!-- Contact Phone -->
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; vertical-align: top;">
                    Phone
                  </td>
                  <td style="padding: 14px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${phone}
                  </td>
                </tr>` : ''}

                ${planName ? `
                <!-- Subscribed Plan -->
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; vertical-align: top;">
                    Plan Status
                  </td>
                  <td style="padding: 14px 0; color: #34d399; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${planName} (${subscriptionStatus || 'Active'})
                  </td>
                </tr>` : ''}

              </table>

              <!-- Issue Description Box (with Blue Left Border) -->
              <div style="background-color: #1e293b; border-left: 4px solid #0284c7; border-radius: 6px; padding: 18px 20px; margin: 24px 0;">
                <div style="color: #f1f5f9; font-size: 15px; font-weight: 700; margin-bottom: 10px; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                  Issue Description
                </div>
                <div style="color: #cbd5e1; font-size: 14px; line-height: 1.7; white-space: pre-wrap; font-family: Georgia, 'Times New Roman', serif; font-style: italic; word-break: break-word;">${safeDescription}</div>
              </div>

              <!-- Action CTA Button -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="${finalTicketUrl}" target="_blank"
                  style="display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
                  Open Support Ticket in Dashboard →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; border-top: 1px solid #1f2937; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
              © ${new Date().getFullYear()} PetCare Pro Support System · Kiaan Technology Pvt Ltd
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
SUPPORT TICKET — New Support Request
==================================================
A new support ticket has been submitted:

Ticket ID    : #${safeTicketId}
Clinic Name  : ${safeClinicName}
Admin Name   : ${safeAdminName}
Email Address: ${safeEmail}
Subject      : ${safeSubject}
Category     : ${safeCategory}
Priority     : ${priority}
Submitted At : ${createdStr}
${planName ? `Plan         : ${planName} (${subscriptionStatus || 'Active'})\n` : ''}
ISSUE DESCRIPTION:
${safeDescription}

Open Ticket in Dashboard:
${finalTicketUrl}
==================================================
`.trim();

    return { subject: emailSubject, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Admin Confirmation — Ticket Successfully Created
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.ticketId
 * @param {string} opts.adminName
 * @param {string} opts.subject
 * @param {string} opts.description
 * @param {string} [opts.priority='Medium']
 * @param {string} [opts.category='Technical']
 * @param {Date|string} [opts.createdAt]
 * @param {string} [opts.ticketUrl]
 * @returns {{ subject: string, html: string, text: string }}
 */
function generateSupportTicketConfirmationEmail({
    ticketId,
    adminName,
    subject,
    description,
    priority = 'Medium',
    category = 'Technical',
    createdAt,
    ticketUrl
}) {
    const safeTicketId = safe(ticketId);
    const safeSubject = safe(subject);
    const safeAdminName = safe(adminName, 'there');
    const safeDescription = safe(description, '');
    const createdStr = formatDateTime(createdAt);
    const finalTicketUrl = ticketUrl || resolveTicketUrl(ticketId, false);

    const emailSubject = `Support Ticket Created: #${safeTicketId} — ${safeSubject}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 24px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 26px 24px; text-align: center; border-bottom: 1px solid #1f2937;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                PETCARE <span style="color: #38bdf8; font-style: italic;">PRO</span>
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin: 0 0 10px 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                Support Ticket Received
              </h2>
              <p style="color: #94a3b8; font-size: 15px; margin: 0 0 24px 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic; line-height: 1.5;">
                Hello ${safeAdminName}, thank you for contacting PetCare Pro. Your support ticket has been received and our team will respond shortly.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; width: 34%; border-bottom: 1px solid #1f2937;">
                    Ticket ID
                  </td>
                  <td style="padding: 12px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; font-weight: 700;">
                    #${safeTicketId}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    Subject
                  </td>
                  <td style="padding: 12px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${safeSubject}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    Status
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1f2937;">
                    ${statusPill('Open')}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    Submitted At
                  </td>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${createdStr}
                  </td>
                </tr>
              </table>

              ${safeDescription ? `
              <div style="background-color: #1e293b; border-left: 4px solid #0284c7; border-radius: 6px; padding: 16px 18px; margin: 20px 0 28px 0;">
                <div style="color: #f1f5f9; font-size: 14px; font-weight: 700; margin-bottom: 8px; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                  Your Submitted Request:
                </div>
                <div style="color: #cbd5e1; font-size: 14px; line-height: 1.6; white-space: pre-wrap; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">${safeDescription}</div>
              </div>` : ''}

              <div style="text-align: center; margin: 28px 0 10px 0;">
                <a href="${finalTicketUrl}" target="_blank"
                  style="display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 30px; border-radius: 8px;">
                  View My Tickets →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; border-top: 1px solid #1f2937; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
              PetCare Pro Support Team · support@kiaantechnology.com · +91 97521 00980
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
SUPPORT TICKET CREATED — PetCare Pro
==================================================
Hello ${safeAdminName},

Your support ticket #${safeTicketId} has been successfully created.

Ticket ID   : #${safeTicketId}
Subject     : ${safeSubject}
Status      : Open
Submitted At: ${createdStr}

YOUR REQUEST:
${safeDescription}

Track ticket: ${finalTicketUrl}
Support Email: support@kiaantechnology.com
==================================================
`.trim();

    return { subject: emailSubject, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Admin Notification — Ticket Closed (Exact Clean Format)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.ticketId
 * @param {string} opts.adminName
 * @param {string} opts.clinicName
 * @param {string} opts.subject
 * @param {string} [opts.priority='Medium']
 * @param {string} [opts.resolution]
 * @param {Date|string} [opts.closedAt]
 * @param {string} [opts.ticketUrl]
 * @returns {{ subject: string, html: string, text: string }}
 */
function generateSupportTicketClosedEmail({
    ticketId,
    adminName,
    clinicName,
    subject,
    priority = 'Medium',
    resolution,
    closedAt,
    ticketUrl
}) {
    const safeTicketId = safe(ticketId);
    const safeSubject = safe(subject);
    const safeAdminName = safe(adminName, 'there');
    const safeClinicName = safe(clinicName, 'Your Clinic');
    const safeResolution = safe(resolution, 'Your issue has been addressed and marked as closed by our support team.');
    const closedStr = formatDateTime(closedAt);
    const finalTicketUrl = ticketUrl || resolveTicketUrl(ticketId, false);

    const emailSubject = `Support Ticket #${safeTicketId} Has Been Closed`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 24px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 26px 24px; text-align: center; border-bottom: 1px solid #1f2937;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                SUPPORT <span style="color: #10b981; font-style: italic;">CLOSED</span>
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin: 0 0 10px 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                Your Support Ticket Has Been Closed
              </h2>
              <p style="color: #94a3b8; font-size: 15px; margin: 0 0 24px 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic; line-height: 1.5;">
                Hello ${safeAdminName}, your support ticket #${safeTicketId} has been reviewed and closed. Here are the details:
              </p>

              <!-- Table Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; width: 34%; border-bottom: 1px solid #1f2937;">
                    Ticket ID
                  </td>
                  <td style="padding: 12px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; font-weight: 700;">
                    #${safeTicketId}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    Subject
                  </td>
                  <td style="padding: 12px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${safeSubject}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    Status
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1f2937;">
                    ${statusPill('Closed')}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    Closed At
                  </td>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${closedStr}
                  </td>
                </tr>
              </table>

              <!-- Resolution Details Box (Green Left Border) -->
              <div style="background-color: #1e293b; border-left: 4px solid #10b981; border-radius: 6px; padding: 18px 20px; margin: 24px 0;">
                <div style="color: #f1f5f9; font-size: 15px; font-weight: 700; margin-bottom: 8px; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                  Resolution Details
                </div>
                <div style="color: #cbd5e1; font-size: 14px; line-height: 1.6; white-space: pre-wrap; font-family: Georgia, 'Times New Roman', serif; font-style: italic; word-break: break-word;">${safeResolution}</div>
              </div>

              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                If you still have any questions or require additional assistance, feel free to raise a new support ticket anytime.
              </p>

              <!-- Action CTA -->
              <div style="text-align: center; margin: 28px 0 10px 0;">
                <a href="${finalTicketUrl}" target="_blank"
                  style="display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
                  Create New Support Ticket →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; border-top: 1px solid #1f2937; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
              © ${new Date().getFullYear()} PetCare Pro Support System · Kiaan Technology Pvt Ltd
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
SUPPORT TICKET CLOSED — PetCare Pro
==================================================
Hello ${safeAdminName},

Your support ticket #${safeTicketId} has been closed.

Ticket ID : #${safeTicketId}
Subject   : ${safeSubject}
Status    : Closed
Closed At : ${closedStr}

RESOLUTION:
${safeResolution}

Create a new ticket: ${finalTicketUrl}
==================================================
`.trim();

    return { subject: emailSubject, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Admin Notification — Ticket Status Changed / Replied
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.ticketId
 * @param {string} opts.adminName
 * @param {string} opts.subject
 * @param {string} opts.newStatus
 * @param {string} [opts.latestReply]
 * @param {Date|string} [opts.updatedAt]
 * @param {string} [opts.ticketUrl]
 * @returns {{ subject: string, html: string, text: string }}
 */
function generateSupportTicketStatusEmail({
    ticketId,
    adminName,
    subject,
    newStatus,
    latestReply,
    updatedAt,
    ticketUrl
}) {
    const safeTicketId = safe(ticketId);
    const safeSubject = safe(subject);
    const safeAdminName = safe(adminName, 'there');
    const safeStatus = safe(newStatus, 'Updated');
    const updatedStr = formatDateTime(updatedAt);
    const finalTicketUrl = ticketUrl || resolveTicketUrl(ticketId, false);

    const emailSubject = `Support Ticket #${safeTicketId} — Status Updated to ${safeStatus}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 24px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 26px 24px; text-align: center; border-bottom: 1px solid #1f2937;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                SUPPORT <span style="color: #38bdf8; font-style: italic;">UPDATE</span>
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin: 0 0 10px 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                Support Ticket Status Updated
              </h2>
              <p style="color: #94a3b8; font-size: 15px; margin: 0 0 24px 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic; line-height: 1.5;">
                Hello ${safeAdminName}, the status of your support ticket #${safeTicketId} has been updated to <strong>${safeStatus}</strong>:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; width: 34%; border-bottom: 1px solid #1f2937;">
                    Ticket ID
                  </td>
                  <td style="padding: 12px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937; font-weight: 700;">
                    #${safeTicketId}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    Subject
                  </td>
                  <td style="padding: 12px 0; color: #f8fafc; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${safeSubject}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    New Status
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1f2937;">
                    ${statusPill(newStatus)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    Updated At
                  </td>
                  <td style="padding: 12px 0; color: #94a3b8; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; border-bottom: 1px solid #1f2937;">
                    ${updatedStr}
                  </td>
                </tr>
              </table>

              ${latestReply ? `
              <!-- Response Box (Purple Left Border) -->
              <div style="background-color: #1e293b; border-left: 4px solid #8b5cf6; border-radius: 6px; padding: 18px 20px; margin: 24px 0;">
                <div style="color: #f1f5f9; font-size: 15px; font-weight: 700; margin-bottom: 8px; font-family: Georgia, 'Times New Roman', serif; font-style: italic;">
                  Support Team Response
                </div>
                <div style="color: #cbd5e1; font-size: 14px; line-height: 1.6; white-space: pre-wrap; font-family: Georgia, 'Times New Roman', serif; font-style: italic; word-break: break-word;">${safe(latestReply)}</div>
              </div>` : ''}

              <!-- Action CTA -->
              <div style="text-align: center; margin: 28px 0 10px 0;">
                <a href="${finalTicketUrl}" target="_blank"
                  style="display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
                  View Support Ticket →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; border-top: 1px solid #1f2937; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
              © ${new Date().getFullYear()} PetCare Pro Support System · Kiaan Technology Pvt Ltd
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `
SUPPORT TICKET STATUS UPDATE — PetCare Pro
==================================================
Hello ${safeAdminName},

The status of your ticket #${safeTicketId} has been updated:

Ticket ID  : #${safeTicketId}
Subject    : ${safeSubject}
New Status : ${safeStatus}
Updated At : ${updatedStr}

${latestReply ? `RESPONSE:\n${safe(latestReply)}\n\n` : ''}View ticket: ${finalTicketUrl}
==================================================
`.trim();

    return { subject: emailSubject, html, text };
}

module.exports = {
    generateSupportTicketCreatedEmail,
    generateSupportTicketConfirmationEmail,
    generateSupportTicketClosedEmail,
    generateSupportTicketStatusEmail
};
