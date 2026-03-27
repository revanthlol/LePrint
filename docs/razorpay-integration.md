# Razorpay Integration Plan

> **Status:** Planning — no code implemented yet.
> This document outlines the technical design for integrating **Razorpay** as the payment gateway for LePrint.

---

## 1. Overview

LePrint is a self-service cloud printing platform where users pay per page/copy before their print jobs are dispatched. Razorpay will handle all online payments, ensuring PCI-DSS compliance without LePrint needing to directly handle sensitive card data.

**Why Razorpay:**
- PCI-DSS Level 1 compliant
- Strong presence in India with UPI, cards, net banking, and wallets
- Server-to-server hash verification (no client-side key exposure)
- Test environment available for development

---

## 2. Payment Flow

```
User uploads file
       │
       ▼
Frontend calculates price (pages × ₹3, copies × ₹5, etc.)
       │
       ▼
Frontend calls POST /api/jobs/create → Backend creates job (status: PENDING)
       │
       ▼
Frontend calls POST /api/payments/initiate
       │  ← Backend generates txnid, calculates hash, returns Razorpay form params
       ▼
Frontend auto-submits form to Razorpay checkout
       │
       ▼
User completes payment on Razorpay (UPI / card / net banking)
       │
       ├── Success → Razorpay redirects to /api/payments/success
       │                  Backend verifies hash → updates job status to PAID
       │                  Frontend shows success → job enters print queue
       │
       └── Failure → Razorpay redirects to /api/payments/failure
                          Backend marks payment as failed
                          Frontend shows retry option
```

---

## 3. Required Data

### Razorpay Form Parameters

| Parameter | Source | Description |
|-----------|--------|-------------|
| `key` | Backend env | Razorpay merchant key |
| `txnid` | Backend | Unique transaction ID (e.g., `LP_{jobId}_{timestamp}`) |
| `amount` | Backend | Total amount in INR (e.g., `9.00` for 3 pages) |
| `productinfo` | Backend | Job description (e.g., `Print: 3 pages`) |
| `firstname` | Frontend/Auth | User's display name |
| `email` | Frontend/Auth | User's email from Firebase |
| `phone` | Frontend | Optional, user-provided |
| `surl` | Backend | Success redirect URL |
| `furl` | Backend | Failure redirect URL |
| `hash` | Backend | SHA-512 hash (see Security section) |

### Hash Formula

```
sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
```

The hash **must** be generated server-side. The `salt` (merchant salt) is never exposed to the client.

---

## 4. Frontend Responsibilities

### Initiate Payment
1. After job creation, call `POST /api/payments/initiate` with `jobId`
2. Receive Razorpay form params (key, txnid, hash, amount, etc.)
3. Dynamically create and auto-submit a form to `https://secure.razorpay.in/_payment`

```jsx
// Pseudocode — Razorpay form submission
const form = document.createElement('form');
form.method = 'POST';
form.action = RAZORPAY_BASE_URL; // test or production

Object.entries(razorpayParams).forEach(([key, value]) => {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = key;
  input.value = value;
  form.appendChild(input);
});

document.body.appendChild(form);
form.submit();
```

### Handle Redirects
- **Success redirect:** `/payment/success?txnid=...` — show confirmation, poll job status
- **Failure redirect:** `/payment/failure?txnid=...` — show error, offer retry

### Show Status
- After successful payment, show "Payment confirmed — your print is being processed"
- Use existing WebSocket connection to show real-time print status updates

---

## 5. Backend Requirements

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/payments/initiate` | Generate Razorpay hash and form params |
| `POST` | `/api/payments/success` | Razorpay success callback — verify hash, update job |
| `POST` | `/api/payments/failure` | Razorpay failure callback — mark payment failed |
| `POST` | `/api/payments/webhook` | Razorpay server-to-server webhook (optional, recommended) |

### Initiate Payment Logic
```
1. Validate jobId, check job belongs to user, status is PENDING
2. Generate unique txnid
3. Calculate hash using merchant key + salt
4. Return all Razorpay form params to frontend
5. Store txnid in job record for later verification
```

### Verify Payment Logic
```
1. Receive Razorpay redirect with transaction data
2. Recalculate reverse hash: sha512(salt|status||||||udf5|...|email|firstname|productinfo|amount|txnid|key)
3. Compare with Razorpay's posted hash
4. If match → update job status to PAID, trigger print queue
5. If mismatch → log alert, do NOT update job
```

### Database Changes
```sql
-- Add payment columns to jobs table
ALTER TABLE jobs ADD COLUMN payment_txnid VARCHAR(64);
ALTER TABLE jobs ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN payment_amount DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN payment_verified_at TIMESTAMPTZ;
```

---

## 6. Security Considerations

| Risk | Mitigation |
|------|-----------|
| Merchant salt exposure | Salt stored in backend `.env` only, never sent to frontend |
| Hash tampering | Hash generated server-side, verified on callback using reverse hash |
| Replay attacks | Each `txnid` is unique and single-use |
| Amount manipulation | Amount calculated server-side from job data, not from client input |
| Webhook spoofing | Validate Razorpay webhook IP whitelist + hash verification |
| Failed payment exploitation | Job stays `PENDING` until hash-verified payment confirmation |

### Environment Variables (Backend)

```env
RAZORPAY_MERCHANT_KEY=your_merchant_key
RAZORPAY_MERCHANT_SALT=your_merchant_salt
RAZORPAY_BASE_URL=https://test.razorpay.in/_payment    # test
# RAZORPAY_BASE_URL=https://secure.razorpay.in/_payment  # production
```

---

## 7. Implementation Notes

### Where It Plugs In

| Current File | Change |
|-------------|--------|
| `frontend/src/components/Print/PrintInterface.jsx` | Add "Pay Now" button after file upload, call initiate endpoint |
| `frontend/src/App.jsx` | Add `/payment/success` and `/payment/failure` routes |
| `backend/index.js` | Mount new payment routes |
| `backend/modules/` | New `payment-routes.js` file |
| `backend/schema.sql` | Add payment columns to `jobs` table |

### Suggested File Structure

```
backend/modules/
├── payment-routes.js    # /api/payments/* endpoints
└── payment-utils.js     # Hash generation, verification helpers

frontend/src/components/
├── Payment/
│   ├── PaymentSuccess.jsx
│   └── PaymentFailure.jsx
```

### Test vs Production

| | Test | Production |
|---|------|-----------|
| URL | `https://test.razorpay.in/_payment` | `https://secure.razorpay.in/_payment` |
| Key/Salt | Test credentials from Razorpay dashboard | Production credentials |
| Cards | Razorpay test cards (see Razorpay docs) | Real cards |

### Implementation Order
1. Backend: payment routes + hash logic
2. Database: add payment columns
3. Frontend: payment initiation + redirect pages
4. Integration testing with Razorpay test environment
5. Go live with production credentials
