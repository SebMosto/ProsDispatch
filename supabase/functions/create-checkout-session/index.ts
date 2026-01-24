// Using Deno 2 compatible imports
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to determine appropriate HTTP status code based on error
function getErrorStatus(error: Error): number {
  const message = error.message.toLowerCase();
  
  // 401 Unauthorized - authentication issues
  if (message.includes("unauthorized") || message.includes("not authenticated")) {
    return 401;
  }
  
  // 404 Not Found - resource not found
  if (message.includes("not found") || message.includes("no stripe customer")) {
    return 404;
  }
  
  // 400 Bad Request - client errors (missing fields, invalid input)
  if (message.includes("missing") || message.includes("invalid") || message.includes("required")) {
    return 400;
  }
  
  // 500 Internal Server Error - unexpected errors, Stripe API errors, database errors
  return 500;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    // Authenticate User
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { priceId, returnUrl } = await req.json();

    if (!priceId) {
      throw new Error("Missing priceId");
    }

    // Check if user already has a customer ID
    // Note: We use the service role key internally if we need to write,
    // but here we are just reading from the user context or we might need to query the profile.
    // Ideally, the profile should be fetched.

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id, // Critical: links checkout to user
      customer_email: user.email,   // Pre-fills email
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      subscription_data: {
        trial_period_days: 14,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const status = getErrorStatus(error);
    console.error(`Error creating checkout session (${status}):`, error.message);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
