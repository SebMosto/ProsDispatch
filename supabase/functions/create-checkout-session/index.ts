// Using Deno 2 compatible imports
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createStripeClient, createCheckoutSession, Stripe } from "../_shared/stripe.ts";
import { getErrorStatus } from "../_shared/errors.ts";
import { validateReturnUrl } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate required environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl = Deno.env.get("SITE_URL");

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

    const stripe = createStripeClient(stripeSecretKey);

    const { priceId, returnUrl } = await req.json();

    if (!priceId) {
      throw new Error("Missing priceId");
    }

    if (!returnUrl) {
      throw new Error("Missing returnUrl");
    }

    // Validate returnUrl to prevent Open Redirect
    // This will throw an error if validation fails
    validateReturnUrl(returnUrl, siteUrl);

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
    const session = await createCheckoutSession(stripe, sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-checkout-session:", error);

    const statusCode = getErrorStatus(error);

    // Security: Do not expose raw error messages to the client.
    let publicMessage = "Internal Server Error";

    if (statusCode === 400) {
      // For 400s, it's often helpful to know *what* was wrong, but we must be careful.
      // We will allow specific known safe errors.
      publicMessage = "Bad Request";

      // SECURITY: We expose certain client-facing errors but hide server configuration errors.
      if (error instanceof Error) {
        if (error.message.startsWith("Missing ") ||
            (error.message.startsWith("Invalid ") && !error.message.includes("Internal Server Error"))) {
           publicMessage = error.message;
        }
      }
    } else if (statusCode === 401) {
      publicMessage = "Unauthorized";
    }

    return new Response(JSON.stringify({ error: publicMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
