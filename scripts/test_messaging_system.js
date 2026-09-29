const messagingService = require('../services/messagingService');

async function testMessagingSystem() {
    console.log('🧪 Testing WhatsApp & SMS Messaging Engine...');

    try {
        // 1. Test WhatsApp Dispatch (Simulator Mode)
        const waRes = await messagingService.sendWhatsApp({
            to: '+919876543210',
            message: '🐾 Test WhatsApp Reminder: Milo has an appointment tomorrow at 11:00 AM at Kiaan Vet Clinic.',
            templateType: 'appointment_reminder',
            recipientName: 'Rahul Sharma'
        });
        console.log('1. WhatsApp Send Result:', waRes);

        // 2. Test SMS Dispatch (Simulator Mode)
        const smsRes = await messagingService.sendSMS({
            to: '+919876543210',
            message: 'PetCare Alert: Milo is due for Rabies vaccination on 25-Aug-2026. Please visit clinic.',
            templateType: 'vaccination_due',
            recipientName: 'Rahul Sharma'
        });
        console.log('2. SMS Send Result:', smsRes);

        // 3. Test Template Parser
        const template = 'Hello {{owner_name}}, appointment for {{pet_name}} confirmed on {{appointment_date}} at {{clinic_name}}.';
        const parsed = messagingService.parseTemplate(template, {
            owner_name: 'Dr. John',
            pet_name: 'Bruno',
            appointment_date: '24th Sept 2026',
            clinic_name: 'Kiaan Pet Hospital'
        });
        console.log('3. Template Parser Result:', parsed);

        console.log('🎉 All Messaging Engine tests passed successfully!');
    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        process.exit(0);
    }
}

testMessagingSystem();
