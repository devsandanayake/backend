import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT =  3001;

app.use(express.json());
app.use(cors());

// Webhook signature verification function
function verifyWebhookSignature(payload, signature, secret) {
  if (!signature.startsWith('sha256=')) {
    throw new Error('Invalid signature format');
  }

  const signatureHex = signature.slice(7);  

  // Important: payload must be the raw JSON string, not parsed+stringified
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureHex, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}
 
// Webhook endpoint to receive payment updates
app.post('/webhook', (req, res) => {
  try {
    // const signature = req.headers['x-signature'] || 
    //                  req.headers['x-transvoucher-signature'] || 
    //                  req.headers['signature'];
    
    // if (!signature) {
    //   return res.status(400).json({ error: 'Missing signature header' });
    // }
    // const webhookSecret =  "your_webhook_secret_here" ;  
    // const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);
    
    // if (!isValid) {
    //   console.log('Invalid webhook signature');
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Parse the webhook payload
    const payload = JSON.parse(req.body.toString());
    console.log('Webhook received:', payload);

    // Handle different webhook events
    switch (payload.event_type) {
      case 'payment.completed':
        console.log('Payment completed:', payload.data);
        
        break;
        
      case 'payment.failed':
        console.log('Payment failed:', payload.data);
        // Handle failed payment
        break;
        
      case 'payment.pending':
        console.log('Payment pending:', payload.data);
        // Handle pending payment
        break;
        
      default:
        console.log('Unknown event type:', payload.event_type);
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`)
});

export default app;