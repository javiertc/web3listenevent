import express from 'express';
import moment from 'moment-timezone';

// Initialize Express
const app = express();
app.use(express.json());  // Parse JSON request bodies

// In-memory store for retry info
// retryStore[messageId] = { count: number, lastAttempt: number }
const retryStore = {};

app.post('/callback', (req, res) => {
  const { webhookId, messageId } = req.body;
  const now = Date.now();
  // Format time in New York timezone with AM/PM
  const timestamp = moment().tz('America/New_York').format('MM/DD/YYYY, hh:mm:ss A');

  // We must have messageId to track retries
  if (!messageId) {
    console.log(`[${timestamp}] ERROR: Received request without a messageId.`);
    return res.status(400).send('Bad Request - Missing messageId');
  }

  // Check if it's a first attempt or a retry for this messageId
  if (retryStore[messageId]) {
    // It's a retry
    const info = retryStore[messageId];
    info.count += 1;
    const diffMs = now - info.lastAttempt;
    const diffSeconds = (diffMs / 1000).toFixed(2);
    const diffMinutes = (diffMs / 60000).toFixed(2);
    const diffHours = (diffMs / 3600000).toFixed(2);
    info.lastAttempt = now;

    // Single-line log with all info
    console.log(
      `[${timestamp}] RETRY #${info.count} | ` +
      `webhookId=${webhookId || 'N/A'} | ` +
      `messageId=${messageId} | ` +
      `timeSinceLast=${diffMs}ms (${diffSeconds}s / ${diffMinutes}m) / ${diffHours}h)`
    );
  } else {
    // First attempt
    retryStore[messageId] = { count: 1, lastAttempt: now };
    console.log(
      `[${timestamp}] FIRST ATTEMPT | ` +
      `webhookId=${webhookId || 'N/A'} | ` +
      `messageId=${messageId}`
    );
  }

  // Return 400 to force retry
  return res.status(400).send('Bad Request - forcing retry');
});

// Start the server on port 8000
const PORT = 8000;
app.listen(PORT, () => {
    const startTime = moment().tz('America/New_York').format('MM/DD/YYYY, HH:mm:ss');
    console.log(`[${startTime}] Webhook listener running on http://localhost:${PORT}/callback`);
});