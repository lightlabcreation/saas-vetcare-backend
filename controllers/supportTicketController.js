const db = require('../config/db');
const emailService = require('../services/emailService');

// Helper to format date
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
        const adminName = req.user?.name || req.user?.email || 'Admin User';
        const email = req.user?.email || 'admin@clinic.com';
        
        // Find clinic/admin details from user row or defaults
        const clinicName = req.user?.clinicName || 'My Veterinary Clinic';

        if (!subject || !description) {
            return res.status(400).json({ status: 'error', message: 'Subject and description are required.' });
        }

        const ticketId = `TKT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        const formattedDate = getFormattedDate();
        const formattedTime = getFormattedTime();

        const messages = [
            { sender: 'Admin', text: description, time: formattedTime, isUser: true }
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
            subject,
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
                subject,
                priority,
                category,
                status: 'Open',
                updated: formattedDate,
                messages
            }
        });

        // Send email notification to support team (non-blocking)
        const supportEmail = process.env.SUPPORT_EMAIL || 'support@kiaantechnology.com';
        const priorityColor = priority === 'High' ? '#dc2626' : priority === 'Medium' ? '#d97706' : '#16a34a';
        const priorityBg = priority === 'High' ? '#fee2e2' : priority === 'Medium' ? '#fef3c7' : '#dcfce7';

        const ticketHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
              <div style="background-color: #0f172a; padding: 2.5rem 1rem; text-align: center;">
                <span style="color: #ffffff; font-weight: 800; font-size: 1.5rem; letter-spacing: 1px;">SUPPORT <span style="color: #3b82f6;">TICKET</span></span>
              </div>
              <div style="padding: 2.5rem 2rem;">
                <h2 style="color: #0f172a; font-size: 1.4rem; font-weight: 600; margin-top: 0; margin-bottom: 1rem;">New Support Request</h2>
                <p style="color: #64748b; font-size: 1rem; margin-bottom: 2.5rem; line-height: 1.5;">A new support ticket has been submitted. Here are the details:</p>
                
                <table style="width: 100%; font-size: 0.95rem; border-collapse: collapse; margin-bottom: 2.5rem;">
                  <tr>
                    <td style="padding: 1.25rem 0; color: #475569; font-weight: 600; border-bottom: 1px solid #f1f5f9; width: 40%;">Clinic Name</td>
                    <td style="padding: 1.25rem 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${clinicName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 1.25rem 0; color: #475569; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Admin Name</td>
                    <td style="padding: 1.25rem 0; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 1.25rem 0; color: #475569; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Email Address</td>
                    <td style="padding: 1.25rem 0; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 1.25rem 0; color: #475569; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Category</td>
                    <td style="padding: 1.25rem 0; color: #334155; border-bottom: 1px solid #f1f5f9;">${category}</td>
                  </tr>
                  <tr>
                    <td style="padding: 1.25rem 0; color: #475569; font-weight: 600;">Priority</td>
                    <td style="padding: 1.25rem 0;">
                      <span style="background-color: ${priorityBg}; color: ${priorityColor}; padding: 0.3rem 0.8rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem;">${priority}</span>
                    </td>
                  </tr>
                </table>

                <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 1.5rem; margin-bottom: 1rem;">
                  <h3 style="color: #0f172a; font-size: 1rem; font-weight: 600; margin-top: 0; margin-bottom: 0.75rem;">Issue Description</h3>
                  <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin: 0; white-space: pre-wrap;">${description}</p>
                </div>
              </div>
              <div style="background-color: #f1f5f9; padding: 1.25rem; text-align: center; color: #94a3b8; font-size: 0.8rem; border-top: 1px solid #e2e8f0;">
                This is an automated message from the Kiaan Veterinary System.
              </div>
            </div>
        `;
        emailService.sendEmail({
            to: supportEmail,
            subject: `New Support Ticket: ${subject}`,
            text: `New ticket from ${adminName} (${clinicName}). Subject: ${subject}. Description: ${description}`,
            html: ticketHtml
        }).catch(err => console.error('Failed to send ticket notification email:', err));

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

// 3. Clinic User: Reply to their ticket
const replyToTicketAsUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const sender = req.user?.name || req.user?.email || 'Admin';

        if (!text) {
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

        if (!text) {
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
    } catch (err) {
        console.error('Error replying as SuperAdmin:', err);
        res.status(500).json({ status: 'error', message: 'Failed to post reply.' });
    }
};

// 6. Super Admin: Update ticket status
const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ status: 'error', message: 'Status is required.' });
        }

        const [rows] = await db.query('SELECT * FROM saas_support_tickets WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Ticket not found.' });
        }

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
