const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createTicket, getMyTickets, replyToTicketAsUser } = require('../controllers/supportTicketController');

// All endpoints require user authentication
router.use(protect);

router.post('/', createTicket);
router.get('/', getMyTickets);
router.post('/:id/reply', replyToTicketAsUser);

module.exports = router;
