/**
 * PetCare Pro — Plan Purchase / Payment Email Templates
 *
 * Covers:
 *  - Admin plan purchase receipt
 *  - SuperAdmin plan purchase notification
 */

'use strict';

const { resolveLoginUrl } = require('../config/emailConfig');

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
    if (!d) return new Date().toLocaleString('en-IN');
    try {
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? new Date().toLocaleString('en-IN') : dt.toLocaleString('en-IN');
    } catch { return new Date().toLocaleString('en-IN'); }
};

const safe = (v, fallback = '—') => (v !== null && v !== undefined && String(v).trim() !== '') ? String(v).trim() : fallback;

const headerBrand = `
  <div style="background-color:#0f172a;padding:24px 16px;text-align:center;">
    <span style="color:#ffffff;font-weight:800;font-size:20px;letter-spacing:1px;">
      PetCare<span style="color:#0d9488;">Pro</span>
    </span>
    <div style="color:#94a3b8;font-size:11px;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">
      Clinic Management System
    </div>
  </div>`;

const footerBrand = `
  <div style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 24px;text-align:center;color:#94a3b8;font-size:12px;line-height:1.5;">
    © ${new Date().getFullYear()} PetCare Pro — Kiaan Technology Pvt Ltd · This is an automated message.
  </div>`;

const infoRow = (label, value, alt = false) => `
  <tr style="background:${alt ? '#f8fafc' : '#ffffff'};">
    <td style="padding:10px 14px;color:#64748b;font-weight:600;font-size:13px;width:42%;border-bottom:1px solid #f1f5f9;">${label}</td>
    <td style="padding:10px 14px;color:#0f172a;font-size:13px;border-bottom:1px solid #f1f5f9;">${value || '—'}</td>
  </tr>`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Admin — Plan Purchase Receipt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.adminName
 * @param {string} opts.clinicName
 * @param {string} opts.email
 * @param {string} opts.planName
 * @param {number|string} opts.amount          amount in INR (not paise)
 * @param {string} opts.razorpayPaymentId
 * @param {string} opts.razorpayOrderId
 * @param {string} opts.invoiceNumber
 * @param {Date|string} opts.startDate
 * @param {Date|string} opts.endDate
 * @param {string} [opts.billingCycle]         e.g. 'Monthly', 'Yearly', '30 Days'
 * @param {Date|string} [opts.purchasedAt]
 * @returns {{ subject: string, html: string, text: string }}
 */
