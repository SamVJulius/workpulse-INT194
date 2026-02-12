const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = '';
let sessionId = '';

async function runTest() {
    console.log('🚀 Starting WorkPulse Concurrency Load Test\n');

    try {
        // Step 1: Register a test user
        console.log('📝 Step 1: Registering test user...');
        const registerResponse = await axios.post(`${API_URL}/auth/register`, {
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            name: 'Load Test User',
            organization_name: 'Load Test Org',
            plan_type: 'free',
        });

        authToken = registerResponse.data.access_token;
        console.log('✅ User registered successfully\n');

        // Step 2: Start a work session
        console.log('📝 Step 2: Starting work session...');
        const sessionResponse = await axios.post(
            `${API_URL}/sessions/start`,
            {},
            {
                headers: { Authorization: `Bearer ${authToken}` },
            },
        );

        sessionId = sessionResponse.data.id;
        console.log(`✅ Session started: ${sessionId}\n`);

        // Step 3: Fire 100 parallel activity requests
        console.log('📝 Step 3: Firing 100 parallel activity requests...');
        const startTime = Date.now();

        const activityPromises = [];
        const activityDuration = 30; // 30 seconds per activity

        for (let i = 0; i < 100; i++) {
            const promise = axios.post(
                `${API_URL}/sessions/${sessionId}/activity`,
                {
                    activity_type: 'active',
                    duration_seconds: activityDuration,
                    url: `https://example.com/page-${i}`,
                },
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                },
            );
            activityPromises.push(promise);
        }

        const results = await Promise.allSettled(activityPromises);
        const endTime = Date.now();

        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        console.log(`✅ Completed in ${endTime - startTime}ms`);
        console.log(`   Successful: ${successful}`);
        console.log(`   Failed: ${failed}\n`);

        // Step 4: Verify totals
        console.log('📝 Step 4: Verifying session totals...');
        const verifyResponse = await axios.get(`${API_URL}/sessions/active`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        const session = verifyResponse.data;
        const expectedTotal = 100 * activityDuration; // 100 activities × 30 seconds

        console.log(`   Expected total: ${expectedTotal} seconds`);
        console.log(`   Actual total: ${session.total_active_seconds} seconds`);
        console.log(`   Difference: ${Math.abs(expectedTotal - session.total_active_seconds)} seconds`);

        if (session.total_active_seconds === expectedTotal) {
            console.log('✅ PASS: Totals match exactly! No double counting detected.\n');
        } else if (Math.abs(expectedTotal - session.total_active_seconds) <= 30) {
            console.log('⚠️  WARN: Totals are close but not exact (within tolerance).\n');
        } else {
            console.log('❌ FAIL: Totals do not match! Possible concurrency issue.\n');
        }

        // Step 5: Test bulk upload with duplicates
        console.log('📝 Step 5: Testing bulk upload with duplicates...');
        const bulkActivities = [];
        for (let i = 0; i < 50; i++) {
            bulkActivities.push({
                client_activity_id: `bulk-${i}`,
                timestamp: new Date(Date.now() - (50 - i) * 60000).toISOString(),
                activity_type: 'active',
                duration_seconds: 60,
                url: `https://example.com/bulk-${i}`,
            });
        }

        const bulkResponse1 = await axios.post(
            `${API_URL}/sessions/${sessionId}/activity/bulk`,
            { activities: bulkActivities },
            {
                headers: { Authorization: `Bearer ${authToken}` },
            },
        );

        console.log(`   First upload: ${bulkResponse1.data.uploaded} uploaded, ${bulkResponse1.data.duplicates} duplicates`);

        // Upload same batch again to test idempotency
        const bulkResponse2 = await axios.post(
            `${API_URL}/sessions/${sessionId}/activity/bulk`,
            { activities: bulkActivities },
            {
                headers: { Authorization: `Bearer ${authToken}` },
            },
        );

        console.log(`   Second upload: ${bulkResponse2.data.uploaded} uploaded, ${bulkResponse2.data.duplicates} duplicates`);

        if (bulkResponse2.data.duplicates === 50 && bulkResponse2.data.uploaded === 0) {
            console.log('✅ PASS: Bulk upload is idempotent! All duplicates detected.\n');
        } else {
            console.log('❌ FAIL: Bulk upload is not idempotent!\n');
        }

        // Step 6: Stop session
        console.log('📝 Step 6: Stopping session...');
        await axios.post(
            `${API_URL}/sessions/${sessionId}/stop`,
            {},
            {
                headers: { Authorization: `Bearer ${authToken}` },
            },
        );
        console.log('✅ Session stopped\n');

        console.log('🎉 Load test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

runTest();
