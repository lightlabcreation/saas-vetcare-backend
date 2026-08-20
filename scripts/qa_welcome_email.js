const { generateWelcomeEmail } = require('../templates/welcomeEmail');
const db = require('../config/db');
const emailService = require('../services/emailService');

async function runQATests() {
    console.log('====================================================');
    console.log('🐾 PETCARE PRO — WELCOME EMAIL QA VERIFICATION SUITE');
    console.log('====================================================\n');

    let allPassed = true;

    // ── TEST 1: Template Structure & Field Correctness ──
    console.log('--- TEST 1: Template Structure & Field Correctness ---');
    const trialEmail = generateWelcomeEmail({
        adminName: 'Dr. Rajesh Sharma',
        email: 'rajesh@happypawsclinic.com',
        clinicName: 'Happy Paws Animal Hospital',
        planName: 'Free Trial',
        price: 0,
        durationDays: 7,
        startDate: new Date('2026-08-20'),
        endDate: new Date('2026-08-27'),
        isTrial: true,
        features: ['PATIENT_RECORDS', 'APPOINTMENTS', 'STAFF_MANAGEMENT', 'REPORTS_ANALYTICS', 'SHIFT_MANAGEMENT'],
        loginUrl: 'http://localhost:5174/login'
    });

    const checks = [
        { name: 'Subject Format', pass: trialEmail.subject === 'Welcome to PetCare Pro — Happy Paws Animal Hospital Account Is Ready' },
        { name: 'PetCare Pro Branding Header', pass: trialEmail.html.includes('PetCare</span>') && trialEmail.html.includes('Pro</span>') && trialEmail.html.includes('Official Notification') },
        { name: 'Greeting with Clinic Name', pass: trialEmail.html.includes('Hello <strong>Happy Paws Animal Hospital</strong>') },
        { name: 'Account Details - Real Clinic Name', pass: trialEmail.html.includes('Happy Paws Animal Hospital') },
        { name: 'Account Details - Real Admin Name', pass: trialEmail.html.includes('Dr. Rajesh Sharma') },
        { name: 'Account Details - Real Email', pass: trialEmail.html.includes('rajesh@happypawsclinic.com') },
        { name: 'Password Security (Masked)', pass: trialEmail.html.includes('Set during registration') && !trialEmail.html.includes('password123') },
        { name: 'Trial Banner Present', pass: trialEmail.html.includes('Your 7-Day Free Trial Is Active') },
        { name: 'Formatted Dates (Readable)', pass: trialEmail.html.includes('20 August 2026') && trialEmail.html.includes('27 August 2026') && !trialEmail.html.includes('T00:00:00') },
        { name: 'Plan Price Formatting', pass: trialEmail.html.includes('₹0.00 (Free Trial)') },
        { name: 'Plan Features Formatted', pass: trialEmail.html.includes('Patient Records & Medical History') && trialEmail.html.includes('Appointments & Scheduling') && trialEmail.html.includes('Staff & User Management') },
        { name: 'Login CTA Button with Configured URL', pass: trialEmail.html.includes('http://localhost:5174/login') && trialEmail.html.includes('Login to PetCare Pro →') },
        { name: 'Support Section Present', pass: trialEmail.html.includes('support@kiaantechnology.com') && trialEmail.html.includes('+91 97521 00980') },
        { name: 'No Undefined/Null Placeholders', pass: !trialEmail.html.includes('undefined') && !trialEmail.html.includes('null') && !trialEmail.html.includes('N/A') }
    ];

    checks.forEach(c => {
        console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
        if (!c.pass) allPassed = false;
    });

    // ── TEST 2: Paid Plan Template Generation ──
    console.log('\n--- TEST 2: Paid Plan Template (Pro Plan) ---');
    const proEmail = generateWelcomeEmail({
        adminName: 'Dr. Ananya Roy',
        email: 'ananya@vetcare.com',
        clinicName: 'Roy Pet Clinic',
        planName: 'Pro',
        price: '1499.00',
        durationDays: 30,
        startDate: new Date('2026-08-20'),
        endDate: new Date('2026-09-19'),
        isTrial: false,
        features: ['PATIENT_RECORDS', 'APPOINTMENTS', 'STAFF_MANAGEMENT', 'REPORTS_ANALYTICS', 'SHIFT_MANAGEMENT', 'AI_ASSISTANT'],
        loginUrl: 'http://localhost:5174/login'
    });

    const proChecks = [
        { name: 'Subject Format for Pro', pass: proEmail.subject.includes('Roy Pet Clinic') },
        { name: 'No Trial Banner for Paid Plan', pass: !proEmail.html.includes('7-Day Free Trial Is Active') },
        { name: 'Pro Price Display', pass: proEmail.html.includes('₹1499.00') },
        { name: 'Pro Features (includes AI Assistant)', pass: proEmail.html.includes('🤖 Kiaan AI Assistant & Automation') },
        { name: 'Status is Active', pass: proEmail.html.includes('Active') }
    ];

    proChecks.forEach(c => {
        console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
        if (!c.pass) allPassed = false;
    });

    // ── TEST 3: Safe Fallback for Empty/Missing Names ──
    console.log('\n--- TEST 3: Safe Fallback for Missing Optional Fields ---');
    const fallbackEmail = generateWelcomeEmail({
        email: 'admin@clinic.com',
        loginUrl: 'http://localhost:5174/login'
    });

    const fallbackChecks = [
        { name: 'Safe Greeting Fallback', pass: fallbackEmail.html.includes('Hello <strong>there</strong>') },
        { name: 'Safe Subject Fallback', pass: fallbackEmail.subject === 'Welcome to PetCare Pro — Your Account Is Ready' },
        { name: 'Safe Clinic Name Fallback', pass: fallbackEmail.html.includes('PetCare Pro Clinic') },
        { name: 'No null/undefined in HTML', pass: !fallbackEmail.html.includes('undefined') && !fallbackEmail.html.includes('null') }
    ];

    fallbackChecks.forEach(c => {
        console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
        if (!c.pass) allPassed = false;
    });

    // ── TEST 4: End-to-End Registration Execution with Real DB ──
    console.log('\n--- TEST 4: End-to-End Registration Flow with Real DB ---');
    const authController = require('../controllers/authController');
    const testEmail = `qa_admin_${Date.now()}@petcareprotest.com`;
    const testMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    const mockReq = {
        body: {
            businessName: 'QA Sunrise Pet Hospital',
            adminName: 'Dr. QA Administrator',
            email: testEmail,
            mobile: testMobile,
            password: 'StrongPassword@2026',
            confirmPassword: 'StrongPassword@2026',
            selectedPlan: 'free-trial'
        }
    };

    let registerResponse = null;
    let registerStatus = null;
    const mockRes = {
        status: (code) => {
            registerStatus = code;
            return {
                json: (data) => {
                    registerResponse = data;
                }
            };
        }
    };

    await authController.registerUser(mockReq, mockRes);
    console.log(`  Registration API Status: ${registerStatus} (${registerResponse ? registerResponse.status : 'no data'})`);

    const regChecks = [
        { name: 'Registration HTTP Status 201', pass: registerStatus === 201 },
        { name: 'Response Status success', pass: registerResponse && registerResponse.status === 'success' },
        { name: 'Returned User Email matches', pass: registerResponse && registerResponse.data.email === testEmail },
        { name: 'Returned 7-Day Trial Dates', pass: registerResponse && registerResponse.data.trialExpiryDate !== undefined }
    ];

    // Verify DB insertion
    const [createdUser] = await db.query('SELECT * FROM users WHERE email = ?', [testEmail]);
    const [createdClinic] = await db.query('SELECT * FROM clinics WHERE id = ?', [createdUser[0]?.clinic_id]);
    const [createdSub] = await db.query('SELECT * FROM saas_subscriptions WHERE clinic_admin_id = ?', [createdUser[0]?.id]);

    regChecks.push({ name: 'User Created in Database', pass: createdUser.length > 0 && createdUser[0].role === 'Admin' });
    regChecks.push({ name: 'Clinic Created in Database with TRIAL status', pass: createdClinic.length > 0 && createdClinic[0].status === 'TRIAL' });
    regChecks.push({ name: 'Subscription Created in Database with plan-free-trial', pass: createdSub.length > 0 && createdSub[0].plan_id === 'plan-free-trial' && createdSub[0].status === 'Trial' });

    regChecks.forEach(c => {
        console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
        if (!c.pass) allPassed = false;
    });

    // ── TEST 5: Duplicate Registration Protection ──
    console.log('\n--- TEST 5: Duplicate Registration Protection ---');
    let dupStatus = null;
    let dupResponse = null;
    await authController.registerUser(mockReq, {
        status: (code) => {
            dupStatus = code;
            return {
                json: (data) => {
                    dupResponse = data;
                }
            };
        }
    });

    const dupChecks = [
        { name: 'Duplicate Registration Blocked with 400', pass: dupStatus === 400 },
        { name: 'Duplicate Error Message Returned', pass: dupResponse && dupResponse.message.includes('already registered') }
    ];

    dupChecks.forEach(c => {
        console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
        if (!c.pass) allPassed = false;
    });

    // Clean up test user & clinic to keep DB pristine
    if (createdUser[0]?.id) {
        await db.query('DELETE FROM saas_subscriptions WHERE clinic_admin_id = ?', [createdUser[0].id]);
        await db.query('DELETE FROM users WHERE id = ?', [createdUser[0].id]);
        if (createdClinic[0]?.id) {
            await db.query('DELETE FROM clinics WHERE id = ?', [createdClinic[0].id]);
        }
        console.log('\n[Clean Up] QA test registration cleaned up cleanly.');
    }

    console.log('\n====================================================');
    console.log(`QA RESULT: ${allPassed ? 'ALL CHECKS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
    console.log('====================================================');
}

runQATests().catch(console.error).finally(() => process.exit());