function generatePlanPurchaseEmail({
    adminName, clinicName, email,
    planName, amount,
    razorpayPaymentId, razorpayOrderId, invoiceNumber,
    startDate, endDate,
    billingCycle,
    purchasedAt
}) {
    const loginUrl = resolveLoginUrl();
    const formattedAmount = `₹${parseFloat(amount || 0).toFixed(2)}`;
    const emailSubject = `Payment Successful — ${safe(planName)} Plan Activated — ${safe(invoiceNumber)}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${emailSubject}</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
        ${headerBrand}

        <tr><td style="padding:28px;">
          <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
            <span style="color:#15803d;font-weight:700;font-size:14px;">✅ Payment Successful — Your plan is now active.</span>
          </div>

          <p style="color:#334155;font-size:15px;margin:0 0 8px;">Hello <strong>${safe(adminName)}</strong>,</p>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Thank you for your payment. Your <strong>${safe(planName)}</strong> plan has been activated for 
            <strong>${safe(clinicName)}</strong>. Here is your payment receipt.
          </p>

          <!-- Plan & Subscription Details -->
          <h3 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 10px;">🗓 Plan & Subscription</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
            ${infoRow('Plan', `<strong style="color:#0d9488;">${safe(planName)}</strong>`, false)}
            ${infoRow('Amount Paid', `<strong style="font-size:15px;">${formattedAmount}</strong>`, true)}
            ${infoRow('Billing Cycle', safe(billingCycle, '30 Days'), false)}
            ${infoRow('Subscription Start', formatDate(startDate), true)}
            ${infoRow('Subscription Expiry', `<strong style="color:#dc2626;">${formatDate(endDate)}</strong>`, false)}
          </table>

          <!-- Payment Details -->
          <h3 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 10px;">💳 Payment Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            ${infoRow('Payment Status', '<span style="background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:12px;font-weight:700;font-size:12px;">Successful</span>', false)}
            ${infoRow('Invoice Number', `<span style="font-family:monospace;">${safe(invoiceNumber)}</span>`, true)}
            ${infoRow('Razorpay Payment ID', `<span style="font-family:monospace;font-size:12px;">${safe(razorpayPaymentId)}</span>`, false)}
            ${infoRow('Razorpay Order ID', `<span style="font-family:monospace;font-size:12px;">${safe(razorpayOrderId)}</span>`, true)}
            ${infoRow('Purchase Date', formatDateTime(purchasedAt), false)}
          </table>

          <div style="text-align:center;margin:24px 0;">
            <a href="${loginUrl}" target="_blank"
              style="display:inline-block;background-color:#0d9488;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:8px;box-shadow:0 4px 10px rgba(13,148,136,0.25);">
              Go to Dashboard →
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
            Questions? Contact us at <a href="mailto:support@kiaantechnology.com" style="color:#0d9488;">support@kiaantechnology.com</a> or +91 97521 00980
          </p>
        </td></tr>

        ${footerBrand}
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = `
PAYMENT SUCCESSFUL — PetCare Pro
==================================
Hello ${safe(adminName)},

Your ${safe(planName)} plan has been activated for ${safe(clinicName)}.

PLAN & SUBSCRIPTION:
  Plan             : ${safe(planName)}
  Amount Paid      : ${formattedAmount}
  Billing Cycle    : ${safe(billingCycle, '30 Days')}
  Start Date       : ${formatDate(startDate)}
  Expiry Date      : ${formatDate(endDate)}

PAYMENT DETAILS:
  Status           : Successful
  Invoice Number   : ${safe(invoiceNumber)}
  Payment ID       : ${safe(razorpayPaymentId)}
  Order ID         : ${safe(razorpayOrderId)}
  Purchase Date    : ${formatDateTime(purchasedAt)}

Login to your dashboard: ${loginUrl}

Thank you,
PetCare Pro Team
`.trim();

    return { subject: emailSubject, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SuperAdmin — Plan Purchase Notification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.adminName
 * @param {string} opts.clinicName
 * @param {string} opts.email
 * @param {string} opts.planName
 * @param {number|string} opts.amount
 * @param {string} opts.razorpayPaymentId
 * @param {string} opts.razorpayOrderId
 * @param {string} opts.invoiceNumber
 * @param {Date|string} opts.startDate
 * @param {Date|string} opts.endDate
 * @param {string} [opts.billingCycle]
 * @param {Date|string} [opts.purchasedAt]
 * @returns {{ subject: string, html: string, text: string }}
 */
function generateSuperAdminPurchaseEmail({
    adminName, clinicName, email,
    planName, amount,
    razorpayPaymentId, razorpayOrderId, invoiceNumber,
    startDate, endDate,
    billingCycle,
    purchasedAt
}) {
    const formattedAmount = `₹${parseFloat(amount || 0).toFixed(2)}`;
    const emailSubject = `💳 New Plan Purchase — ${safe(clinicName)} — ${safe(planName)} — ${formattedAmount}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${emailSubject}</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
        ${headerBrand}

        <tr><td style="padding:28px;">
          <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
            <span style="color:#15803d;font-weight:700;font-size:15px;">✅ Payment Successful — Plan Activated</span>
          </div>

          <h2 style="color:#0f172a;font-size:18px;font-weight:700;margin:0 0 6px;">New Plan Purchase Notification</h2>
          <p style="color:#64748b;font-size:13px;margin:0 0 24px;">A clinic admin has successfully purchased a plan on PetCare Pro.</p>

          <!-- Admin / Clinic Details -->
          <h3 style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">👤 Admin / Clinic Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
            ${infoRow('Admin Name', `<strong>${safe(adminName)}</strong>`, false)}
            ${infoRow('Clinic Name', `<strong>${safe(clinicName)}</strong>`, true)}
            ${infoRow('Admin Email', `<a href="mailto:${safe(email)}" style="color:#0d9488;text-decoration:none;">${safe(email)}</a>`, false)}
          </table>

          <!-- Plan Details -->
          <h3 style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">🗓 Plan Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
            ${infoRow('Plan', `<strong style="color:#0d9488;font-size:15px;">${safe(planName)}</strong>`, false)}
            ${infoRow('Amount', `<strong style="font-size:16px;">${formattedAmount}</strong>`, true)}
            ${infoRow('Billing Cycle', safe(billingCycle, '30 Days'), false)}
            ${infoRow('Subscription Start', formatDate(startDate), true)}
            ${infoRow('Subscription Expiry', `<strong style="color:#dc2626;">${formatDate(endDate)}</strong>`, false)}
          </table>

          <!-- Payment Details -->
          <h3 style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">💳 Payment Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
            ${infoRow('Payment Status', '<span style="background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:12px;font-weight:700;font-size:12px;">Successful</span>', false)}
            ${infoRow('Invoice Number', `<span style="font-family:monospace;font-weight:700;">${safe(invoiceNumber)}</span>`, true)}
            ${infoRow('Razorpay Payment ID', `<span style="font-family:monospace;font-size:12px;">${safe(razorpayPaymentId)}</span>`, false)}
            ${infoRow('Razorpay Order ID', `<span style="font-family:monospace;font-size:12px;">${safe(razorpayOrderId)}</span>`, true)}
            ${infoRow('Purchase Date', formatDateTime(purchasedAt), false)}
          </table>
        </td></tr>

        ${footerBrand}
      </table>
    </td></tr>
  </table>
</body></html>`;

    const text = `
NEW PLAN PURCHASE — PetCare Pro SuperAdmin Alert
=================================================
ADMIN / CLINIC:
  Admin Name  : ${safe(adminName)}
  Clinic      : ${safe(clinicName)}
  Email       : ${safe(email)}

PLAN DETAILS:
  Plan        : ${safe(planName)}
  Amount      : ${formattedAmount}
  Cycle       : ${safe(billingCycle, '30 Days')}
  Start Date  : ${formatDate(startDate)}
  Expiry      : ${formatDate(endDate)}

PAYMENT DETAILS:
  Status      : Successful
  Invoice No  : ${safe(invoiceNumber)}
  Payment ID  : ${safe(razorpayPaymentId)}
  Order ID    : ${safe(razorpayOrderId)}
  Date        : ${formatDateTime(purchasedAt)}
`.trim();

    return { subject: emailSubject, html, text };
}

module.exports = {
    generatePlanPurchaseEmail,
    generateSuperAdminPurchaseEmail
};
