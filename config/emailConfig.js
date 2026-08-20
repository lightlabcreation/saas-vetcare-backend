/**
 * PetCare Pro — Central Email Configuration
 *
 * Single source of truth for all notification recipient addresses and
 * environment-safe URL helpers. Import this module instead of reading
 * process.env values directly in controllers/services.
 */

'use strict';

/**
 * SuperAdmin notification recipient — receives alerts for:
 *   new registrations, plan purchases, plan renewals, subscription expiries
 */
const SUPERADMIN_EMAIL =
    process.env.SUPERADMIN_NOTIFICATION_EMAIL ||
    process.env.SUPERADMIN_NOTIFY_EMAIL ||
    'info@kiaantechnology.com';

/**
 * Support team notification recipient — receives alerts for:
 *   new support tickets
 */
const SUPPORT_EMAIL =
    process.env.SUPPORT_NOTIFICATION_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    'support@kiaantechnology.com';

/**
 * Application sender display name
 */
const SENDER_NAME =
    process.env.SMTP_FROM_NAME || 'PetCare Pro';

/**
 * Application sender email address
 */
const SENDER_EMAIL =
    process.env.SMTP_FROM_EMAIL || 'info@kiaantechnology.com';

/**
 * Resolve a production-safe frontend URL without double slashes.
 *
 * @param {string} [suffix='']  path to append (e.g. 'login')
 * @param {string} [base]       override base URL (defaults to FRONTEND_URL env)
 * @returns {string}
 */
const resolveUrl = (suffix = '', base) => {
    const raw = (base && typeof base === 'string' && base.trim())
        ? base.trim()
        : (
            process.env.FRONTEND_URL ||
            process.env.APP_URL ||
            process.env.CLIENT_URL ||
            'http://localhost:5174'
          ).trim();

    const cleaned = raw.replace(/\/+$/, '');
    const cleanSuffix = suffix ? '/' + suffix.replace(/^\/+/, '') : '';
    return `${cleaned}${cleanSuffix}`;
};

/**
 * Convenience helper — returns the login page URL.
 * @param {string} [base] override base URL
 * @returns {string}
 */
const resolveLoginUrl = (base) => resolveUrl('login', base);

/**
 * Convenience helper — returns the plans/upgrade page URL.
 * @param {string} [base] override base URL
 * @returns {string}
 */
const resolvePlansUrl = (base) => resolveUrl('dashboard/plans', base);

/**
 * Convenience helper — returns the support tickets URL.
 * @param {string} [ticketId] optional ticket ID
 * @param {boolean} [isSuperAdmin=true]
 * @returns {string}
 */
const resolveTicketUrl = (ticketId, isSuperAdmin = true) => {
    const basePath = isSuperAdmin ? 'super-admin/tickets' : 'dashboard/support';
    return resolveUrl(basePath);
};

module.exports = {
    SUPERADMIN_EMAIL,
    SUPPORT_EMAIL,
    SENDER_NAME,
    SENDER_EMAIL,
    resolveUrl,
    resolveLoginUrl,
    resolvePlansUrl,
    resolveTicketUrl
};
