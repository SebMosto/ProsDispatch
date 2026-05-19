// Using Deno 2 compatible imports
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getErrorStatus } from "../_shared/errors.ts";
import { validateReturnUrl } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
};

type ProfileRow = {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !stripeSecretKey) {
    return new Response(JSON.stringify({ error: "Missing required environment variables" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await authedClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Parse and validate returnUrl from client (used for safety only)
    const { returnUrl }: { returnUrl?: string | null } = await req.json().catch(() => ({ returnUrl: null }));
    const defaultReturnUrl = `${SITE_URL}/dashboard`;
    const safeReturnUrl = validateReturnUrl(returnUrl ?? defaultReturnUrl);
    // We intentionally do not pass the raw client returnUrl to Stripe; this call
    // exists to enforce the open-redirect mitigation pattern from sentinel.md.
    void safeReturnUrl;

    // Load contractor profile with service role to manage billing fields
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, email, stripe_customer_id")
      .eq("id", user.id)
      .single<ProfileRow>();

    if (profileError) {
      console.error("Error fetching profile for checkout session");
      return new Response(JSON.stringify({ error: "Unable to load profile" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Ensure we have or create a platform Stripe customer for SaaS billing
    let stripeCustomerId = profile.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile.email ?? user.email ?? undefined,
        metadata: {
          contractor_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      const { error: updateError } = await serviceClient
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);

      if (updateError) {
        console.error("Failed to persist Stripe customer ID on profile");
        return new Response(JSON.stringify({ error: "Unable to start subscription" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
    }

    // Resolve Price via lookup key (no hardcoded IDs)
    const prices = await stripe.prices.list({
      lookup_keys: ["prosdispatch_monthly"],
      active: true,
    });

    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "No active price found for prosdispatch_monthly" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const price = prices.data.sort((a, b) => b.created - a.created)[0];

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { contractor_id: user.id },
      },
      success_url: `${SITE_URL}/dashboard?subscribed=true`,
      cancel_url: `${SITE_URL}/subscribe?cancelled=true`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-checkout-session:", error);

    const statusCode = getErrorStatus(error);

    let publicMessage = "Internal Server Error";

    if (statusCode === 400) {
      publicMessage = "Bad Request";

      if (error instanceof Error) {
        if (error.message.startsWith("Missing ") || error.message.startsWith("Invalid ")) {
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

