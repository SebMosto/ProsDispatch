// DEBUG MODE: Stripe Webhook
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Creating Edge Function Handler...")

serve(async (req) => {
  // 1. Log the Request immediately
  console.log("Received Webhook Request:", req.method, req.url)

  // 2. Check Envs
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  // LOG THE SECRETS (Safe for local dev ONLY - Don't commit this!)
  console.log("Secret Check:", {
    hasStripeKey: !!STRIPE_SECRET_KEY,
    hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
    webhookSecretPreview: STRIPE_WEBHOOK_SECRET ? STRIPE_WEBHOOK_SECRET.slice(0, 5) + "..." : "MISSING"
  })

  // 3. Initialize
  const stripe = new Stripe(STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 4. Verify Signature
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  console.log("Signature Header:", signature ? "Present" : "Missing")

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, STRIPE_WEBHOOK_SECRET!)
    console.log("Signature Verified! Event Type:", event.type)
  } catch (err) {
    console.error(">>> SIGNATURE VERIFICATION FAILED <<<")
    console.error(err.message)
    return new Response(err.message, { status: 400 })
  }

  // 5. Database Test
  console.log("Attempting DB Insert...")
  const { error } = await supabase.from('stripe_events').insert({
    id: event.id,
    type: event.type,
    event_created_at: new Date(event.created * 1000).toISOString(),
    status: 'pending'
  })

  if (error) {
    console.error(">>> DB INSERT FAILED <<<")
    console.error(error)
    return new Response("DB Error", { status: 500 })
  }

  console.log(">>> SUCCESS: Row Inserted <<<")
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
