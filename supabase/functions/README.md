# Supabase Edge Functions

This directory contains Supabase Edge Functions for handling Stripe integration.

## Functions

### 1. stripe-webhook-handler
Handles Stripe webhook events to sync subscription status with Supabase.

**Events handled:**
- `payment_intent.succeeded` - Marks invoice as paid, expires token, transitions job to paid
- `checkout.session.completed` - Links Stripe customer to user profile
- `customer.subscription.created` - Creates new subscription record
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as cancelled
- `account.updated` - Updates `stripe_connect_onboarded` on contractor profile

**Environment Variables Required:**
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for bypassing RLS)

### 2. create-checkout-session
Creates a Stripe Checkout session for new subscriptions.

**Authentication:** Requires valid Supabase auth token

**Request Body:**
```json
{
  "priceId": "price_xxx",
  "returnUrl": "https://your-app.com/dashboard"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Environment Variables Required:**
- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 3. create-portal-session
Creates a Stripe Customer Portal session for managing subscriptions.

**Authentication:** Requires valid Supabase auth token

**Request Body:**
```json
{
  "returnUrl": "https://your-app.com/dashboard"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

**Environment Variables Required:**
- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Development

### Prerequisites
- Deno 2.x
- Supabase CLI

### Local Testing
```bash
# Start Supabase locally
supabase start

# Serve a specific function
supabase functions serve stripe-webhook-handler --env-file .env.local

# Invoke a function
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/stripe-webhook-handler' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```

### Deployment
```bash
# Deploy all functions
supabase functions deploy

# Deploy a specific function
supabase functions deploy stripe-webhook-handler

# Set environment variables (secrets)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## Configuration

### Deno Configuration
The `deno.json` file in this directory configures:
- Import maps for dependencies
- TypeScript compiler options
- Test configuration

### Stripe Webhook Setup
1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter your function URL: `https://your-project.supabase.co/functions/v1/stripe-webhook-handler`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `account.updated`
5. Copy the signing secret and set it as `STRIPE_WEBHOOK_SECRET`

## Database Schema

These functions expect the following tables:

### profiles
- `id` (uuid, references auth.users)
- `stripe_customer_id` (text, nullable)
- `subscription_status` (text, nullable)
- `subscription_end_date` (timestamp, nullable)
- `stripe_connect_id` (text, nullable)
- `stripe_connect_onboarded` (boolean, nullable)

### stripe_events
- `id` (text, primary key) - Stripe event ID
- `type` (text) - Event type
- `status` (text) - Processing status (pending, processed, failed)
- `event_created_at` (timestamp) - When Stripe created the event

## Security

- All functions use environment variables for sensitive data
- JWT verification is enabled by default (no `--no-verify-jwt`)
- CORS is configured to allow requests from your frontend
- Row Level Security (RLS) is bypassed only for webhook processing using service role key

## Compatibility

- **Deno Version:** 2.x
- **Stripe API Version:** 2023-10-16
- **Supabase CLI:** Latest
