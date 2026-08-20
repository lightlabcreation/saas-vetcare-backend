/**
 * PetCare Pro — Professional Welcome Email Template
 * 
 * Generates email-client compatible HTML and Plain Text for new Admin/Clinic registrations.
 */

const FEATURE_LABEL_MAP = {
    'PATIENT_RECORDS': 'Patient Records & Medical History',
    'APPOINTMENTS': 'Appointments & Scheduling',
    'STAFF_MANAGEMENT': 'Staff & User Management',
    'REPORTS_ANALYTICS': 'Reports & Financial Analytics',
    'SHIFT_MANAGEMENT': 'Shift & Attendance Tracking',
    'AI_ASSISTANT': '🤖 Kiaan AI Assistant & Automation'
};

const formatFeatureName = (featureKey) => {
    if (!featureKey) return '';
    const upperKey = featureKey.toUpperCase().trim();
    if (FEATURE_LABEL_MAP[upperKey]) {
        return FEATURE_LABEL_MAP[upperKey];
    }
    // Fallback: Title Case from snake_case
    return featureKey
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
};

const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return 'N/A';
    }
};

const formatPrice = (price, isTrial) => {
    if (isTrial || price === 0 || price === '0' || price === '0.00' || !price) {
        return '₹0.00 (Free Trial)';
    }
    const num = parseFloat(price);
    if (isNaN(num)) return `₹${price}`;
    return `₹${num.toFixed(2)}`;
};

/**
 * Resolve production-safe frontend login URL without double slashes
 */
