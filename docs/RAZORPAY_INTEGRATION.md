# Razorpay Payment Integration Guide

This guide covers integrating Razorpay into LePrint for real payments. Currently the system uses mock payments (`mock_payment_*`). Follow this guide to enable real payment processing.

> **Note:** The `razorpay` npm package (`razorpay@2.9.6`) is already installed in `backend/package.json` — no `npm install` needed.

---

## Prerequisites

1. **Razorpay Account** — sign up at https://dashboard.razorpay.com/signup
2. **KYC Verification** — required for live mode (24-48 hours)
3. **HTTPS on backend** — Razorpay requires valid SSL for webhooks
4. **Razorpay SDK** — already installed (`razorpay@2.9.6` in backend)

---

## 1. Get API Keys

1. Login to https://dashboard.razorpay.com/
2. Go to **Settings → API Keys**
3. Generate **Test Keys** (for development)
4. Generate **Live Keys** (for production, after KYC)

You'll get:
- **Key ID** (`rzp_test_...` or `rzp_live_...`) — public, safe to send to frontend
- **Key Secret** — private, NEVER expose to frontend

---

## 2. Environment Variables

### Backend `.env`

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Frontend `.env`

```env
# No Razorpay-specific vars needed — the key_id is sent from backend at order creation time
```

---

## 3. Backend Implementation

### 3.1 Create `backend/modules/razorpay.js`

```javascript
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create a Razorpay order (amount in INR, converted to paise internally)
async function createOrder(amountINR, jobId, userId) {
    const order = await razorpay.orders.create({
        amount: Math.round(amountINR * 100), // paise
        currency: 'INR',
        receipt: `job_${jobId}`,
        notes: { job_id: jobId, user_id: userId }
    });
    return order;
}

// Verify payment signature (called after frontend Razorpay checkout completes)
function verifySignature(orderId, paymentId, signature) {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
    return expected === signature;
}

// Verify webhook signature
function verifyWebhookSignature(rawBody, signature) {
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
    return expected === signature;
}

// Fetch payment details from Razorpay
async function fetchPayment(paymentId) {
    return razorpay.payments.fetch(paymentId);
}

// Issue a refund
async function refund(paymentId, amountINR) {
    const opts = amountINR ? { amount: Math.round(amountINR * 100) } : {};
    return razorpay.payments.refund(paymentId, opts);
}

module.exports = { createOrder, verifySignature, verifyWebhookSignature, fetchPayment, refund };
```

### 3.2 Add Payment Routes

Add these routes in `backend/modules/job-routes.js` (or a new `payment-routes.js`):

```javascript
const rzp = require('./razorpay');

// POST /api/payments/create-order — create Razorpay order for a job
router.post('/payments/create-order', verifyToken, async (req, res) => {
    const { job_id } = req.body;
    const job = await db.getJob(job_id);

    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.user_id !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });
    if (job.status === 'PAID') return res.status(400).json({ error: 'Already paid' });

    const order = await rzp.createOrder(job.total_cost, job_id, req.user.uid);

    // Store order ID on the job
    await db.updateJob(job_id, {
        metadata: { ...job.metadata, razorpay_order_id: order.id }
    });

    res.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
    });
});

// POST /api/payments/verify — verify payment after checkout
router.post('/payments/verify', verifyToken, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, job_id } = req.body;

    if (!rzp.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return res.status(400).json({ error: 'Invalid payment signature' });
    }

    await db.updateJob(job_id, {
        status: 'PAID',
        paid_at: new Date(),
        metadata: {
            ...(await db.getJob(job_id)).metadata,
            razorpay_payment_id,
            razorpay_order_id
        }
    });

    res.json({ success: true, job_id });
});

// POST /api/payments/webhook — Razorpay webhook events
// IMPORTANT: must use express.raw() for this route (signature verification needs raw body)
router.post('/payments/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const sig = req.headers['x-razorpay-signature'];
        if (!rzp.verifyWebhookSignature(req.body.toString(), sig)) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = JSON.parse(req.body.toString());
        const payment = event.payload?.payment?.entity;
        const jobId = payment?.notes?.job_id;

        if (event.event === 'payment.captured' && jobId) {
            await db.updateJob(jobId, { status: 'PAID', paid_at: new Date() });
        }
        if (event.event === 'payment.failed' && jobId) {
            await db.updateJob(jobId, { error_message: payment.error_description });
        }

        res.json({ status: 'ok' });
    }
);
```

### 3.3 Register Webhook Route Before JSON Parser

The webhook route needs raw body access. In `backend/index.js`, register the webhook before the global `express.json()` middleware, or use `express.raw()` specifically for that route as shown above.

---

## 4. Frontend Implementation

### 4.1 Add Razorpay Checkout Script

Add to `frontend/index.html` inside `<head>`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 4.2 Update Payment Handler

Replace the mock `handlePayment` in `usePrint.js`.

> **Current mock flow:** Currently `handlePayment()` uses `mock_payment_*` IDs via `POST /api/jobs/:id/verify-payment`. Replace this with the Razorpay order flow described below when ready to go live.

The current `usePrint.js` uses a multi-job architecture. The active job is accessed via `activeJob` (derived from `jobs[activeJobIndex]`). Key state references:
- `activeJob.jobId` — the job ID
- `activeJob.pricing.totalPrice` — the total price
- `activeJob.pricing.pages` — page count
- `activeJob.printSettings` — print settings (colorMode, orientation, copies, etc.)

