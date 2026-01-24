// Using Deno 2 compatible imports
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate required environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !stripeKey) {
    return new Response(JSON.stringify({ error: "Missing Environment Variables" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // Validate Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    // Validate required environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Authenticate User
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { priceId, returnUrl } = await req.json();

    if (!priceId) {
      throw new Error("Missing priceId");
    }

    if (!returnUrl) {
      throw new Error("Missing returnUrl");
    }

    // Fetch user's profile to check for existing Stripe customer ID
    // Using maybeSingle() to gracefully handle cases where profile doesn't exist yet
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    // If there's an error fetching the profile (e.g., RLS issue), log and continue
    // This allows checkout to proceed even if profile fetch fails
    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Build checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      subscription_data: {
        trial_period_days: 14,
      },
    };

    // If user already has a Stripe customer ID, reuse it
    // Otherwise, Stripe will create a new customer during checkout
    if (profile?.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id;
    } else {
      // New customer: link via client_reference_id and pre-fill email
      sessionParams.client_reference_id = user.id;
      sessionParams.customer_email = user.email;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-checkout-session:", error);
    
    // Determine appropriate status code based on error type
    let statusCode = 500; // Default to server error
    let errorMessage = "Internal server error";

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Authentication/Authorization errors -> 401
      // Check for exact match first to avoid false positives
      if (errorMessage === "Unauthorized") {
        statusCode = 401;
      }
      // Client validation errors -> 400
      // These are errors caused by missing or invalid request parameters
      else if (errorMessage.startsWith("Missing ") || 
               errorMessage.startsWith("Invalid ") ||
               errorMessage === "No Stripe Customer found for this user") {
        statusCode = 400;
      }
      // Stripe API errors -> 500 (server-side issue)
      // Check error name for Stripe-specific errors
      else if (error.name?.includes("Stripe")) {
        statusCode = 500;
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
