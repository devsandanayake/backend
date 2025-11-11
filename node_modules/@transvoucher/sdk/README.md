# TransVoucher TypeScript SDK

Official TypeScript/JavaScript SDK for the TransVoucher payment processing API.

[![npm version](https://badge.fury.io/js/%40transvoucher%2Fsdk.svg)](https://badge.fury.io/js/%40transvoucher%2Fsdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

Install the SDK using npm:

```bash
npm install @transvoucher/sdk
```

Or using yarn:

```bash
yarn add @transvoucher/sdk
```

## Quick Start

```typescript
import TransVoucher from '@transvoucher/sdk';

// Initialize for sandbox
const client = TransVoucher.sandbox('your-api-key', 'your-api-secret');

// Or for production
const client = TransVoucher.production('your-api-key', 'your-api-secret');

// Create a payment
const payment = await client.payments.create({
    amount: 100.00,
    title: 'Test Payment',  // Required - title of the payment link
    currency: 'USD',  // Optional - defaults to USD (see available currencies via client.currencies.all())
    description: 'Test payment',  // Optional
    multiple_use: false,  // Optional
    customer_details: {  // Optional
        first_name: 'John',            // Optional
        last_name: 'Doe',              // Optional
        email: 'customer@example.com', // Optional
        phone: '+1234567890',          // Optional
    },
    metadata: {  // Optional - returned in webhooks and API responses
        order_id: 'ORDER-123',
        user_id: 'USER-456'
    }
});

console.log('Payment created:', payment.id);
console.log('Reference ID:', payment.reference_id);
console.log('Payment URL:', payment.payment_url);
```

## Configuration

### Basic Configuration

```typescript
import {TransVoucher} from '@transvoucher/sdk';

const client = new TransVoucher({
    apiKey: 'your-api-key',
    environment: 'sandbox', // or 'production'
    timeout: 30000 // optional, default is 30000ms
});
```

### Environment Switching

```typescript
// Start with sandbox
const client = TransVoucher.sandbox('your-api-key', 'your-api-secret');

// Switch to production
client.switchEnvironment('production');

// Check current environment
if (client.isProduction()) {
    console.log('Running in production mode');
}
```

## API Reference

### Payments

#### Create Payment

```typescript
const payment = await client.payments.create({
    // Required fields
    amount: 100.00, // Optional when is_price_dynamic is true
    title: 'Product Purchase', // Required - title of the payment link

    // Optional fields
    currency: 'USD', // Optional - defaults to USD (see available currencies via client.currencies.all())
    description: 'Order payment', // Optional - description of the payment
    multiple_use: false, // Optional - whether the payment link can be used multiple times
    cancel_on_first_fail: false, // Optional - cancel payment link after first failed attempt
    is_price_dynamic: false, // Optional - when true, allows customers to set their own amount during checkout (default: false)
    expires_at: '2025-12-31T23:59:59Z', // Optional - when the payment link expires

    // URL redirects (optional)
    redirect_url: 'https://example.com/redirect', // Optional - redirect after payment
    success_url: 'https://example.com/success',   // Optional - redirect on success
    cancel_url: 'https://example.com/cancel',     // Optional - redirect on cancel

    // UI customization (optional)
    theme: 'dark', // Optional - 'dark' or 'light'
    lang: 'en',    // Optional - the language for the payment page - possible values: en, es, fr, de, it, pt, ru, zh, ja, ko, tr, ka

    // Customer details (optional)
    customer_details: {
        // Learn more: https://transvoucher.com/api-documentation#pre_fill
        email: 'customer@example.com',   // Optional
        phone: '+1333999999',            // Optional
        
        // as splits (recommended):
        first_name: 'John',              // Optional
        middle_name: 'Jay',              // Optional
        last_name: 'Doe',                // Optional

        // OR as one field (not recommended!):
        full_name: 'John Doe',           // Optional

        date_of_birth: '1992-12-21',     // Optional - YYYY-MM-DD format
        country_of_residence: 'US',      // Optional - alpha-2 country short code
        state_of_residence: 'NY',        // Optional
        // rules for usage of "state_of_residence":
        // - if present, has to be a valid US state short code (alpha-2 uppercase)
        // - required if "country_of_residence" is "US" (we will ask for it if you don't prefill it)
        // - has to be dropped (not be in the payload) when "country_of_residence" is not "US"

        // Prefill card billing address (optional)
        card_country_code: 'US', // alpha-2 country short code

        card_state_code: 'MT',
        // rules for usage of "card_state_code":
        // - if present, has to be a valid US state short code (alpha-2 uppercase)
        // - required if "card_country_code" is "US" (we will ask for it if you don't prefill it)
        // - has to be dropped (not be in the payload) when "card_country_code" is not "US"

        card_city: 'Montana',
        card_post_code: '12345',
        card_street: 'Street 123',
    },

    // Custom fields (optional)
    custom_fields: {
        field1: 'value1',
        field2: 'value2'
    },

    // Metadata (optional)
    metadata: {
        // Optional - use this to identify the customer or payment session
        // This data will be returned in webhooks and API responses
        order_id: '123',
        user_id: '456',
        session_id: '789'
    },

    // Any additional custom fields
    // The interface is dynamically extensible - you can add any custom key-value pairs
    custom_property: 'custom_value',
    another_field: 123,
    any_other_data: { nested: 'data' }
});

// Helper methods for payment status
if (client.payments.isCompleted(payment)) {
    console.log('Payment is completed');
} else if (client.payments.isProcessing(payment)) {
    console.log('Payment is processing');
} else if (client.payments.isAttempting(payment)) {
    console.log('Payment is being attempted');
} else if (client.payments.isPending(payment)) {
    console.log('Payment is pending');
} else if (client.payments.isFailed(payment)) {
    console.log('Payment has failed');
} else if (client.payments.isCancelled(payment)) {
    console.log('Payment was cancelled');
} else if (client.payments.isExpired(payment)) {
    console.log('Payment has expired');
}
```

#### Get Transaction Status

```typescript
const payment = await client.payments.getTransactionStatus('...');
console.log('Status:', payment.status);
console.log('Reference ID:', payment.reference_id);
console.log('Currency:', payment.currency);
console.log('Transaction ID:', payment.transaction_id);
console.log('Payment URL:', payment.payment_url);

// Access transaction details if available
if (payment.fiat_base_amount) {
    console.log('Base Amount:', payment.fiat_base_amount);
    console.log('Total Amount:', payment.fiat_total_amount);
    console.log('Commodity:', payment.commodity);
    console.log('Commodity Amount:', payment.commodity_amount);
}

// Access payment method details if available
if (payment.payment_method) {
    console.log('Card Brand:', payment.payment_method.card_brand);
    console.log('Payment Type:', payment.payment_method.payment_type);
}

// Access blockchain transaction hash if available
if (payment.blockchain_tx_hash) {
    console.log('Blockchain TX Hash:', payment.blockchain_tx_hash);
}
```

#### Get Payment Link Status

```typescript
const paymentLink = await client.payments.getPaymentLinkStatus('...');
console.log('Status:', paymentLink.status);
console.log('Reference ID:', paymentLink.reference_id);
console.log('Currency:', paymentLink.currency);
console.log('Transaction ID:', paymentLink.transaction_id);
console.log('Payment URL:', paymentLink.payment_url);

// Access transaction details if available
if (paymentLink.fiat_base_amount) {
    console.log('Base Amount:', paymentLink.fiat_base_amount);
    console.log('Total Amount:', paymentLink.fiat_total_amount);
    console.log('Commodity:', paymentLink.commodity);
    console.log('Commodity Amount:', paymentLink.commodity_amount);
}

// Access payment method details if available
if (paymentLink.payment_method) {
    console.log('Card Brand:', paymentLink.payment_method.card_brand);
    console.log('Payment Type:', paymentLink.payment_method.payment_type);
}

// Access blockchain transaction hash if available
if (paymentLink.blockchain_tx_hash) {
    console.log('Blockchain TX Hash:', paymentLink.blockchain_tx_hash);
}
```

#### List Payments

The API uses cursor-based pagination for efficient listing of payments.

```typescript
// First page
const result = await client.payments.list({
    limit: 10,  // Optional - defaults to 10, max 100
    status: 'completed',  // Optional - filter by status
    from_date: '2024-01-01',  // Optional - filter by date range
    to_date: '2024-12-31',
});

console.log('Payments:', result.payments);
console.log('Count:', result.count);
console.log('Has more:', result.has_more);

// Get next page if available
if (result.has_more && result.next_page_token) {
    const nextPage = await client.payments.list({
        limit: 10,
        page_token: result.next_page_token,
        status: 'completed'
    });
    console.log('Next page payments:', nextPage.payments);
}
```

#### Get Payment by Reference

```typescript
// Search for a payment using your custom reference in metadata
const payment = await client.payments.getByReference('order-123');
if (payment) {
    console.log('Found payment:', payment.id);
    console.log('Metadata:', payment.metadata);
}
```

#### Get Available Currencies

```typescript
// Get all supported currencies
const currencies = await client.currencies.all();

currencies.forEach(currency => {
    console.log(`${currency.short_code}: ${currency.name} (${currency.symbol})`);
    console.log(`USD Value: ${currency.current_usd_value}`);

    if (client.currencies.isProcessedViaAnotherCurrency(currency)) {
        console.log(`Processed via: ${currency.processed_via_currency_code}`);
    }
});

// Find a specific currency by code
const usd = await client.currencies.findByCode('USD');
if (usd) {
    console.log('Found:', usd.name);
}

// Check if a currency is supported
const isSupported = await client.currencies.isSupported('EUR');
console.log('EUR is supported:', isSupported);
```

**Currency Object:**
- `short_code`: Currency code (e.g., 'USD', 'EUR', 'GBP')
- `name`: Currency full name (e.g., 'US Dollar')
- `symbol`: Currency symbol (e.g., '$', '€', '£')
- `current_usd_value`: Current USD exchange rate value
- `processed_via_currency_code`: Currency code this currency is processed via (null if processed directly)

**CurrencyService Methods:**
- `all()`: Get all active currencies
- `findByCode(shortCode)`: Find currency by code (case-insensitive)
- `isSupported(shortCode)`: Check if currency is supported
- `isProcessedViaAnotherCurrency(currency)`: Check if currency is processed via another currency

### Webhooks

#### Verify Webhook Signature

```typescript
import {WebhookUtils} from '@transvoucher/sdk';

const isValid = WebhookUtils.verifySignature(
    payload, // string or Buffer
    signature, // from X-Webhook-Signature header
    'your-api-secret' // your sales channel API secret
);
```

#### Parse Webhook Event

```typescript
const result = WebhookUtils.parseEvent(
    payload,
    signature,
    'your-api-secret'
);

if (result.isValid && result.event) {
    console.log('Event type:', result.event.event);
    console.log('Transaction ID:', result.event.data.transaction.id);
    console.log('Reference ID:', result.event.data.transaction.reference_id);
    console.log('Amount:', result.event.data.transaction.fiat_total_amount);
    console.log('Currency:', result.event.data.transaction.fiat_currency);
    console.log('Status:', result.event.data.transaction.status);
    console.log('Metadata:', result.event.data.metadata);
} else {
    console.error('Invalid webhook:', result.error);
}
```

#### Create Webhook Handler

```typescript
const handler = WebhookUtils.createHandler('your-api-secret', {
    'payment_intent.created': async (event) => {
        const transaction = event.data.transaction;
        console.log('Payment intent created:', transaction.id);
        // Optional: Log payment creation
    },
    'payment_intent.attempting': async (event) => {
        const transaction = event.data.transaction;
        console.log('Payment attempt started:', transaction.id);
        // Optional: Update order status to "attempting"
    },
    'payment_intent.processing': async (event) => {
        const transaction = event.data.transaction;
        console.log('Payment is processing:', transaction.id);
        // Optional: Update order status to "processing"
    },
    'payment_intent.succeeded': async (event) => {
        const transaction = event.data.transaction;
        console.log('Payment completed:', transaction.id);
        console.log('Amount:', transaction.fiat_total_amount, transaction.fiat_currency);
        console.log('Metadata:', event.data.metadata);
        // Handle successful payment - update order status, send confirmation email, etc.
    },
    'payment_intent.failed': async (event) => {
        const transaction = event.data.transaction;
        console.log('Payment failed:', transaction.id);
        console.log('Fail reason:', event.data.fail_reason);
        // Handle failed payment - notify user, log error, etc.
    },
    'payment_intent.cancelled': async (event) => {
        const transaction = event.data.transaction;
        console.log('Payment cancelled:', transaction.id);
        // Handle cancelled payment - update order status, notify user, etc.
    },
    'payment_intent.expired': async (event) => {
        const transaction = event.data.transaction;
        console.log('Payment expired:', transaction.id);
        // Handle expired payment - update order status, etc.
    }
});

// Use in your webhook endpoint
app.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'];
        await handler(req.body, signature);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send('Bad Request');
    }
});
```

## Error Handling

The SDK provides specific error types for different scenarios:

```typescript
import {
    TransVoucherError,
    ValidationError,
    AuthenticationError,
    ApiError,
    NetworkError
} from '@transvoucher/sdk';

try {
    const payment = await client.payments.create({
        amount: 100,
        title: 'Test Payment'
    });
} catch (error) {
    if (error instanceof ValidationError) {
        console.log('Validation errors:', error.errors);
    } else if (error instanceof AuthenticationError) {
        console.log('Authentication failed');
    } else if (error instanceof ApiError) {
        console.log('API error:', error.message);
        console.log('Status code:', error.statusCode);
    } else if (error instanceof NetworkError) {
        console.log('Network error:', error.message);
    } else {
        console.log('Unknown error:', error);
    }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import {Payment, PaymentStatus, CreatePaymentRequest, CustomerDetails} from '@transvoucher/sdk';

const paymentData: CreatePaymentRequest = {
    amount: 100.00,
    title: 'Test Payment',
    currency: 'USD',
    description: 'Test payment',
    theme: 'dark',
    lang: 'en',
    metadata: {
        order_id: '123'
    }
};

const payment: Payment = await client.payments.create(paymentData);
const status: PaymentStatus = payment.status;
const referenceId: string = payment.reference_id;
```

## Express.js Webhook Example

```typescript
import express from 'express';
import {WebhookUtils} from '@transvoucher/sdk';

const app = express();

// Middleware to capture raw body for signature verification
app.use('/webhook', express.raw({type: 'application/json'}));

app.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'] as string;
        const secret = process.env.TRANSVOUCHER_API_SECRET!; // Your sales channel API secret

        const result = WebhookUtils.parseEvent(req.body, signature, secret);

        if (!result.isValid || !result.event) {
            return res.status(400).json({error: result.error});
        }

        const {event, data} = result.event;
        const transaction = data.transaction;

        // Handle the event
        switch (event) {
            case 'payment_intent.created':
                console.log('Payment created:', transaction.id);
                // Optional: Log payment creation
                break;

            case 'payment_intent.attempting':
                console.log('Payment attempt started:', transaction.id);
                // Optional: Update order status
                break;

            case 'payment_intent.processing':
                console.log('Payment processing:', transaction.id);
                // Optional: Update order status
                break;

            case 'payment_intent.succeeded':
                console.log('Payment completed:', transaction.id);
                console.log('Amount:', transaction.fiat_total_amount, transaction.fiat_currency);
                console.log('Reference:', transaction.reference_id);
                console.log('Metadata:', data.metadata);
                // Update your database, send confirmation email, etc.
                break;

            case 'payment_intent.failed':
                console.log('Payment failed:', transaction.id);
                console.log('Fail reason:', data.fail_reason);
                // Notify customer, log error, etc.
                break;

            case 'payment_intent.cancelled':
                console.log('Payment cancelled:', transaction.id);
                // Handle cancellation
                break;

            case 'payment_intent.expired':
                console.log('Payment expired:', transaction.id);
                // Handle expiration
                break;

            default:
                console.log('Unhandled event:', event);
        }

        res.status(200).json({received: true});
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});
```

## Node.js Compatibility

- Node.js 16.0.0 or higher
- Works with both CommonJS and ES modules
- Full TypeScript support

## Available Payment Statuses

- `pending` - Payment is awaiting processing
- `attempting` - Payment is being attempted
- `processing` - Payment is being processed
- `completed` - Payment has been successfully completed
- `failed` - Payment has failed
- `expired` - Payment has expired
- `cancelled` - Payment has been cancelled

## Available Webhook Events

- `payment_intent.created` - Payment intent was created
- `payment_intent.attempting` - Payment attempt was started
- `payment_intent.processing` - Payment is processing (not always sent)
- `payment_intent.succeeded` - Payment attempt was completed successfully
- `payment_intent.failed` - Payment intent failed
- `payment_intent.cancelled` - Payment intent was cancelled
- `payment_intent.expired` - Payment intent expired

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- **API Documentation**: [https://transvoucher.com/api-documentation](https://transvoucher.com/api-documentation)
- **Service Availability
  **: [https://transvoucher.com/api-documentation/service-availability](https://transvoucher.com/api-documentation/service-availability)
- **Email**: developers@transvoucher.com
- **Telegram**: @{{ $brand_telegram_contact }}

## License

This SDK is released under the MIT License. See [LICENSE](LICENSE) for details. 