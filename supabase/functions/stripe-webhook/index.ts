// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

console.log("Stripe Webhook Function Initialized");

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("Error: No Stripe Signature", { status: 400 });
  }

  // secrets are automatically injected by the Supabase CLI
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    return new Response("Error: Missing Environment Variables", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let event;

  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Received event: ${event.type}`);

  // Log the event to the database (audit trail)
  try {
    await supabase.from("stripe_events").insert({
      id: event.id,
      type: event.type,
      status: "pending",
      event_created_at: new Date(event.created * 1000).toISOString(),
    });
  } catch (err) {
    console.error("Failed to log event:", err);
    // Non-blocking, continue processing
  }

  // Handle specific events
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription") {
          const customerId = session.customer;
          const userId = session.client_reference_id; // Passed from frontend during checkout creation

          if (userId && customerId) {
            await supabase
              .from("profiles")
              .update({
                stripe_customer_id: customerId,
                subscription_status: "active", // Assume active on success, subscription.created will confirm
              })
              .eq("id", userId);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        // Update profile based on customer_id
        await supabase
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_end_date: currentPeriodEnd.toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Update event status to processed
    await supabase
      .from("stripe_events")
      .update({ status: "processed" })
      .eq("id", event.id);

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(`Error processing event: ${err.message}`);

    // Log failure
    await supabase
      .from("stripe_events")
      .update({ status: "failed" })
      .eq("id", event.id);

    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
