import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { validateReturnUrl } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProfileRow = {
  id: string;
  stripe_connect_id: string | null;
  stripe_connect_onboarded: boolean | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { returnUrl } = await req.json().catch(() => ({ returnUrl: null as string | null }));
    const safeReturnUrl = validateReturnUrl(returnUrl ?? `${SITE_URL}/settings/stripe`);

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get current user
    const {
      data: { user },
      error: authError,
    } = await authed.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Load or create Stripe Connect account id on profile
    const { data: profile } = await service
      .from("profiles")
      .select("id, stripe_connect_id, stripe_connect_onboarded")
      .eq("id", user.id)
      .single<ProfileRow>();

    let connectAccountId = profile?.stripe_connect_id ?? null;

    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        country: "CA",
        email: user.email ?? undefined,
        capabilities: {
          transfers: { requested: true },
        },
      });

      connectAccountId = account.id;

      await service
        .from("profiles")
        .update({
          stripe_connect_id: connectAccountId,
          stripe_connect_onboarded: false,
        })
        .eq("id", user.id);
    }

    // 3. Create account link for onboarding / refresh
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: safeReturnUrl,
      return_url: safeReturnUrl,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({
        url: accountLink.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("create-connect-onboarding error", { message });
    return new Response(JSON.stringify({ error: "Failed to create onboarding link" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

