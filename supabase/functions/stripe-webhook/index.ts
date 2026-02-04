import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Stripe Webhook Function Initialized")

Deno.serve(async (req) => {
  try {
    // 1. Setup & Secrets
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing environment variables")
      return new Response("Server Configuration Error", { status: 500 })
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 2. Verify Signature
    const signature = req.headers.get('Stripe-Signature')
    if (!signature) {
      return new Response("No signature header", { status: 400 })
    }

    const body = await req.text()
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // 3. Idempotency Guard
    const { data: existingEvent, error: lookupError } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .maybeSingle()

    if (lookupError) {
      console.error('Error looking up existing event:', lookupError)
      return new Response('Database error during idempotency check', { status: 500 })
    }

    if (existingEvent) {
      console.log(`Event ${event.id} already processed. Skipping.`)
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    // Insert event first (optimistic processing or log-then-process)
    const { error: insertError } = await supabase
      .from('stripe_events')
      .insert({
        id: event.id,
        type: event.type,
        event_created_at: new Date(event.created * 1000).toISOString(),
        status: 'pending'
      })

    // 23505 is duplicate key error - in case of race condition
    if (insertError && insertError.code !== '23505') {
      console.error('Failed to log event:', insertError)
      return new Response("Database Error", { status: 500 })
    } else if (insertError && insertError.code === '23505') {
         console.log(`Event ${event.id} already processed (race condition). Skipping.`)
         return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          })
    }

    // 4. Event Handlers
    console.log(`Processing event: ${event.type}`)

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object
          const userId = session.client_reference_id
          const customerId = session.customer

          if (userId && customerId) {
            const { error } = await supabase
              .from('profiles')
              .update({
                stripe_customer_id: customerId,
                subscription_status: 'active'
              })
              .eq('id', userId)

            if (error) throw error
          }
          break
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object
          const customerId = subscription.customer
          const status = subscription.status
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: status,
              subscription_end_date: currentPeriodEnd
            })
            .eq('stripe_customer_id', customerId)

          if (error) throw error
          break
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object
          const customerId = subscription.customer

          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'canceled'
            })
            .eq('stripe_customer_id', customerId)

          if (error) throw error
          break
        }

        default:
          console.log(`Unhandled event type ${event.type}`)
      }

      // Update event status to processed
      await supabase
        .from('stripe_events')
        .update({ status: 'processed' })
        .eq('id', event.id)

    } catch (processError) {
      console.error('Error processing event:', processError)
      // Update event status to failed
      await supabase
        .from('stripe_events')
        .update({ status: 'failed' })
        .eq('id', event.id)

      return new Response("Processing Error", { status: 500 })
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (err) {
    console.error(`Unexpected error: ${err.message}`)
    return new Response("Internal Server Error", { status: 500 })
  }
})
