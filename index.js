import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5009;

app.use(cors());

// ✅ Use raw body for webhook verification if required by the payment provider
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString(); // keep raw payload for signature validation (optional)
  }
}));

// Webhook endpoint to receive payment updates
app.post('/webhook', (req, res) => {
  try {
    const payload = req.body; // ✅ body is already parsed as JSON

    console.log('Webhook received:', payload);

    // Handle different webhook events
    switch (payload.event_type) {
      case 'payment.completed':
        console.log('✅ Payment completed:', payload.data);
        // handle successful payment logic
        break;

      case 'payment.failed':
        console.log('❌ Payment failed:', payload.data);
        // handle failed payment logic
        break;

      case 'payment.pending':
        console.log('⏳ Payment pending:', payload.data);
        // handle pending payment logic
        break;

      default:
        console.log('⚠️ Unknown event type:', payload.event_type);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📩 Webhook endpoint: http://localhost:${PORT}/webhook`);
});

export default app;