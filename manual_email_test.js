require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
    try {
        console.log("Sending email using Brevo API Key:", process.env.BREVO_API_KEY.substring(0, 15) + "...");
        
        await emailService.sendWelcomeEmail({
            to: 'kushakriti524@gmail.com',
            clinicName: 'VetCare Demo Clinic',
            email: 'kushakriti524@gmail.com',
            password: 'Owner@123',
            planName: '7-Day Free Trial',
            price: '0.00',
            duration: '7 Days',
            startDate: new Date().toLocaleDateString('en-GB'),
            endDate: new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('en-GB'),
            loginUrl: 'http://localhost:5174/login'
        });

        console.log("Welcome email sent successfully to kushakriti524@gmail.com!");
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

testEmail();
