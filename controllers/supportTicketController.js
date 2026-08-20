const db = require('../config/db');
const emailService = require('../services/emailService');
const { SUPPORT_EMAIL, resolveTicketUrl } = require('../config/emailConfig');

// Helper to format date and time
const getFormattedDate = () => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getFullYear()).substring(2)}`;
};

const getFormattedTime = () => {
    const now = new Date();
    const datePart = getFormattedDate();
    const timePart = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
    return `${datePart}, ${timePart}`;
};

// 1. Clinic User: Create a support ticket
const createTicket = async (req, res) => {
    try {
        const { subject, description, priority = 'Medium', category = 'Technical' } = req.body;
        const userId = req.user?.id || null;
        const fallbackEmail = req.user?.email || '';

        if (!subject || !subject.trim() || !description || !description.trim()) {
            return res.status(400).json({ status: 'error', message: 'Subject and description are required.' });
        }

        const trimmedSubject = subject.trim();
        const trimmedDescription = description.trim();

        // ── 1. Idempotency / Double-submit Guard (30-second debounce) ──
        if (userId || fallbackEmail) {
            const [recentTickets] = await db.query(
                `SELECT id, subject, priority, category, status, updated, messages, created_at
                 FROM saas_support_tickets
                 WHERE (clinic_admin_id = ? OR email = ?)
                   AND subject = ?
                   AND created_at >= NOW() - INTERVAL 30 SECOND
                 ORDER BY created_at DESC LIMIT 1`,
                [userId, fallbackEmail, trimmedSubject]
            );

            if (recentTickets && recentTickets.length > 0) {
                const existing = recentTickets[0];
                console.log(`[SupportTicket] Debounced duplicate ticket creation for user: ${userId || fallbackEmail}`);
                return res.status(200).json({
                    status: 'success',
                    message: 'Support ticket already submitted.',
                    data: {
                        id: existing.id,
                        subject: existing.subject,
                        priority: existing.priority,
                        category: existing.category,
                        status: existing.status,
                        updated: existing.updated,
                        messages: typeof existing.messages === 'string' ? JSON.parse(existing.messages) : existing.messages
                    }
                });
            }
        }

        // ── 2. Fetch Real User, Clinic & Subscription Metadata from Database ──
        let adminName = req.user?.name || req.user?.email || 'Clinic Admin';
        let email = fallbackEmail;
        let phone = req.user?.phone || null;
        let clinicId = req.user?.clinic_id || null;
        let clinicName = 'PetCare Pro Clinic';
        let planName = 'Standard Plan';
        let subscriptionStatus = 'Active';
        let subscriptionStartDate = null;
        let subscriptionEndDate = null;

        if (userId) {
            try {
                const [userRows] = await db.query(
                    `SELECT u.id, u.name, u.email, u.phone, u.clinic_id,
                            c.clinic_name, c.status as clinic_status
                     FROM users u
                     LEFT JOIN clinics c ON u.clinic_id = c.id
                     WHERE u.id = ? LIMIT 1`,
                    [userId]
                );
                if (userRows && userRows.length > 0) {
                    const u = userRows[0];
                    if (u.name) adminName = u.name;
                    if (u.email) email = u.email;
                    if (u.phone) phone = u.phone;
                    if (u.clinic_id) clinicId = u.clinic_id;
                    if (u.clinic_name) clinicName = u.clinic_name;
                }
            } catch (err) {
                console.error('[SupportTicket] Error fetching user/clinic details:', err.message);
            }
        }

        // Fetch subscription information for this clinic
        const clinicIdToQuery = clinicId || req.user?.clinic_id;
        if (clinicIdToQuery) {
            try {
                const [subRows] = await db.query(
                    `SELECT s.id, s.status, s.start_date, s.end_date, p.name as plan_name
                     FROM saas_subscriptions s
                     LEFT JOIN saas_plans p ON s.plan_id = p.id
                     WHERE s.clinic_id = ?
                     ORDER BY CASE WHEN s.status IN ('Active', 'Trial') THEN 1 ELSE 2 END, s.end_date DESC
                     LIMIT 1`,
                    [clinicIdToQuery]
                );
                if (subRows && subRows.length > 0) {
                    const s = subRows[0];
                    if (s.plan_name) planName = s.plan_name;
                    if (s.status) subscriptionStatus = s.status;
                    subscriptionStartDate = s.start_date;
                    subscriptionEndDate = s.end_date;
                }
            } catch (subErr) {
                console.error('[SupportTicket] Error fetching subscription details:', subErr.message);
            }
        }

        // ── 3. Insert Ticket into Database ──
        const ticketId = `TKT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        const formattedDate = getFormattedDate();
        const formattedTime = getFormattedTime();
        const createdAt = new Date();

        const messages = [
            { sender: 'Admin', text: trimmedDescription, time: formattedTime, isUser: true }
        ];

        const query = `
            INSERT INTO saas_support_tickets 
            (id, clinic_admin_id, clinic, adminName, email, subject, priority, category, status, updated, messages)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [
            ticketId,
            userId,
            clinicName,
            adminName,
            email,
            trimmedSubject,
            priority,
            category,
            'Open',
            formattedDate,
            JSON.stringify(messages)
        ]);

        res.status(201).json({
            status: 'success',
            message: 'Support ticket raised successfully.',
            data: {
                id: ticketId,
                subject: trimmedSubject,
                priority,
                category,
                status: 'Open',
                updated: formattedDate,
                messages
            }
        });

        // ── 4. Dispatch Notifications Asynchronously (Non-blocking) ──
        setImmediate(async () => {
            const supportPayload = {
                ticketId,
                adminName,
                clinicName,
                clinicId,
                userId,
                email,
                phone,
                planName,
                subscriptionStatus,
                subscriptionStartDate,
                subscriptionEndDate,
                subject: trimmedSubject,
                description: trimmedDescription,
                priority,
                category,
                status: 'Open',
                createdAt,
                ticketUrl: resolveTicketUrl(ticketId, true) // SuperAdmin / Support team URL
            };

            const adminPayload = {
                ticketId,
                adminName,
                subject: trimmedSubject,
                description: trimmedDescription,
                priority,
                category,
                createdAt,
                ticketUrl: resolveTicketUrl(ticketId, false) // Clinic Admin URL
            };

            // 1. Notify support team
            emailService.sendSupportTicketCreatedEmail(supportPayload)
                .catch(err => console.error('[Email] Failed to send support team ticket notification:', err.message));

            // 2. Confirm to admin requester
            if (email) {
                emailService.sendSupportTicketConfirmationEmail(adminPayload)
                    .catch(err => console.error('[Email] Failed to send admin ticket confirmation:', err.message));
            }
        });

    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ status: 'error', message: 'Server error while raising ticket.', error: err.message });
    }
};

// 2. Clinic User: Get all tickets for this user/clinic
const getMyTickets = async (req, res) => {
    try {
        const userId = req.user?.id;
        let query = 'SELECT * FROM saas_support_tickets ORDER BY created_at DESC';
        let params = [];

        // If not super admin or manager, filter by clinic_admin_id
        if (req.user?.role !== 'SUPER_ADMIN' && userId) {
            query = 'SELECT * FROM saas_support_tickets WHERE clinic_admin_id = ? ORDER BY created_at DESC';
            params = [userId];
        }

        const [rows] = await db.query(query, params);
        
        // Parse messages JSON
        const formatted = rows.map(r => ({
            ...r,
            messages: typeof r.messages === 'string' ? JSON.parse(r.messages) : r.messages
        }));

        res.json({ status: 'success', data: formatted });
    } catch (err) {
        console.error('Error fetching tickets:', err);
        res.status(500).json({ status: 'error', message: 'Server error while fetching tickets.' });
    }
};

// 3. Clinic User: Reply to their ticket (Reopen if closed)
const replyToTicketAsUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const sender = req.user?.name || req.user?.email || 'Admin';

        if (!text || !text.trim()) {
            return res.status(400).json({ status: 'error', message: 'Message text is required.' });
        }

        const [tickets] = await db.query('SELECT * FROM saas_support_tickets WHERE id = ?', [id]);
        if (tickets.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Ticket not found.' });
        }

        const ticket = tickets[0];
        const messages = typeof ticket.messages === 'string' ? JSON.parse(ticket.messages) : ticket.messages;

        const formattedTime = getFormattedTime();
        const newMsg = {
            sender: 'Admin',
            text: text.trim(),
            time: formattedTime,
            isUser: true
        };

        const updatedMessages = [...messages, newMsg];
        const updatedDate = getFormattedDate();

        await db.query(
            'UPDATE saas_support_tickets SET status = ?, updated = ?, messages = ? WHERE id = ?',
            ['Open', updatedDate, JSON.stringify(updatedMessages), id]
        );

        res.json({
            status: 'success',
            data: {
                ...ticket,
                status: 'Open',
                updated: updatedDate,
                messages: updatedMessages
            }
        });
    } catch (err) {
        console.error('Error replying to ticket:', err);
        res.status(500).json({ status: 'error', message: 'Server error while posting reply.' });
    }
};

// 4. Super Admin: Get all tickets across clinics
const getAllTicketsForSuperAdmin = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM saas_support_tickets ORDER BY created_at DESC');
        const formatted = rows.map(r => ({
            ...r,
            messages: typeof r.messages === 'string' ? JSON.parse(r.messages) : r.messages
        }));
        res.json({ status: 'success', data: formatted });
    } catch (err) {
        console.error('Error fetching tickets for SuperAdmin:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch support tickets.' });
    }
};

// 5. Super Admin: Reply to ticket
const replyTicketAsSuperAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ status: 'error', message: 'Reply text is required.' });
        }

        const [rows] = await db.query('SELECT * FROM saas_support_tickets WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Ticket not found.' });
        }

        const ticket = rows[0];
        const messages = typeof ticket.messages === 'string' ? JSON.parse(ticket.messages) : ticket.messages;

        const formattedTime = getFormattedTime();
        const newMsg = {
            sender: 'Superadmin',
            text: text.trim(),
            time: formattedTime,
            isUser: false
        };

        const updatedMessages = [...messages, newMsg];
        const updatedDate = getFormattedDate();

        await db.query(
            'UPDATE saas_support_tickets SET status = ?, updated = ?, messages = ? WHERE id = ?',
            ['Replied', updatedDate, JSON.stringify(updatedMessages), id]
        );

        res.json({
            status: 'success',
            data: {
                ...ticket,
                status: 'Replied',
                updated: updatedDate,
                messages: updatedMessages
            }
        });

        // Notify admin that there is a new reply (non-blocking)
        setImmediate(() => {
            if (ticket.email) {
                emailService.sendSupportTicketStatusEmail({
                    ticketId: ticket.id,
                    adminName: ticket.adminName || ticket.email,
                    email: ticket.email,
                    subject: ticket.subject,
                    newStatus: 'Replied',
                    latestReply: text.trim(),
                    updatedAt: new Date(),
                    ticketUrl: resolveTicketUrl(ticket.id, false)
                }).catch(err => console.error('[Email] Failed to send ticket reply notification:', err.message));
            }
        });

    } catch (err) {
        console.error('Error replying as SuperAdmin:', err);
        res.status(500).json({ status: 'error', message: 'Failed to post reply.' });
    }
};

// 6. Super Admin: Update ticket status
const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution } = req.body;

        if (!status) {
            return res.status(400).json({ status: 'error', message: 'Status is required.' });
        }

        const [rows] = await db.query('SELECT * FROM saas_support_tickets WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Ticket not found.' });
        }

        const ticket = rows[0];
        const updatedDate = getFormattedDate();

        await db.query(
            'UPDATE saas_support_tickets SET status = ?, updated = ? WHERE id = ?',
            [status, updatedDate, id]
        );

        res.json({
            status: 'success',
            message: 'Ticket status updated successfully.',
            data: { id, status, updated: updatedDate }
        });

        // Send appropriate email to admin based on new status (non-blocking)
        setImmediate(() => {
            if (!ticket.email) return;

            const emailBase = {
                ticketId: ticket.id,
                adminName: ticket.adminName || ticket.email,
                email: ticket.email,
                subject: ticket.subject,
                priority: ticket.priority,
                updatedAt: new Date(),
                ticketUrl: resolveTicketUrl(ticket.id, false)
            };

            if (status === 'Closed') {
                emailService.sendSupportTicketClosedEmail({
                    ...emailBase,
                    resolution: resolution || null,
                    closedAt: new Date()
                }).catch(err => console.error('[Email] Failed to send ticket-closed email:', err.message));
            } else {
                // For all other status changes (Resolved, In Progress, etc.) — send status update email
                emailService.sendSupportTicketStatusEmail({
                    ...emailBase,
                    newStatus: status,
                    latestReply: resolution || null
                }).catch(err => console.error('[Email] Failed to send ticket-status email:', err.message));
            }
        });

    } catch (err) {
        console.error('Error updating ticket status:', err);
        res.status(500).json({ status: 'error', message: 'Failed to update status.' });
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    replyToTicketAsUser,
    getAllTicketsForSuperAdmin,
    replyTicketAsSuperAdmin,
    updateTicketStatus
};
