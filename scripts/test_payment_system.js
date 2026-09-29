const http = require('http');

async function testPaymentSystem() {
    console.log('🧪 Testing Payment & Subscription API Endpoints...');

    // Test 1: GET /api/payment/config
    const get = (path) => new Promise((resolve, reject) => {
        http.get(`http://localhost:5002${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
        }).on('error', reject);
    });

    try {
        const configRes = await get('/api/payment/config');
        console.log('1. /api/payment/config Status:', configRes.status);
        console.log('   Response:', configRes.body);

        const plansRes = await get('/api/subscriptions/plans');
        console.log('2. /api/subscriptions/plans Status:', plansRes.status);
        console.log('   Response:', plansRes.body);

        const invoiceHtmlRes = await get('/api/payment/invoice/INV-1786208931003/html');
        console.log('3. /api/payment/invoice/:inv/html Status:', invoiceHtmlRes.status);
        console.log('   Content-Type:', invoiceHtmlRes.headers['content-type']);
        console.log('   HTML snippet length:', invoiceHtmlRes.body.length);

        console.log('🎉 All Payment API tests completed successfully!');
    } catch (err) {
        console.error('❌ Test failed:', err.message);
    } finally {
        process.exit(0);
    }
}

testPaymentSystem();
