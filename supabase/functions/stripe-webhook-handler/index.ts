import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response("Server Configuration Error", { status: 500 });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    async function updateProfileByCustomerId(
      customerId: string,
      updates: Partial<{ subscription_status: string; subscription_end_date: string }>,
    ) {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("stripe_customer_id", customerId);

      if (error) {
        console.error("Profile update failed:", error.message);
        // No PII in logs — do not log customerId or email
      }
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature header", { status: 400 });
    }

    const body = await req.text();
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(`Webhook Error: ${message}`, { status: 400 });
    }

    // Persist core event metadata for observability / idempotency
    try {
      await supabase.from("stripe_events").insert({
        id: event.id,
        type: event.type,
        event_created_at: new Date(event.created * 1000).toISOString(),
        status: "pending",
      });
    } catch {
      // Non-fatal; continue processing
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = (pi.metadata && pi.metadata.invoice_id) || null;

        if (!invoiceId) {
          break;
        }

        // Fetch invoice
        const { data: invoice } = await supabase
          .from("invoices")
          .select("id, job_id, status, stripe_payment_intent_id")
          .eq("id", invoiceId)
          .single<{ id: string; job_id: string; status: string; stripe_payment_intent_id: string | null }>();

        if (!invoice) {
          break;
        }

        // Idempotency: if already paid, noop
        if (invoice.status === "paid") {
          break;
        }

        // Update invoice to paid
        await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            payment_method: "stripe",
            stripe_payment_intent_id: pi.id,
          })
          .eq("id", invoice.id);

        // Expire associated token(s)
        await supabase
          .from("invoice_tokens")
          .update({ expires_at: new Date().toISOString() })
          .eq("invoice_id", invoice.id);

        // Transition job status to paid via existing state machine RPC
        if (invoice.job_id) {
          await supabase.rpc("transition_job_state", {
            job_id: invoice.job_id,
            new_status: "paid",
          });
        }

        break;
      }
      case "payment_intent.payment_failed": {
        // Intentionally minimal: leave invoice in 'sent' status so homeowner can retry.
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn("Payment failed for invoice", {
          invoice_id: pi.metadata?.invoice_id,
        });
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const accountId = account.id;

        if (!accountId) break;

        const onboardingComplete = Boolean(account.charges_enabled && account.payouts_enabled);

        await supabase
          .from("profiles")
          .update({
            stripe_connect_onboarded: onboardingComplete,
          })
          .eq("stripe_connect_id", accountId);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") {
          break;
        }
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!customerId || !subscriptionId) {
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await updateProfileByCustomerId(customerId, {
          subscription_status: subscription.status,
          subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string | null;

        if (!customerId) {
          break;
        }

        await updateProfileByCustomerId(customerId, {
          subscription_status: subscription.status,
          subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string | null;

        if (!customerId) {
          break;
        }

        await updateProfileByCustomerId(customerId, {
          subscription_status: "canceled",
          subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string | null;

        if (!customerId) {
          break;
        }

        await updateProfileByCustomerId(customerId, {
          subscription_status: "past_due",
        });
        break;
      }
      default:
        // Other events are recorded in stripe_events but not acted upon here.
        break;
    }

    // Mark event as processed
    try {
      await supabase
        .from("stripe_events")
        .update({ status: "processed" })
        .eq("id", event.id);
    } catch {
      // Non-fatal
    }

    return new Response(
      JSON.stringify({
        received: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Webhook error: ${message}`);
    return new Response("Internal Server Error", { status: 500 });
  }
});