```javascript
const handlePayment = useCallback(async () => {
    if (!activeJob?.jobId) return;
    addLog('Initiating payment...');

    try {
        const headers = await buildHeaders();

        // Step 1: Create order
        const { data } = await axios.post(
            `${API_URL}/api/payments/create-order`,
            { job_id: activeJob.jobId },
            { headers }
        );

        // Step 2: Open Razorpay checkout
        const rzp = new window.Razorpay({
            key: data.key_id,
            amount: data.amount,
            currency: data.currency,
            name: 'LePrint',
            description: `Print Job — ${activeJob.pricing.pages} pages`,
            order_id: data.order_id,
            handler: async (response) => {
                // Step 3: Verify on backend
                await axios.post(
                    `${API_URL}/api/payments/verify`,
                    {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        job_id: activeJob.jobId
                    },
                    { headers }
                );
                updateJob(activeJob.jobId, { status: 'PRINTING' });
                setViewStatus('PRINTING');
            },
            modal: {
                ondismiss: () => setViewStatus('PAYMENT')
            },
            theme: { color: '#000000' }
        });
        rzp.open();
    } catch (e) {
        updateJob(activeJob.jobId, { status: 'ERROR', success: false, completedAt: new Date() });
        setViewStatus('ERROR');
        addLog(`Payment failed: ${e.response?.data?.error || e.message}`);
    }
}, [activeJob, API_URL, addLog, buildHeaders, updateJob, setViewStatus]);
```

### 4.3 Update Xerox Payment

Similarly update `handleXeroxStart` in `usePrint.js` — replace the mock `verify-payment` call with the Razorpay checkout flow. The xerox payment should work the same way: create order → checkout → verify → proceed to scan+print.

---

## 5. Payment Flow

```
User clicks "Pay ₹X & Print"
        ↓
Frontend → POST /api/payments/create-order { job_id }
        ↓
Backend → Razorpay Orders API → returns order_id
        ↓
Frontend opens Razorpay Checkout modal
        ↓
User pays (UPI / Card / Netbanking / Wallet)
        ↓
Razorpay returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }
        ↓
Frontend → POST /api/payments/verify { ...razorpay_response, job_id }
        ↓
Backend verifies HMAC-SHA256 signature
        ↓
If valid → job.status = PAID → pi-agent picks up job
If invalid → 400 error, job stays PENDING
        ↓
(Async) Razorpay webhook → POST /api/payments/webhook
Backend double-confirms payment capture
```

---

## 6. Database Changes

Add payment tracking columns to the jobs table:

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);

-- The metadata JSONB column already stores additional payment info
```

Alternatively, store `razorpay_order_id` and `razorpay_payment_id` inside the existing `metadata` JSONB column (no schema changes needed).

---

## 7. Webhook Setup

1. Go to Razorpay Dashboard → **Settings → Webhooks**
2. Add webhook URL: `https://api.leprint.in/api/payments/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
4. Copy the **webhook secret** → set as `RAZORPAY_WEBHOOK_SECRET` in `.env`

Webhooks are a safety net. The frontend verify flow handles the happy path; webhooks catch edge cases (user closes browser after payment, network issues, etc.).

---

## 8. Testing

### Test Keys

Use test keys (`rzp_test_...`) — no real money is charged.

### Test Card Numbers

| Scenario | Card Number | CVV | Expiry |
|----------|-------------|-----|--------|
| Success | `4111 1111 1111 1111` | Any 3 digits | Any future date |
| Failure | `4000 0000 0000 0002` | Any 3 digits | Any future date |

### Test UPI

Any UPI ID works in test mode and simulates success.

### Testing Webhooks Locally

Use ngrok to expose your local backend:

```bash
ngrok http 3001
# Set the ngrok URL as webhook URL in Razorpay dashboard
```

### Test Checklist

- [ ] Order creation returns valid `order_id`
- [ ] Razorpay checkout opens with correct amount
- [ ] Successful payment transitions job to PAID
- [ ] Failed payment keeps job as PENDING
- [ ] Cancelled checkout returns to payment screen
- [ ] Webhook confirms payment.captured
- [ ] Webhook handles payment.failed

---

## 9. Going Live

1. Complete KYC on Razorpay dashboard
2. Generate **live keys** (`rzp_live_...`)
3. Update `backend/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   RAZORPAY_WEBHOOK_SECRET=whsec_live_xxxxx
   ```
4. Update webhook URL to production: `https://api.leprint.in/api/payments/webhook`
5. Verify HTTPS/SSL is valid
6. Test with a small real payment (₹1)

---

## 10. Security Checklist

- [ ] `RAZORPAY_KEY_SECRET` is never sent to the frontend
- [ ] Payment signature is verified on every payment (never trust frontend alone)
- [ ] Webhook signature is verified on every webhook
- [ ] Job ownership is checked before creating orders (`job.user_id === req.user.uid`)
- [ ] Job is checked for double-payment (`status !== PAID`)
- [ ] Amount is not accepted from frontend — backend calculates from job data
- [ ] `.env` file is in `.gitignore`

---

## 11. Refund Handling

If a print fails after payment, issue a refund:

```javascript
const rzp = require('./modules/razorpay');

// Full refund
await rzp.refund(payment_id);

// Partial refund (amount in INR)
await rzp.refund(payment_id, 5);
```

Refunds process in 5-7 business days for cards, instant for UPI.

---

## 12. Razorpay Pricing

- **2% per transaction** (standard plan)
- Example: ₹15 print → you receive ₹14.70, Razorpay takes ₹0.30
- No setup fees or monthly charges

---

## References

- [Razorpay Web Integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
- [Orders API](https://razorpay.com/docs/api/orders/)
- [Payment Verification](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#verify-payment-signature)
- [Webhooks](https://razorpay.com/docs/webhooks/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Node.js SDK](https://github.com/razorpay/razorpay-node)
