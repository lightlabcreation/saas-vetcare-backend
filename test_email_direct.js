require('dotenv').config();
const emailService = require('./services/emailService');

(async () => {
    try {
        console.log('Sending test email to ashilatasaket.rewa@gmail.com...');
        const result = await emailService.sendEmail({
            to: 'ashilatasaket.rewa@gmail.com',
            subject: 'Test Email Direct',
            text: 'This is a test email directly from the emailService',
            html: '<p>This is a test email directly from the emailService</p>'
        });
        console.log('Result:', result);
    } catch (e) {
        console.error('Error sending email:', e);
    }
})();