const resolveLoginUrl = (urlInput) => {
    const raw = (urlInput && typeof urlInput === 'string' && urlInput.trim())
        ? urlInput.trim()
        : (process.env.FRONTEND_URL || process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5174').trim();

    // Strip trailing slashes and ensure single '/login' path
    const cleaned = raw.replace(/\/+$/, '');
    if (cleaned.endsWith('/login')) {
        return cleaned;
    }
    return `${cleaned}/login`;
};

/**
 * Generate HTML & Plain Text Welcome Email Content
 */
function generateWelcomeEmail({
    adminName,
    email,
    clinicName,
    planName = '7-Day Free Trial',
    price = 0,
    durationDays = 7,
    startDate,
    endDate,
    isTrial = true,
    features = [],
    loginUrl
}) {
    const finalLoginUrl = resolveLoginUrl(loginUrl);

    const recipientGreeting = (clinicName && clinicName.trim()) 
        ? clinicName.trim() 
        : (adminName && adminName.trim()) 
            ? adminName.trim() 
            : 'there';

    const safeAdminName = (adminName && adminName.trim()) ? adminName.trim() : 'Clinic Administrator';
    const safeClinicName = (clinicName && clinicName.trim()) ? clinicName.trim() : 'PetCare Pro Clinic';
    const safeEmail = (email && email.trim()) ? email.trim().toLowerCase() : '';
    const safePlanName = planName || (isTrial ? 'Free Trial' : 'Pro Plan');

    const formattedStartDate = formatDate(startDate || new Date());
    const formattedEndDate = formatDate(endDate);
    const formattedPrice = formatPrice(price, isTrial);
    const durationLabel = isTrial ? `${durationDays || 7}-Day Free Trial` : `${durationDays || 30} Days (Monthly)`;

    // Process feature list into formatted items
    const featureList = Array.isArray(features) ? features.map(formatFeatureName).filter(Boolean) : [];

    const featureRowsHtml = featureList.map(feat => `
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #334155; line-height: 1.4;">
            <span style="color: #0d9488; font-weight: bold; margin-right: 8px;">✓</span>
            ${feat}
          </td>
        </tr>
    `).join('');

    const subject = clinicName && clinicName.trim()
        ? `Welcome to PetCare Pro — ${clinicName.trim()} Account Is Ready`
        : `Welcome to PetCare Pro — Your Account Is Ready`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PetCare Pro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Container Wrapper Table -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card (max-width: 600px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 28px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-block; vertical-align: middle;">
                      <span style="font-size: 24px; vertical-align: middle; margin-right: 8px;">🐾</span>
                      <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; vertical-align: middle;">PetCare</span>
                      <span style="color: #2dd4bf; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; vertical-align: middle;">Pro</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(45, 212, 191, 0.15); border: 1px solid rgba(45, 212, 191, 0.35); color: #2dd4bf; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      Official Notification
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <!-- Title & Greeting -->
              <h1 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.3;">
                Welcome to PetCare Pro — Your Account Is Ready
              </h1>

              <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">
                Hello <strong>${recipientGreeting}</strong>,
              </p>
              <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Welcome to PetCare Pro! Your clinic management account and subscription have been successfully created and activated.
              </p>

              <!-- Trial Banner (If Trial) -->
              ${isTrial ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background-color: #f0fdf4; border: 1px solid #86efac; border-left: 4px solid #16a34a; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-size: 14px; font-weight: 800; color: #15803d; margin-bottom: 6px;">
                      🎉 Your 7-Day Free Trial Is Active
                    </div>
                    <div style="font-size: 13px; color: #166534; line-height: 1.5;">
                      <strong>Trial Start:</strong> ${formattedStartDate} &nbsp;•&nbsp; <strong>Trial Ends:</strong> ${formattedEndDate}
                    </div>
                    <div style="font-size: 12px; color: #15803d; margin-top: 4px;">
                      You have full access to all standard clinic management features during your 7-day trial period.
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Account Details Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.75px; margin-bottom: 12px;">
                      📋 Account Details
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 500;">Clinic Name:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${safeClinicName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Admin Name:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${safeAdminName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Email / Login ID:</td>
                        <td style="padding: 6px 0; color: #0d9488; font-weight: 600;">${safeEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Password:</td>
                        <td style="padding: 6px 0; color: #475569; font-style: italic;">Set during registration</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Software:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">PetCare Pro Clinic Management</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Account Status:</td>
                        <td style="padding: 6px 0;">
                          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; background-color: ${isTrial ? '#fef3c7' : '#dcfce7'}; color: ${isTrial ? '#b45309' : '#15803d'};">
                            ${isTrial ? 'Trial' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Plan Details Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.75px; margin-bottom: 12px;">
                      💳 Plan & Subscription Details
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 500;">Plan:</td>
                        <td style="padding: 6px 0; color: #0d9488; font-weight: 800; font-size: 15px;">${safePlanName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Price:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${formattedPrice}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Billing Duration:</td>
                        <td style="padding: 6px 0; color: #334155; font-weight: 600;">${durationLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Start Date:</td>
                        <td style="padding: 6px 0; color: #334155;">${formattedStartDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Expiry Date:</td>
                        <td style="padding: 6px 0; color: #dc2626; font-weight: 700;">${formattedEndDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Plan Features Section -->
              ${featureList.length > 0 ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.75px; margin-bottom: 10px;">
                      ✨ Included Plan Features
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${featureRowsHtml}
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Login CTA Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; text-align: center;">
                <tr>
                  <td align="center">
                    <a href="${finalLoginUrl}" target="_blank" style="display: inline-block; background-color: #0d9488; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 10px rgba(13, 148, 136, 0.25);">
                      Login to PetCare Pro →
                    </a>
                    <div style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
                      Direct Link: <a href="${finalLoginUrl}" style="color: #0d9488; text-decoration: underline;">${finalLoginUrl}</a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security & Support Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <tr>
                  <td>
                    <p style="color: #475569; font-size: 13px; line-height: 1.5; margin: 0 0 10px 0;">
                      🔒 <strong>Security Tip:</strong> Please keep your login credentials confidential and never share your password with anyone.
                    </p>
                    <p style="color: #475569; font-size: 13px; line-height: 1.5; margin: 0 0 14px 0;">
                      💬 <strong>Need Help?</strong> Our support team is here to assist you. Contact us at <a href="mailto:support@kiaantechnology.com" style="color: #0d9488; text-decoration: none; font-weight: 600;">support@kiaantechnology.com</a> or call <strong>+91 97521 00980</strong>.
                    </p>
                    <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 0;">
                      Thank you for choosing PetCare Pro,<br>
                      <strong>The PetCare Pro Team</strong>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
              © ${new Date().getFullYear()} PetCare Pro Clinic Management System. All rights reserved.<br>
              This is an automated notification sent to ${safeEmail}. Please do not reply directly.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
🐾 PetCare Pro — Official Notification
Welcome to PetCare Pro — Your Account Is Ready

Hello ${recipientGreeting},

Welcome to PetCare Pro! Your clinic management account and subscription have been successfully created and activated.

ACCOUNT DETAILS:
- Clinic Name: ${safeClinicName}
- Admin Name: ${safeAdminName}
- Email / Login ID: ${safeEmail}
- Password: Set during registration
- Software: PetCare Pro Clinic Management
- Account Status: ${isTrial ? 'Trial' : 'Active'}

PLAN & SUBSCRIPTION DETAILS:
- Plan: ${safePlanName}
- Price: ${formattedPrice}
- Billing Duration: ${durationLabel}
- Start Date: ${formattedStartDate}
- Expiry Date: ${formattedEndDate}

${isTrial ? `TRIAL INFORMATION:\n🎉 Your 7-Day Free Trial is active from ${formattedStartDate} to ${formattedEndDate}.\n` : ''}
${featureList.length > 0 ? `INCLUDED PLAN FEATURES:\n${featureList.map(f => `✓ ${f}`).join('\n')}\n` : ''}
LOGIN:
Login to your account: ${finalLoginUrl}

NEED HELP?
Support Email: support@kiaantechnology.com
Support Phone: +91 97521 00980

Please keep your login credentials secure.

Thank you,
The PetCare Pro Team
    `.trim();

    return { subject, html, text };
}

module.exports = {
    generateWelcomeEmail,
    formatFeatureName,
    formatDate,
    formatPrice
};
