import express from 'express';
const app = express();

// Helper function to format USDC value
function formatUSDC(value) {
    try {
        const valueBigInt = BigInt(value); // Assumes value is already a hex string
        return (Number(valueBigInt) / 1_000_000).toFixed(6);
    } catch (error) {
        console.error('Error parsing value:', value);
        return '0.000000';
    }
}

// Helper function to extract address from topic
function extractAddress(topic) {
    return topic ? `0x${topic.slice(-40).toLowerCase()}` : 'unknown';
}

// Process logs for transfer events
function processLogs(logs, txHash) {
    for (const log of logs) {
        const { topic0, topic1, topic2, data } = log;

        // Validate required fields
        if (!topic0 || !topic1 || !data) {
            console.warn('Log missing required fields:', log);
            continue;
        }

        const from = extractAddress(topic1);
        const to = extractAddress(topic2);
        const valueInUSDC = formatUSDC(data);

        console.log("Transfer:");
        console.log(`  From: ${from}`);
        console.log(`  To: ${to}`);
        console.log(`  Value: ${valueInUSDC} USDC`);
        console.log(`  Transaction Hash: ${txHash}`);
    }
}

// Webhook endpoint
app.post('/callback', express.json({ type: 'application/json' }), (request, response) => {
    const { body } = request;

    switch (body.eventType) {
        case 'address_activity':
            console.log("*** Address_activity ***");
            const { logs, transaction } = body.event || {};
            const txHash = transaction?.txHash || 'unknown';

            if (logs && Array.isArray(logs)) {
                processLogs(logs, txHash);
            } else {
                console.warn('No logs found in event:', body.event);
            }
            break;

        default:
            console.log(`Unhandled event type: ${body.eventType}`);
    }

    response.json({ received: true });
});

// Start server
const PORT = 8000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));